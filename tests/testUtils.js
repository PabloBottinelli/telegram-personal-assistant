import vm from "node:vm";
import { describe, expect, test } from "vitest";

const CATEGORIA_LISTA_HEADER = "Seleccioná una categoría escribiendo el NÚMERO:\n\n";
const MEDIO_LISTA_HEADER = "Seleccioná una tarjeta escribiendo el NÚMERO:\n\n";

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

export function expectHora(actualDate, expectedHour, expectedMinute) {
  expect(actualDate).toBeInstanceOf(Date);
  expect(actualDate.getHours()).toBe(expectedHour);
  expect(actualDate.getMinutes()).toBe(expectedMinute);
  expect(actualDate.getSeconds()).toBe(0);
  expect(actualDate.getMilliseconds()).toBe(0);
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

export function checkHours(date){
  expect(date.getHours()).toBe(12);
  expect(date.getMinutes()).toBe(0);
  expect(date.getSeconds()).toBe(0);
  expect(date.getMilliseconds()).toBe(0);
}

export function buildTimeDate(hour = 7, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function runReminderTick(app) {
  vm.runInContext("ReminderTick()", app.context);
}

export function seedRecordatorios(app, rows) {
  appendRowsByConfig(app, "SHEET_RECORDATORIOS", rows);
}

export function recordatorioRow(app, options = {}) {
  const {
    detalle = "Recordatorio test",
    tipo = "DAILY",
    campoClave = "-",
    horario = buildTimeDate(0, 0),
    activo = true,
    ultimaEjecucion = "",
    id = "REC-TEST-1"
  } = options;

  const SHEET_RECORDATORIOS = getGlobal(app, "SHEET_RECORDATORIOS");

  return rowFromObject(SHEET_RECORDATORIOS.headers, {
    "Detalle": detalle,
    "Tipo": tipo,
    "Campo Clave": campoClave,
    "Horario": horario,
    "Activo": activo,
    "Ultima Ejecucion": ultimaEjecucion,
    "ID": id
  });
}

export function runTrigger(app, functionName) {
  vm.runInContext(`${functionName}()`, app.context);
}

export function rowFromObject(headers, data) {
  return headers.map(header => data[header] ?? "");
}

export function todayDDMMYYYY() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function dateNoon({ daysFromToday = 0 } = {}) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function tarjetaRow(app, options = {}) {
  const {
    nombre = "BBVA Visa",
    ultimoCierre = "",
    ultimoVencimiento = "",
    proximoCierre = "",
    proximoVencimiento = "",
    id = "TAR-TEST-1"
  } = options;

  const SHEET_TARJETAS = getGlobal(app, "SHEET_TARJETAS");

  return rowFromObject(SHEET_TARJETAS.headers, {
    "Tarjeta de crédito": nombre,
    "Último cierre": ultimoCierre,
    "Último vencimiento": ultimoVencimiento,
    "Próximo Cierre": proximoCierre,
    "Próximo Vencimiento": proximoVencimiento,
    "ID": id
  });
}

export function gastoRow(app, options = {}) {
  const {
    fecha = dateNoon(),
    categoria = "Comida",
    medio = "Efectivo",
    monto = 10000,
    moneda = "ARS",
    ahorro = 0,
    detalle = "Gasto test",
    tipo = "-",
    reintegrado = true,
    id = "GAS-TEST-1"
  } = options;

  const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");

  return rowFromObject(SHEET_GASTOS.headers, {
    "Fecha": fecha,
    "Categoría": categoria,
    "Medio de pago": medio,
    "Monto": monto,
    "Moneda": moneda,
    "Ahorro": ahorro,
    "Detalle": detalle,
    "Tipo": tipo,
    "Reintegrado?": reintegrado,
    "ID": id
  });
}

export function cardDebtRow(app, options = {}) {
  const {
    fecha = dateNoon(),
    medio = "BBVA Visa",
    moneda = "ARS",
    monto = 12000,
    cuotas = 3,
    cuotasRestantes = 3,
    detalle = "Compra tarjeta",
    id = "DT-TEST-1",
    gastoId = "GAS-TEST-1"
  } = options;

  const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

  return rowFromObject(SHEET_CUOTAS.headers, {
    "Fecha": fecha,
    "Medio de pago": medio,
    "Moneda": moneda,
    "Monto": monto,
    "#Cuotas": cuotas,
    "#CuotasRestantes": cuotasRestantes,
    "Detalle": detalle,
    "ID": id,
    "Gasto ID": gastoId
  });
}

export function seedGastos(app, rows) {
  appendRowsByConfig(app, "SHEET_GASTOS", rows);
}

export function seedCardDebts(app, rows) {
  appendRowsByConfig(app, "SHEET_CUOTAS", rows);
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

export function fullRecordatorio({ detalle = "Pagar monotributo" } = {}) {
  return ["RECORDATORIO", detalle].join("\n");
}

// Flujos predefinidos

export function crearDeudaDesdeBot(app, {deudorIndex = "1", monto = "100000", moneda = "ARS", detalle = "Prestamo"} = {}) {
  app.sendMessage(fullDeuda({ monto, moneda, detalle }));
  expect(app.lastMessage()).toContain("Elegí el deudor");

  app.sendMessage(deudorIndex);
  expect(app.lastMessage()).toContain("Deuda creada");
}

export function crearGastoDesdeBot(app, {ajeno = false, catIndex = "1", fecha = "10/06", monto = "5000", moneda = "ARS", medio = "Efectivo", ahorro = "0", detalle = "Entrada cine", tipo = "-", reintegrado = "-"} = {}) {  
  app.sendMessage(fullGasto({ fecha, monto, moneda, medio, ahorro, detalle, tipo, reintegrado }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);

  if(ajeno){
    expect(app.lastMessage()).toContain("Elegí el deudor");
    app.sendMessage("1");
    expect(app.lastMessage()).toContain("Gasto ajeno registrado")
    return
  }
  expect(app.lastMessage()).toContain("Registro completado");
}

export function crearIngresoDesdeBot(app, {catIndex = "1", fecha = "10/06", monto = "100000", moneda = "ARS", detalle = "Sueldo"} = {}) {
  app.sendMessage(fullIngreso({ fecha, monto, moneda, detalle }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);
  expect(app.lastMessage()).toContain("Registro completado");
}

export function crearGastoConTarjetaDesdeBot(app, {ajeno = false, catIndex = "1", medioIndex = "1", fecha = "10/06", monto = "100000", moneda = "ARS", ahorro = "0", cuotas = "1", detalle = "Compras super", tipo = "-", reintegrado = "-"} = {}) {  
  app.sendMessage(fullTC({ fecha, monto, moneda, ahorro, cuotas, detalle, tipo, reintegrado }));
  expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);

  app.sendMessage(catIndex);
  expect(app.lastMessage()).toContain(MEDIO_LISTA_HEADER);

  app.sendMessage(medioIndex);

  if(ajeno){
    expect(app.lastMessage()).toContain("Elegí el deudor");
    app.sendMessage("1");
    expect(app.lastMessage()).toContain("Gasto ajeno registrado")
    return
  }

  expect(app.lastMessage()).toContain("Registro completado");
}

export function crearRecordatorioDiarioDesdeBot(app, {detalle = "Tomar agua", hora = "08:00"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("1");
  expect(app.lastMessage()).toContain("Tipo: Diario");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
}

export function crearRecordatorioSemanalDesdeBot(app, {detalle = "Sacar basura", dia = "Lunes", hora = "09:00"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("2");
  expect(app.lastMessage()).toContain("Tipo: Semanal");

  app.sendMessage(dia);
  expect(app.lastMessage()).toContain("recordatorio semanal");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
}

export function crearRecordatorioSemanalMultipleDesdeBot(app, {detalle = "Gimnasio", dias = "Lunes, Miércoles, Viernes", hora = "18:00"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("3");
  expect(app.lastMessage()).toContain("Tipo: Semanal");

  app.sendMessage(dias);
  expect(app.lastMessage()).toContain("recordatorio los días");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
}

export function crearRecordatorioCadaNDiasDesdeBot(app, {detalle = "Cambiar sábanas",cada = "3", hora = "08:00"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("4");
  expect(app.lastMessage()).toContain("Tipo: Cada N días");

  app.sendMessage(cada);
  expect(app.lastMessage()).toContain("cada");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
}

export function crearRecordatorioMensualDesdeBot(app, {detalle = "Pagar tarjeta", dia = "10", hora = "07:30"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("5");
  expect(app.lastMessage()).toContain("Tipo: Mensual");

  app.sendMessage(dia);
  expect(app.lastMessage()).toContain("día");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
}

export function crearRecordatorioUnaVezDesdeBot(app, {detalle = "Turno médico", fecha = "15/08", hora = "10:00"} = {}) {
  app.sendMessage(fullRecordatorio({ detalle }));
  expect(app.lastMessage()).toContain("Elegí el TIPO");

  app.sendMessage("6");
  expect(app.lastMessage()).toContain("Tipo: Fecha específica");

  app.sendMessage(fecha);
  expect(app.lastMessage()).toContain("Perfecto");

  app.sendMessage(hora);
  expect(app.lastMessage()).toContain("Recordatorio creado");
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

export function seedTarjetasConCierre(app, rows = [["BBVA Visa", new Date(2026, 5, 20, 12, 0, 0), "", "", "", "TAR-1"]]) {
  appendRowsByConfig(app, "SHEET_TARJETAS", rows);
}