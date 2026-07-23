import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { FakeSpreadsheet } from "./fakeSheets.js";
import { createInstrumenter } from "istanbul-lib-instrument";

const PROJECT_ROOT = path.resolve(".");

const FILES_TO_LOAD = [
  "config/messages.js",
  "config/env.js",
  "config/sheets.js",
  "config/commands.js",

  "domain/items/items.js",
  "domain/items/itemCommand.js",
  "domain/items/itemFlow.js",
  "domain/items/itemFormatter.js",
  "domain/items/itemRepository.js",
  "domain/items/itemService.js",
  "domain/items/itemConfig.js",

  "domain/categories/categorieCommand.js",

  "domain/refunds/markAsRefunded.js",
  "domain/refunds/refundCommand.js",
  "domain/refunds/refundFlow.js",
  "domain/refunds/refundFormatter.js",
  "domain/refunds/refundService.js",

  "domain/reminders/handlers/everyNDaysReminderHandler.js",
  "domain/reminders/handlers/monthlyReminderHandler.js",
  "domain/reminders/handlers/multipleWeeklyReminderHandler.js",
  "domain/reminders/handlers/onceDateReminderHandler.js",
  "domain/reminders/handlers/reminderTimeHandler.js",
  "domain/reminders/handlers/reminderTypeHandler.js",
  "domain/reminders/handlers/weeklyReminderHandler.js",
  "domain/reminders/reminders.js",

  "domain/summary/totals.js",
  "domain/summary/cardStatement.js",

  "domain/triggers/bestCard.js",
  "domain/triggers/cardClose.js",
  "domain/triggers/expirationsAlerts.js",
  "domain/triggers/refunds.js",

  "domain/creditCards/creditCardMapper.js",
  "domain/creditCards/creditCardParser.js",
  "domain/creditCards/creditCardValidator.js",
  "domain/creditCards/creditCardRepository.js",
  "domain/creditCards/creditCardService.js",
  "domain/creditCards/creditCardCommand.js",
  "domain/creditCards/creditCardFlow.js",

  "domain/creditCardExpenses/creditCardExpenseCommand.js",
  "domain/creditCardExpenses/creditCardExpenseFlow.js",
  "domain/creditCardExpenses/creditCardExpenseMapper.js",
  "domain/creditCardExpenses/creditCardExpenseParser.js",
  "domain/creditCardExpenses/creditCardExpenseRepository.js",
  "domain/creditCardExpenses/creditCardExpenseService.js",
  "domain/creditCardExpenses/creditCardExpenseValidator.js",

  "domain/debts/debtCommand.js",
  "domain/debts/debtMapper.js",
  "domain/debts/debtFlow.js",
  "domain/debts/debtParser.js",
  "domain/debts/debtPaymentMapper.js",
  "domain/debts/debtPaymentRepository.js",
  "domain/debts/debtRepository.js",
  "domain/debts/debts.js",
  "domain/debts/debtService.js",
  "domain/debts/debtValidator.js",

  "domain/debtors/debtorCommand.js",

  "domain/expenses/expenseCommand.js",
  "domain/expenses/expenseMapper.js",
  "domain/expenses/expenseParser.js",
  "domain/expenses/expenseRepository.js",
  "domain/expenses/expenseService.js",
  "domain/expenses/expenseValidator.js",
  "domain/expenses/expenseFlow.js",

  "domain/incomes/incomeCommand.js",
  "domain/incomes/incomeMapper.js",
  "domain/incomes/incomeParser.js",
  "domain/incomes/incomeRepository.js",
  "domain/incomes/incomeService.js",
  "domain/incomes/incomeValidator.js",
  "domain/incomes/incomeFlow.js",

  "services/sheets/helpers.js",
  "services/telegram/client.js",
  "services/triggers/triggersMain.js",

  "shared/numbers.js",
  "shared/dates.js",
  "shared/coins.js",
  "shared/ids.js",
  "shared/inputProcessors.js",
  "shared/parsers.js",

  "app/states.js",
  "app/commandRouter.js",
  "app/errorHandler.js",
  "app/main.js",
  "app/stateRouter.js",
  "app/updateParser.js"
];

export function createGasTestRuntime() {
  const spreadsheet = new FakeSpreadsheet();
  const telegramOutbox = [];
  const props = new Map();
  const sharedCoverage = globalThis.__coverage__ || (globalThis.__coverage__ = {});
  let uuidCounter = 0;

  const context = {
    console,
    
    __coverage__: sharedCoverage,

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
      getUuid: () => {
        uuidCounter += 1;

        const suffix = String(uuidCounter).padStart(8, "0");

        return `${suffix}-bbbb-cccc-dddd-eeeeeeeeeeee`;
      }
    },

    Session: {
      getScriptTimeZone: () => "America/Argentina/Buenos_Aires"
    },

    Logger: {
      log: console.log
    },

    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        waitLock: () => {},
        releaseLock: () => {}
      })
    },

    ScriptApp: {
      WeekDay: {
        SUNDAY: "SUNDAY",
        MONDAY: "MONDAY",
        TUESDAY: "TUESDAY",
        WEDNESDAY: "WEDNESDAY",
        THURSDAY: "THURSDAY",
        FRIDAY: "FRIDAY",
        SATURDAY: "SATURDAY"
      },

      getProjectTriggers: () => [],
      deleteTrigger: () => {},

      newTrigger: () => ({
        timeBased: () => ({
          atHour: () => ({
            everyDays: () => ({
              create: () => ({})
            }),
            onWeekDay: () => ({
              create: () => ({})
            })
          }),
          everyDays: () => ({
            create: () => ({})
          }),
          everyHours: () => ({
            create: () => ({})
          }),
          everyMinutes: () => ({
            create: () => ({})
          }),
          onWeekDay: () => ({
            atHour: () => ({
              create: () => ({})
            }),
            create: () => ({})
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
  
  context.global = context;
  context.globalThis = context;
  vm.createContext(context);

  const instrumenter = createInstrumenter({
    coverageVariable: "__coverage__",
    compact: false,
    esModules: false
  });

  for (const file of FILES_TO_LOAD) {
    const abs = path.join(PROJECT_ROOT, file);
    const code = fs.readFileSync(abs, "utf8");

    const coveragePath = file.replace(/\\/g, "/");

    const instrumentedCode = instrumenter.instrumentSync(code, coveragePath);

    vm.runInContext(instrumentedCode, context, { filename: coveragePath });

    syncCoverage_(context);
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

      syncCoverage_(context);
    },

    doPost(event) {
      context.doPost(event);
      syncCoverage_(context);
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

const COVERAGE_TMP_DIR = path.join(PROJECT_ROOT, ".coverage-tmp");

function syncCoverage_(context) {
  if (!context.__coverage__) return;

  globalThis.__coverage__ = globalThis.__coverage__ || {};
  Object.assign(globalThis.__coverage__, context.__coverage__);

  fs.mkdirSync(COVERAGE_TMP_DIR, { recursive: true });

  const coverageFile = path.join(
    COVERAGE_TMP_DIR,
    `coverage-${process.pid}.json`
  );

  fs.writeFileSync(
    coverageFile,
    JSON.stringify(globalThis.__coverage__, null, 2),
    "utf8"
  );
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