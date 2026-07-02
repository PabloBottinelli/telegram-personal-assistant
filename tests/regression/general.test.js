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
});