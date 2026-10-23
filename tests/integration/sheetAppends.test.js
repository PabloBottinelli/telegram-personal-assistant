import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Appends con huecos y columnas reordenadas", () => {
  test.each([
    {
      repositoryName: "ExpenseRepository",
      configName: "SHEET_GASTOS",
      data: { categoria: "Super", medio: "Efectivo", ahorro: 0, detalle: "Compra", tipo: "-", reintegrado: true },
      fields: { "Categoría": "Super", "Medio de pago": "Efectivo", "Ahorro": 0, "Detalle": "Compra", "Tipo": "-", "Reintegrado?": true }
    },
    {
      repositoryName: "IncomeRepository",
      configName: "SHEET_INGRESOS",
      data: { categoria: "Sueldo", detalle: "Pago mensual" },
      fields: { "Categoría": "Sueldo", "Descripción": "Pago mensual" }
    },
    {
      repositoryName: "DebtRepository",
      configName: "SHEET_DEUDAS",
      data: { deudor: "Juan", montoPendiente: 300, detalle: "Préstamo", estado: "PENDIENTE", gastoId: "GAS-1" },
      fields: { "Deudor": "Juan", "Monto Pendiente": 300, "Detalle": "Préstamo", "Estado": "PENDIENTE", "Gasto ID": "GAS-1" }
    },
    {
      repositoryName: "DebtPaymentRepository",
      configName: "SHEET_PAGOS_DEUDAS",
      data: { deudor: "Juan", deudaId: "DEU-1" },
      fields: { "Deudor": "Juan", "Deuda ID": "DEU-1" }
    },
    {
      repositoryName: "CreditCardExpenseRepository",
      configName: "SHEET_CUOTAS",
      data: { medio: "BBVA Visa", cuotas: 3, cuotasRestantes: 2, detalle: "Compra en cuotas", gastoId: "GAS-1" },
      fields: { "Medio de pago": "BBVA Visa", "#Cuotas": 3, "#CuotasRestantes": 2, "Detalle": "Compra en cuotas", "Gasto ID": "GAS-1" }
    }
  ])("$repositoryName conserva registros y ordena por Fecha", ({ repositoryName, configName, data, fields }) => {
    const app = createGasTestRuntime();
    const config = testUtils.getGlobal(app, configName);
    const repository = testUtils.getGlobal(app, repositoryName);
    const sheet = app.spreadsheet.getSheetByName(config.name);
    const headers = [
      "ID", ...config.headers.filter(header => header !== "ID" && header !== "Fecha"),
      "Fecha", "Notas"
    ];
    const date = new Date(2026, 9, 20, 12);
    const expected = { ...fields, "ID": "REG-M", "Fecha": date, "Monto": 300, "Moneda": "ARS", "Notas": "" };
    const older = { ...expected, "ID": "REG-Z", "Fecha": new Date(2026, 9, 10, 12), "Monto": 100, "Notas": "Nota anterior" };
    const newer = { ...expected, "ID": "REG-A", "Fecha": new Date(2026, 9, 30, 12), "Monto": 200, "Notas": "Nota reciente" };
    sheet.values = [
      headers,
      testUtils.rowFromObject(headers, older),
      new Array(headers.length).fill(""),
      testUtils.rowFromObject(headers, newer)
    ];

    const id = repository.append({ ...data, id: "REG-M", fecha: date, monto: 300, moneda: "ARS" });

    expect(id).toBe("REG-M");
    expect(sheet.values[0]).toEqual(headers);
    const records = app.sheetRows(config.name).map(row => testUtils.rowToObject(headers, row));
    expect(records).toEqual([newer, expected, older]);
  });

  test.each([
    ["SHEET_CATEGORIAS", "Categoría", "CAT"],
    ["SHEET_TARJETAS", "Tarjeta de crédito", "TAR"],
    ["SHEET_DEUDORES", "Nombre", "DEUDOR"]
  ])("ItemRepository no sobrescribe registros en %s con la columna A vacía", (configName, nameHeader, idPrefix) => {
    const app = createGasTestRuntime();
    const config = testUtils.getGlobal(app, configName);
    const repository = testUtils.getGlobal(app, "ItemRepository");
    const sheet = app.spreadsheet.getSheetByName(config.name);
    const headers = ["Notas", ...config.headers.slice().reverse()];
    const older = testUtils.rowFromObject(headers, { "ID": "ITEM-A", [nameHeader]: "Primero" });
    const newer = testUtils.rowFromObject(headers, { "ID": "ITEM-B", [nameHeader]: "Segundo" });
    sheet.values = [headers, older, [], newer];

    repository.append("Tercero", config.name);

    expect(sheet.values.slice(0, 4)).toEqual([headers, older, [], newer]);
    expect(app.sheetRows(config.name)).toHaveLength(3);
    const added = testUtils.rowToObject(headers, sheet.values[4]);
    expect(added[nameHeader]).toBe("Tercero");
    expect(added.ID).toMatch(new RegExp(`^${idPrefix}-`));
    expect(added.Notas).toBe("");
  });

  test("ReminderRepository agrega después del último registro sin reutilizar huecos", () => {
    const app = createGasTestRuntime();
    const config = testUtils.getGlobal(app, "SHEET_RECORDATORIOS");
    const repository = testUtils.getGlobal(app, "ReminderRepository");
    const sheet = app.spreadsheet.getSheetByName(config.name);
    const headers = ["Notas", ...config.headers.slice().reverse()];
    const older = testUtils.rowFromObject(headers, { "ID": "REC-A", "Detalle": "Primero", "Notas": "Nota A" });
    const newer = testUtils.rowFromObject(headers, { "ID": "REC-B", "Detalle": "Segundo", "Notas": "Nota B" });
    sheet.values = [headers, older, [], newer];

    const id = repository.append({
      id: "REC-C", description: "Tercero", type: "DAILY",
      hour: 9, minute: 30, active: true
    });

    expect(id).toBe("REC-C");
    expect(sheet.values.slice(0, 4)).toEqual([headers, older, [], newer]);
    expect(app.sheetRows(config.name)).toHaveLength(3);
    const added = testUtils.rowToObject(headers, sheet.values[4]);
    expect(added).toEqual({
      "Notas": "", "ID": "REC-C", "Detalle": "Tercero", "Tipo": "DAILY",
      "Campo Clave": "-", "Horario": expect.any(Date), "Activo": true, "Ultima Ejecucion": ""
    });
    testUtils.expectHora(added.Horario, 9, 30);
  });
});
