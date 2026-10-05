import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("GENERAL", () => {
  test("comando invalido", () => {
    const app = createGasTestRuntime();

    app.sendMessage("Cualquier cosa");

    expect(app.lastMessage()).toContain("Elegí un comando válido.");
  });

  test("cancelar operacion", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullIngreso)

    app.sendMessage("cancelar");

    expect(app.lastMessage()).toContain("Operación cancelada.");

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(0);
  });

  test("doPost captura errores de JSON inválido", () => {
    const app = createGasTestRuntime();

    app.doPost({
      postData: {
        contents: "{json-invalido"
      }
    });

    expect(app.messages().join("\n")).toContain("Hubo un error");
  });

  test("doPost ignora mensajes de otro chat", () => {
    const app = createGasTestRuntime();

    const TELEGRAM_CHAT_ID = testUtils.getGlobal(app, "TELEGRAM_CHAT_ID");

    app.doPost({
      postData: {
        contents: JSON.stringify({
          message: {
            text: "COMANDOS",
            chat: {
              id: TELEGRAM_CHAT_ID + 999
            }
          }
        })
      }
    });

    expect(app.messages()).toHaveLength(0);
  });

  test("cancelar una operación no elimina otras Script Properties", () => {
    const app = createGasTestRuntime();

    app.props.set("SUPABASE_URL", "https://example.supabase.co");
    app.props.set("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    app.props.set("123", JSON.stringify({ flow: "CREATE_EXPENSE" }));

    const cancelCurrentState = testUtils.getGlobal(app, "cancelCurrentState_");

    cancelCurrentState("123");

    expect(app.props.get("123")).toBeUndefined();
    expect(app.props.get("SUPABASE_URL")).toBe("https://example.supabase.co");
    expect(app.props.get("SUPABASE_PUBLISHABLE_KEY")).toBe("sb_publishable_test");
  });
});