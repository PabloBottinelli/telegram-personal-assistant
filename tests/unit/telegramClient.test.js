import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";


describe("Telegram message splitting", () => {
    test("no divide mensajes menores al límite", () => {
        const app = createGasTestRuntime();
        const splitTelegramMessage = testUtils.getGlobal(app, "splitTelegramMessage_");

        const messages = splitTelegramMessage("Mensaje corto", 4000);

        expect(messages).toEqual(["Mensaje corto"]);
    });

    test("divide mensajes largos sin superar el límite", () => {
        const app = createGasTestRuntime();
        const splitTelegramMessage = testUtils.getGlobal(app, "splitTelegramMessage_");

        const text = [
            "Promoción 1\n" + "a".repeat(1500),
            "Promoción 2\n" + "b".repeat(1500),
            "Promoción 3\n" + "c".repeat(1500)
        ].join("\n\n");

        const messages = splitTelegramMessage(text, 4000);

        expect(messages.length).toBe(2);

        for (const message of messages) {
            expect(message.length).toBeLessThanOrEqual(4000);
        }
    });

    test("prefiere dividir entre bloques separados por línea vacía", () => {
        const app = createGasTestRuntime();
        const splitTelegramMessage = testUtils.getGlobal(app, "splitTelegramMessage_");

        const block1 = "1. Promo uno\n" + "a".repeat(2200);
        const block2 = "2. Promo dos\n" + "b".repeat(2200);

        const messages = splitTelegramMessage(`${block1}\n\n${block2}`, 4000);

        expect(messages).toEqual([block1, block2]);
    });
});