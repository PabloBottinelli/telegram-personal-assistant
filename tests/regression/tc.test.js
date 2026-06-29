import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";

function fullTC({
  fecha = "10/06",
  monto = "12000",
  moneda = "ARS",
  ahorro = "0",
  cuotas = "3",
  detalle = "Compra con tarjeta",
  tipo = "-",
  reintegrado = "-"
} = {}) {
    return ["TC", fecha, monto, moneda, ahorro, cuotas, detalle, tipo, reintegrado].join("\n");
}

function seedCategorias(app, rows = [
  ["Super", "CAT-1"],
  ["Ajeno", "CAT-2"],
  ["Comida", "CAT-3"]
]) {
  appendRowsByConfig(app, "SHEET_CATEGORIAS", rows);
}

function seedTarjetas(app, rows = [
  ["BBVA Visa", "", "", "", "", "TAR-1"],
  ["Galicia Mastercard", "", "", "", "", "TAR-2"]
]) {
  appendRowsByConfig(app, "SHEET_TARJETAS", rows);
}

function seedDeudores(app, rows = [
  ["Juan", "DEUDOR-1"]
]) {
  appendRowsByConfig(app, "SHEET_DEUDORES", rows);
}

describe("TC", () => {
  test("guarda una compra con tarjeta correctamente", () => {
    const app = createGasTestRuntime();

    const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
    const CATEGORIA_LISTA_FOOTER = getGlobal(app, "CATEGORIA_LISTA_FOOTER");
    const TARJETA_LISTA_HEADER = getGlobal(app, "METODO_TARJETA_LISTA_HEADER");
    const TARJETA_LISTA_FOOTER = getGlobal(app, "METODO_TARJETA_LISTA_FOOTER");

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC());

    const categoryMsg = app.lastMessage();

    expect(categoryMsg).toContain(CATEGORIA_LISTA_HEADER);
    expect(categoryMsg).toContain(CATEGORIA_LISTA_FOOTER);
    expect(categoryMsg).toContain("Super");
    expect(categoryMsg).toContain("Ajeno");
    expect(categoryMsg).toContain("Comida");

    app.sendMessage("1");

    const cardMsg = app.lastMessage();

    expect(cardMsg).toContain(TARJETA_LISTA_HEADER);
    expect(cardMsg).toContain(TARJETA_LISTA_FOOTER);
    expect(cardMsg).toContain("BBVA Visa");
    expect(cardMsg).toContain("Galicia Mastercard");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    const deudasTarjeta = sheetRowsByConfig(app, "SHEET_CUOTAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);
    const deudaTarjeta = rowToObject(SHEET_CUOTAS.headers, deudasTarjeta[0]);

    expect(gasto["Fecha"]).toBeInstanceOf(Date);
    expect(gasto["Fecha"].getDate()).toBe(10);
    expect(gasto["Fecha"].getMonth()).toBe(5);
    expect(gasto["Fecha"].getFullYear()).toBe(2026);
    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Moneda"]).toBe("ARS");
    expect(gasto["Ahorro"]).toBe(0);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("-");
    expect(gasto["Reintegrado?"]).toBe(true);
    expect(gasto["ID"]).toMatch(/^GAS-/);

    expect(deudaTarjeta["Medio de pago"]).toBe("BBVA Visa");
    expect(deudaTarjeta["Monto"]).toBe(12000);
    expect(deudaTarjeta["#Cuotas"]).toBe(3);
    expect(deudaTarjeta["#CuotasRestantes"]).toBe(3);
    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("si la categoría es AJENO, pide deudor y crea deuda personal vinculada por el total", () => {
    const app = createGasTestRuntime();

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");
    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");

    seedCategorias(app);
    seedTarjetas(app);
    seedDeudores(app);

    app.sendMessage(fullTC());

    app.sendMessage("2"); // Ajeno
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Elegí el deudor");
    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("1"); // Juan

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    const deudasTarjeta = sheetRowsByConfig(app, "SHEET_CUOTAS");
    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);
    const deudaTarjeta = rowToObject(SHEET_CUOTAS.headers, deudasTarjeta[0]);
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(gasto["Categoría"]).toBe("Ajeno");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);

    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);

    expect(deuda["Persona/Entidad"]).toBe("Juan");
    expect(deuda["Monto"]).toBe(12000);
    expect(deuda["Monto Pendiente"]).toBe(12000);
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("cantidad de líneas menor a la esperada", () => {
    const app = createGasTestRuntime();

    const FORMATS = getGlobal(app, "FORMATS");

    app.sendMessage([
      "TC",
      "10/06"
    ].join("\n"));

    expect(app.lastMessage()).toContain("Usá el formato correcto");
    expect(app.lastMessage()).toContain(FORMATS["TC"]);
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("inputs inválidos", () => {
    const app = createGasTestRuntime();

    app.sendMessage(fullTC({
      fecha: "10/23",
      monto: "50s00",
      moneda: "ARSs",
      ahorro: "-1",
      cuotas: "x",
      tipo: "m",
      reintegrado: "n"
    }));

    expect(app.lastMessage()).toContain("Fecha inválida");
    expect(app.lastMessage()).toContain("Monto inválido");
    expect(app.lastMessage()).toContain("Moneda inválida");
    expect(app.lastMessage()).toContain("Ahorro inválido");
    expect(app.lastMessage()).toContain("#Cuotas inválido");
    expect(app.lastMessage()).toContain("Valor inválido en reintegrado");
    expect(app.lastMessage()).toContain("Tipo inválido");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("si elige una categoría inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC());

    app.sendMessage("30");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una categoría");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(1);
  });

  test("si elige una tarjeta inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC());

    app.sendMessage("1"); 

    expect(app.lastMessage()).toContain("BBVA Visa");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una tarjeta");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(1);
  });

  test("si elige un deudor inválido, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);
    seedDeudores(app);

    app.sendMessage(fullTC());

    app.sendMessage("2"); // Ajeno
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Elegí el deudor");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto ajeno registrado");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(1);
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(1);
  });

  test("guarda correctamente una compra TC con reintegro pendiente", () => {
    const app = createGasTestRuntime();

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      ahorro: "2000",
      tipo: "R",
      reintegrado: "No"
    }));

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    expect(gastos).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Ahorro"]).toBe(2000);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("R");
    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Compra con tarjeta");
    expect(app.lastMessage()).toContain("BBVA Visa");
  });

  test("guarda correctamente una compra TC con descuento", () => {
    const app = createGasTestRuntime();

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      ahorro: "1500",
      tipo: "D",
      reintegrado: "Sí"
    }));

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Ahorro"]).toBe(1500);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("D");
    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test("formato rápido guarda correctamente una compra con TC", () => {
    const app = createGasTestRuntime();

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage([
      "TC",
      "12000",
      "Compra rápida TC"
    ].join("\n"));

    app.sendMessage("1"); // Super
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    const deudasTarjeta = sheetRowsByConfig(app, "SHEET_CUOTAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);
    const deudaTarjeta = rowToObject(SHEET_CUOTAS.headers, deudasTarjeta[0]);

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Detalle"]).toBe("Compra rápida TC");
    expect(gasto["ID"]).toMatch(/^GAS-/);

    expect(deudaTarjeta["Medio de pago"]).toBe("BBVA Visa");
    expect(deudaTarjeta["Monto"]).toBe(12000);
    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("rechaza TC con monto negativo", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      monto: "-1000",
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("rechaza TC con monto cero", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      monto: "0",
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("rechaza TC con cantidad de cuotas inválida", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      cuotas: "0",
    }));

    expect(app.lastMessage()).toContain("#Cuotas inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);

    app.sendMessage(fullTC({
      cuotas: "-3",
      detalle: "Cuotas negativas"
    }));

    expect(app.lastMessage()).toContain("#Cuotas inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);

    app.sendMessage(fullTC({
      cuotas: "abc",
      detalle: "Cuotas texto"
    }));

    expect(app.lastMessage()).toContain("#Cuotas inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("si es en 1 cuota, crea deuda de tarjeta correctamente", () => {
    const app = createGasTestRuntime();

    const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      cuotas: "1",
    }));

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const deudasTarjeta = sheetRowsByConfig(app, "SHEET_CUOTAS");

    expect(deudasTarjeta).toHaveLength(1);

    const deudaTarjeta = rowToObject(SHEET_CUOTAS.headers, deudasTarjeta[0]);

    expect(deudaTarjeta["Monto"]).toBe(12000);
    expect(deudaTarjeta["#Cuotas"]).toBe(1);
    expect(deudaTarjeta["#CuotasRestantes"]).toBe(1);
  });

  test("rechaza TC con ahorro pero sin tipo", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      ahorro: "1500",
      tipo: "-",
      reintegrado: "-"
    }));

    expect(app.lastMessage()).toContain("el ahorro debería ser 0");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });

  test("rechaza TC con tipo pero sin especificar si fue reintegrado", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);
    seedTarjetas(app);

    app.sendMessage(fullTC({
      monto: "1000",
      ahorro: "1500",
      tipo: "R",
      reintegrado: "-"
    }));

    expect(app.lastMessage()).toContain("Reintegrado debe ser 'Sí' o 'No'");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_CUOTAS")).toHaveLength(0);
  });
});