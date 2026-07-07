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

  test("listar categorias lista correctamente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    app.sendMessage("Categorias")

    expect(app.lastMessage()).toContain("Super")
    expect(app.lastMessage()).toContain("Ajeno")
    expect(app.lastMessage()).toContain("Comida")
  })

  test("doPost captura errores de JSON inválido", () => {
    const app = createGasTestRuntime();

    app.doPost({
      postData: {
        contents: "{json-invalido"
      }
    });

    expect(app.lastMessage()).toContain("Hubo un error");
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
});