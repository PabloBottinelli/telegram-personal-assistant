import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("COMANDOS", () => {
  test("devuelve un menú que contiene todos los comandos de ROUTES junto con su formato de FORMATS", () => {
    const app = createGasTestRuntime();

    app.sendMessage("COMANDOS");

    const msg = app.lastMessage();

    const routeNames = vm.runInContext("Object.keys(ROUTES)", app.context);

    for (const routeName of routeNames) {
      const format = vm.runInContext(`FORMATS[${JSON.stringify(routeName)}]`, app.context);

      expect(format, `Falta FORMATS["${routeName}"]`).toBeTruthy();

      expect(msg, `El menú no contiene el comando ${routeName}`)
        .toContain(`*${routeName}*`);

      expect(msg, `El menú no contiene el formato de ${routeName}`)
        .toContain(format);
    }
  });

  test("COMANDOS avisa si falta el formato de una ruta", () => {
    const app = createGasTestRuntime();

    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");
    const originalFormat = COMMANDS["GASTO"].format_indication;

    try {
      delete COMMANDS["GASTO"].format_indication;

      app.sendMessage("COMANDOS");

      expect(app.lastMessage()).toContain("Falta el formato para la ruta: GASTO");
    } finally {
      COMMANDS["GASTO"].format_indication = originalFormat;
    }
  });
});