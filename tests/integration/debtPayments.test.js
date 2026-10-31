import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debt Payments", () => {
  test("Si elige un deudor inválido, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná un deudor");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda registrada");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    expect(deudas).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];

    expect(deuda["Deudor"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
  });

  test("PAGO DEUDA con deudor sin deudas activas responde mensaje y no crea pago", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.pagoDeuda({
      monto: "10000"
    }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("No hay deudas pendientes para Galicia");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
  });

  test.each(["NUEVO Galicia", "nuevo Galicia", "NuEvO Galicia", "NUEVA Galicia", "nueva Galicia"])("No permite crear un deudor con %j", message => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.pagoDeuda({
      monto: "10000"
    }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");
    expect(app.lastMessage()).not.toContain("NUEVO");

    app.sendMessage(message);

    expect(app.lastMessages(2)[0]).toContain("Número inválido");
    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDORES")).toHaveLength(0);
  });

  test.each(["1abc", "1.5", "1e0", "+1", "0", "99"])(
    "PAGO DEUDA rechaza el deudor %j sin registrar pagos y permite reintentar",
    message => {
      const app = createGasTestRuntime();
      testUtils.seedDeudores(app);
      testUtils.crearDeudaDesdeBot(app);
      const debtsBefore = testUtils.sheetObjects(app, "SHEET_DEUDAS");
      const debtorsBefore = testUtils.sheetObjects(app, "SHEET_DEUDORES");

      app.sendMessage(testUtils.pagoDeuda());
      app.sendMessage(message);

      expect(app.lastMessages(2)[0]).toContain("Número inválido");
      expect(app.lastMessage()).toContain("Seleccioná un deudor");
      expect(testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
      expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")).toEqual(debtsBefore);
      expect(testUtils.sheetObjects(app, "SHEET_DEUDORES")).toEqual(debtorsBefore);

      app.sendMessage(" 1 ");

      expect(app.lastMessage()).toContain("Pago registrado");
      expect(testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(1);
      expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]["Monto Pendiente"]).toBe(60000);
    }
  );

  test.each(["1abc", "1.5", "1e0", "+1", "0", "3"])(
    "PAGO DEUDA rechaza la deuda %j sin modificar saldos y permite elegir otra",
    message => {
      const app = createGasTestRuntime();
      testUtils.seedDeudores(app);
      testUtils.crearDeudaDesdeBot(app, { detalle: "Primer préstamo" });
      testUtils.crearDeudaDesdeBot(app, { detalle: "Segundo préstamo" });
      const debtsBefore = testUtils.sheetObjects(app, "SHEET_DEUDAS");

      app.sendMessage(testUtils.pagoDeuda());
      app.sendMessage("1");
      expect(app.lastMessage()).toContain("Elegí cuál querés pagar");
      const selectedDetail = testUtils.getDetalleDeOpcion(app.lastMessage(), 2);
      const selectedDebt = debtsBefore.find(debt => debt["Detalle"] === selectedDetail);
      expect(selectedDebt).toBeDefined();

      app.sendMessage(message);

      expect(app.lastMessages(2)[0]).toContain("Número inválido");
      expect(app.lastMessage()).toContain("Elegí cuál querés pagar");
      expect(testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
      expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")).toEqual(debtsBefore);

      app.sendMessage(" 2 ");

      expect(app.lastMessage()).toContain("Pago registrado");
      expect(testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")).toEqual([
        expect.objectContaining({ "Deuda ID": selectedDebt["ID"], "Monto": 40000 })
      ]);
      const debtsAfter = testUtils.sheetObjects(app, "SHEET_DEUDAS");
      expect(debtsAfter.find(debt => debt["ID"] === selectedDebt["ID"])["Monto Pendiente"]).toBe(60000);
      expect(debtsAfter.find(debt => debt["ID"] !== selectedDebt["ID"])).toEqual(
        debtsBefore.find(debt => debt["ID"] !== selectedDebt["ID"])
      );
    }
  );

  test("PAGO DEUDA parcial crea pago y actualiza monto pendiente", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo parcial"
    });

    app.sendMessage(testUtils.pagoDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");
    expect(app.lastMessage()).toContain("Pendiente nuevo");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];
    const pago = testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")[0];

    expect(deuda["Monto Pendiente"]).toBe(60000);
    expect(deuda["Estado"]).toBe("Pendiente");

    testUtils.expectSameDay(pago["Fecha"]);
    expect(pago["Deudor"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(40000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["ID"]);
  });

  test("Si se paga el total de una deuda el monto pendiente queda en 0 y el estado pasa a saldada", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app);

    app.sendMessage(testUtils.pagoDeuda({ monto: "100000" }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");
    expect(app.lastMessage()).toContain("Pendiente nuevo: $0,00");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];
    const pago = testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")[0];

    expect(deuda["Monto Pendiente"]).toBe(0);
    expect(deuda["Estado"]).toBe("Saldada");

    testUtils.expectSameDay(pago["Fecha"]);
    expect(pago["Deudor"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(100000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["ID"]);
  })

  test("PAGO DEUDA mayor a la deuda pendiente no permite crear pago", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app);

    app.sendMessage(testUtils.pagoDeuda({ monto: "110000" }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("El pago supera el monto pendiente");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(0);
  });

  test.todo("PAGO DEUDA menor a la deuda total con varias deudas permite elegir deudas a pagar hasta llegar al monto ingresado");

  test.todo("Se permite pagar el valor de una cuota");

  test.todo("Deudas propias")

  test.todo("Se puede eliminar un pago de deuda")

  test.todo("Se puede editar un pago de deuda")

  test.todo("Se pueden listar los pagos de deuda")

  test.todo("Se puede pagar el total pendiente de una deuda sin ingresar el monto")

  test.todo("Pago deuda múltiple")
});
