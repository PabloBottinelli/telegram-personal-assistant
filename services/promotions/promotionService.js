const PromotionsService = {
  // Valor máximo de un integer en PostgreSQL: evita recortar la búsqueda en la RPC.
  // Se pagina en REST porque Supabase/PostgREST también puede limitar las filas por respuesta.
  RPC_RESULT_LIMIT: 2147483647,
  PAGE_SIZE: 100,

  search(query) {
    const properties = PropertiesService.getScriptProperties();
    const supabaseUrl = properties.getProperty("SUPABASE_URL");
    const supabaseKey = properties.getProperty("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Faltan las credenciales de Supabase");
    }

    const promotions = [];
    let offset = 0;

    while (true) {
      const response = UrlFetchApp.fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/search_promotions`, {
        method: "post",
        contentType: "application/json",
        headers: {
          apikey: supabaseKey,
          "Range-Unit": "items",
          Range: `${offset}-${offset + this.PAGE_SIZE - 1}`,
          Prefer: "count=exact"
        },
        payload: JSON.stringify({
          query,
          result_limit: this.RPC_RESULT_LIMIT
        }),
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();
      const body = response.getContentText();

      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`Error consultando promociones (${statusCode}): ${body}`);
      }

      const page = JSON.parse(body);
      if (!Array.isArray(page)) {
        throw new Error("La búsqueda de promociones devolvió una respuesta inesperada");
      }

      if (page.length === 0) break;

      promotions.push(...page);
      offset += page.length;

      // Con count=exact se detecta el final incluso si Supabase impone menos filas
      // que PAGE_SIZE. Sin Content-Range, una página parcial indica fin de resultados.
      const headers = typeof response.getAllHeaders === "function" ? response.getAllHeaders() : {};
      const contentRangeKey = Object.keys(headers).find(key => key.toLowerCase() === "content-range");
      const contentRange = contentRangeKey ? String(headers[contentRangeKey]) : "";
      const totalMatch = contentRange.match(/\/(\d+)$/);

      if (totalMatch && offset >= Number(totalMatch[1])) break;
      if (!totalMatch && page.length < this.PAGE_SIZE) break;
    }

    return promotions;
  }
};
