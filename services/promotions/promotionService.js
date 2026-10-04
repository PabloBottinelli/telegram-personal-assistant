const PromotionsService = {
    search(query, limit = 10) {
        const properties = PropertiesService.getScriptProperties();
        const supabaseUrl = properties.getProperty('SUPABASE_URL');
        const supabaseKey = properties.getProperty('SUPABASE_PUBLISHABLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan las credenciales de Supabase');
        }

        const response = UrlFetchApp.fetch(`${supabaseUrl}/rest/v1/rpc/search_promotions`, {
            method: 'post',
            contentType: 'application/json',
            headers: {
                apikey: supabaseKey,
            },
            payload: JSON.stringify({
                query: query,
                result_limit: limit,
            }),
            muteHttpExceptions: true,
        });

        const statusCode = response.getResponseCode();
        const body = response.getContentText();

        if (statusCode < 200 || statusCode >= 300) {
            throw new Error(`Error consultando promociones (${statusCode}): ${body}`);
        }

        return JSON.parse(body);
    },
};
