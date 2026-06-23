import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { FakeSpreadsheet } from "./fakeSheets.js";

const PROJECT_ROOT = path.resolve(".");

const FILES_TO_LOAD = [
  "config/errors.js",
  "config/env.js",
  "config/sheetLeafs.js",

  "utils/numbers.js",
  "utils/dates.js",
  "utils/coins.js",
  "utils/ids.js",
  "utils/inputProcessors.js",
  "utils/messages.js",

  "services/sheets/helpers.js",
  "services/telegram/client.js",

  "app/formats.js",
  "app/states.js",
  "app/routes.js",

  "domain/transactions/mappers/spentMapper.js",
  "domain/transactions/mappers/incomeMapper.js",
  "domain/transactions/mappers/cardCreditMapper.js",
  "domain/transactions/mappers/debtMapper.js",
  "domain/transactions/mappers/debtPaymentMapper.js",

  "domain/transactions/repositories/expenseRepository.js",
  "domain/transactions/repositories/cardDebtRepository.js",
  "domain/transactions/repositories/debtRepository.js",
  "domain/transactions/repositories/debtPaymentRepository.js",

  "domain/items/items.js",
  "domain/items/categories.js",
  "domain/items/cards.js",
  "domain/items/debtors.js",
  "domain/items/debtorSelection.js",

  "domain/transactions/persistence.js",
  "domain/transactions/spent.js",
  "domain/transactions/income.js",
  "domain/transactions/credit.js",
  "domain/transactions/debts.js",

  "domain/refunds/markAsRefunded.js",
  "domain/summary/totals.js",
  "domain/summary/cardStatement.js",

  "main.js"
];

export function createGasTestRuntime() {
  const spreadsheet = new FakeSpreadsheet();
  const telegramOutbox = [];
  const props = new Map();

  const context = {
    console,

    SpreadsheetApp: {
      getActive: () => spreadsheet
    },

    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: key => props.get(String(key)) ?? null,
        setProperty: (key, value) => {
          props.set(String(key), String(value));
        },
        deleteProperty: key => {
          props.delete(String(key));
        },
        deleteAllProperties: () => {
          props.clear();
        }
      })
    },

    UrlFetchApp: {
      fetch: (_url, payload) => {
        telegramOutbox.push(String(payload?.payload?.text ?? ""));
        return { getContentText: () => "" };
      }
    },

    Utilities: {
      formatDate: (date, _tz, format) => {
        const d = new Date(date);

        const pad = n => String(n).padStart(2, "0");

        const yyyy = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const HH = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());

        return format
          .replace("yyyy", yyyy)
          .replace("MM", MM)
          .replace("dd", dd)
          .replace("HH", HH)
          .replace("mm", mm)
          .replace("ss", ss);
      },

      getUuid: () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    },

    Session: {
      getScriptTimeZone: () => "America/Argentina/Buenos_Aires"
    },

    Logger: {
      log: console.log
    },

    ScriptApp: {
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: () => ({
        timeBased: () => ({
          atHour: () => ({
            everyDays: () => ({
              create: () => ({})
            })
          })
        })
      })
    },

    Date,
    JSON,
    String,
    Number,
    Boolean,
    Math,
    Map,
    Set,
    Array,
    Object,
    RegExp,
    parseInt,
    parseFloat,
    isFinite,
    isNaN
  };

  vm.createContext(context);

  for (const file of FILES_TO_LOAD) {
    const abs = path.join(PROJECT_ROOT, file);
    const code = fs.readFileSync(abs, "utf8");
    vm.runInContext(code, context, { filename: file });
  }

  seedAllSheets(context, spreadsheet);

  return {
    context,
    spreadsheet,
    telegramOutbox,
    props,

    sendMessage(text) {
      const telegramChatId = vm.runInContext("TELEGRAM_CHAT_ID", context);

      const event = {
        postData: {
          contents: JSON.stringify({
            message: {
              text,
              chat: {
                id: telegramChatId
              }
            }
          })
        }
      };

      context.doPost(event);
    },

    lastMessage() {
      return telegramOutbox.at(-1) ?? "";
    },

    sheetRows(sheetName) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) throw new Error(`No existe la fake sheet: ${sheetName}`);

      return sheet.values.slice(1).filter(row =>
        row.some(v => String(v ?? "").trim() !== "")
      );
    },

    appendRows(sheetName, rows) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) throw new Error(`No existe la fake sheet: ${sheetName}`);

      for (const row of rows) {
        sheet.values.push(row);
      }
    },

    dumpSheets() {
      for (const [name, sheet] of spreadsheet.sheets.entries()) {
        console.log("SHEET:", name);
        console.log(sheet.values);
      }
    },
    
    messages() {
      return telegramOutbox;
    },

    messageAt(index) {
      return telegramOutbox.at(index);
    },

    lastMessages(count) {
      return telegramOutbox.slice(-count);
    },
  };
}

function getGlobal_(context, name) {
  return vm.runInContext(name, context);
}

function seedAllSheets(context, spreadsheet) {
  const configNames = [
    "SHEET_GASTOS",
    "SHEET_INGRESOS",
    "SHEET_CUOTAS",
    "SHEET_CATEGORIAS",
    "SHEET_TARJETAS",
    "SHEET_RECORDATORIOS",
    "SHEET_DEUDAS",
    "SHEET_PAGOS_DEUDAS",
    "SHEET_DEUDORES"
  ];

  for (const configName of configNames) {
    const config = getGlobal_(context, configName);

    if (!config) {
      throw new Error(`No se encontró la configuración de hoja: ${configName}`);
    }

    const headers = config.headers || config.header || config.columns || [];

    spreadsheet.insertSheet(config.name, headers);
  }
}