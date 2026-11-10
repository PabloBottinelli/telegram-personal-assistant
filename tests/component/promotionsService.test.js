import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("PromotionsService", () => {
  test("trae todas las páginas sin recortar la RPC a 10 filas", () => {
    const app = createGasTestRuntime();
    app.props.set("SUPABASE_URL", "https://example.supabase.co/");
    app.props.set("SUPABASE_PUBLISHABLE_KEY", "public-key");
    const requests = [];
    const all = Array.from({ length: 101 }, (_, index) => ({ source_id: String(index) }));

    app.context.UrlFetchApp.fetch = (url, options) => {
      requests.push({ url, options });
      const [start, end] = options.headers.Range.split("-").map(Number);
      const page = all.slice(start, end + 1);
      return {
        getResponseCode: () => page.length < end - start + 1 ? 200 : 206,
        getContentText: () => JSON.stringify(page),
        getAllHeaders: () => ({ "Content-Range": `${start}-${start + page.length - 1}/${all.length}` })
      };
    };

    const promotions = testUtils.getGlobal(app, "PromotionsService").search("viamo");

    expect(promotions).toHaveLength(101);
    expect(promotions.at(-1).source_id).toBe("100");
    expect(requests).toHaveLength(2);
    expect(requests[0].options.headers.Range).toBe("0-99");
    expect(requests[1].options.headers.Range).toBe("100-199");
    expect(requests[0].url).toBe("https://example.supabase.co/rest/v1/rpc/search_promotions");
    expect(JSON.parse(requests[0].options.payload)).toEqual({ query: "viamo", result_limit: 2147483647 });
  });

  test("continúa si Supabase devuelve páginas menores a PAGE_SIZE", () => {
    const app = createGasTestRuntime();
    app.props.set("SUPABASE_URL", "https://example.supabase.co");
    app.props.set("SUPABASE_PUBLISHABLE_KEY", "public-key");
    const ranges = [];
    app.context.UrlFetchApp.fetch = (_url, options) => {
      const [start] = options.headers.Range.split("-").map(Number);
      ranges.push(start);
      const all = [{ source_id: "0" }, { source_id: "1" }, { source_id: "2" }];
      const page = all.slice(start, start + 2);
      return {
        getResponseCode: () => 206,
        getContentText: () => JSON.stringify(page),
        getAllHeaders: () => ({ "content-range": `${start}-${start + page.length - 1}/3` })
      };
    };

    const result = testUtils.getGlobal(app, "PromotionsService").search("viamo");
    expect(result).toHaveLength(3);
    expect(ranges).toEqual([0, 2]);
  });

  test.each([401, 500])(
    "lanza un error cuando Supabase responde HTTP %i",
    statusCode => {
      const app = createGasTestRuntime();

      app.props.set(
        "SUPABASE_URL",
        "https://example.supabase.co"
      );

      app.props.set(
        "SUPABASE_PUBLISHABLE_KEY",
        "test-key"
      );

      app.context.UrlFetchApp.fetch = () => ({
        getResponseCode: () => statusCode,
        getContentText: () => '{"error":"simulado"}'
      });

      const service = testUtils.getGlobal(
        app,
        "PromotionsService"
      );

      expect(() => service.search("viamo"))
        .toThrow(`Error consultando promociones (${statusCode})`);
    }
  );

  test("rechaza respuestas JSON inválidas de Supabase", () => {
    const app = createGasTestRuntime();

    app.props.set(
      "SUPABASE_URL",
      "https://example.supabase.co"
    );

    app.props.set(
      "SUPABASE_PUBLISHABLE_KEY",
      "test-key"
    );

    app.context.UrlFetchApp.fetch = () => ({
      getResponseCode: () => 200,
      getContentText: () => "{json-invalido"
    });

    const service = testUtils.getGlobal(
      app,
      "PromotionsService"
    );

    expect(() => service.search("viamo")).toThrow();
  });
});
