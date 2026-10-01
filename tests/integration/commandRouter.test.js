import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Commands", () => {
  test("devuelve un menú que contiene todos los comandos de ROUTES junto con su formato de FORMATS", () => {
    const app = createGasTestRuntime();

    app.sendMessage("COMANDOS");

    const msg = app.lastMessage();

    const commandNames = vm.runInContext("Object.keys(COMMANDS)", app.context);

    for (const commandName of commandNames) {
      expect(msg).toContain(commandName);
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

  test("Todos los comandos rechazan una cantidad inválida de líneas", () => {
    const app = createGasTestRuntime();
    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");

    for (const [commandName, command] of Object.entries(COMMANDS)) {
      const invalidLength = command.validLengths.includes(1) ? 2 : 1;

      const messageParts = [
        commandName,
        ...Array(invalidLength - 1).fill("extra")
      ];

      app.sendMessage(messageParts.join("\n"));

      const msg = app.lastMessage();

      expect(
        msg,
        `El comando ${commandName} no mostró el error genérico`
      ).toContain("El formato es incorrecto.");

      expect(
        msg,
        `El comando ${commandName} no mostró su formato`
      ).toContain(command.format_indication);
    }
  });
});