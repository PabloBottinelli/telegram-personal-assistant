import vm from "node:vm";
import { describe, expect, test } from "vitest";

export function rowToObject(headers, row) {
  return Object.fromEntries(
    headers.map((header, index) => [header, row[index]])
  );
}

export function getGlobal(app, name) {
  return vm.runInContext(name, app.context);
}

export function appendRowsByConfig(app, configName, rows) {
  const config = getGlobal(app, configName);
  app.appendRows(config.name, rows);
}

export function sheetRowsByConfig(app, configName) {
  const config = getGlobal(app, configName);
  return app.sheetRows(config.name);
}

export function expectSameDay(actualDate, expectedDate = new Date()) {
  expect(actualDate).toBeInstanceOf(Date);
  expect(actualDate.getDate()).toBe(expectedDate.getDate());
  expect(actualDate.getMonth()).toBe(expectedDate.getMonth());
  expect(actualDate.getFullYear()).toBe(expectedDate.getFullYear());
}

export function getDetalleDeOpcion(msg, optionNumber) {
  const regex = new RegExp(
    `${optionNumber}\\.([\\s\\S]*?)(?=\\n\\d+\\.|O escribí CANCELAR|$)`
  );

  const match = msg.match(regex);
  if (!match) {
    throw new Error(`No encontré la opción ${optionNumber} en el mensaje:\n${msg}`);
  }

  const block = match[1];
  const detalleMatch = block.match(/Detalle:\s*(.+)/);
  if (!detalleMatch) {
    throw new Error(`No encontré detalle en la opción ${optionNumber}:\n${block}`);
  }

  return detalleMatch[1].trim();
}

export function sheetObjects(app, sheet_name) {
  const SHEET = getGlobal(app, sheet_name);
  return sheetRowsByConfig(app, sheet_name).map(row =>
    rowToObject(SHEET.headers, row)
  );
}

// Transacciones predefinidos 

export function fullDeuda({monto = "100000", moneda = "ARS", detalle = "Prestamo"} = {}) {
  return ["DEUDA", monto, moneda, detalle].join("\n");
}

export function fullGasto({fecha = "10/06", monto = "5000", moneda = "ARS", medio = "Efectivo", ahorro = "0", detalle = "Entrada cine", tipo = "-", reintegrado = "-"} = {}) {
  return ["GASTO", fecha, monto, moneda, medio, ahorro, detalle, tipo, reintegrado].join("\n");
}

export function fullIngreso({fecha = "10/06", monto = "100000", moneda = "ARS", detalle = "Sueldo"} = {}) {
  return ["INGRESO", fecha, monto, moneda, detalle].join("\n");
}

export function fullTC({fecha = "10/06", monto = "12000", moneda = "ARS", ahorro = "0", cuotas = "3", detalle = "Compra con tarjeta", tipo = "-", reintegrado = "-"} = {}) {
  return ["TC", fecha, monto, moneda, ahorro, cuotas, detalle, tipo, reintegrado].join("\n");
}

export function pagoDeuda({monto = "40000"} = {}) {
  return ["PAGO DEUDA", monto].join("\n");
}

// Flujos predefinidos

export function crearDeudaDesdeBot(app, {deudorIndex = "1", monto = "100000", moneda = "ARS", detalle = "Prestamo"} = {}) {
  app.sendMessage(fullDeuda({ monto, moneda, detalle }));
  expect(app.lastMessage()).toContain("Elegí el deudor");

  app.sendMessage(deudorIndex);
  expect(app.lastMessage()).toContain("Deuda creada");
}

export function crearGastoDesdeBot(app, {catIndex = "1", fecha = "10/06", monto = "5000", moneda = "ARS", medio = "Efectivo", ahorro = "0", detalle = "Entrada cine", tipo = "-", reintegrado = "-"} = {}) {
  const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
  
  app.sendMessage(fullGasto({ fecha, monto, moneda, medio, ahorro, detalle, tipo, reintegrado }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);
  expect(app.lastMessage()).toContain("Registro completado");
}

export function crearIngresoDesdeBot(app, {catIndex = "1", fecha = "10/06", monto = "100000", moneda = "ARS", detalle = "Sueldo"} = {}) {
  const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
  
  app.sendMessage(fullIngreso({ fecha, monto, moneda, detalle }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);
  expect(app.lastMessage()).toContain("Registro completado");
}

export function crearGastoConTarjetaDesdeBot(app, {ajeno = false, catIndex = "1", medioIndex = "1", fecha = "10/06", monto = "100000", moneda = "ARS", ahorro = "0", cuotas = "1", detalle = "Compras super", tipo = "-", reintegrado = "-"} = {}) {
  const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
  const MEDIO_LISTA_HEADER = getGlobal(app, "METODO_TARJETA_LISTA_HEADER");
  
  app.sendMessage(fullTC({ fecha, monto, moneda, ahorro, cuotas, detalle, tipo, reintegrado }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);
  expect(app.lastMessage()).toContain(MEDIO_LISTA_HEADER);

  app.sendMessage(medioIndex);

  if(ajeno){
    expect(app.lastMessage()).toContain("Elegí el deudor");
    app.sendMessage("1");
  }

  expect(app.lastMessage()).toContain("Registro completado");
}

// Seeds

export function seedDeudores(app, rows = [["Galicia", "DEUDOR-1"], ["Juan", "DEUDOR-2"]]) {
  appendRowsByConfig(app, "SHEET_DEUDORES", rows);
}

export function seedCategorias(app, rows = [["Super", "CAT-1"], ["Ajeno", "CAT-2"],["Comida", "CAT-3"]]) {
  appendRowsByConfig(app, "SHEET_CATEGORIAS", rows);
}

export function seedTarjetas(app, rows = [["BBVA Visa", "", "", "", "", "TAR-1"], ["Galicia Mastercard", "", "", "", "", "TAR-2"]]) {
  appendRowsByConfig(app, "SHEET_TARJETAS", rows);
}