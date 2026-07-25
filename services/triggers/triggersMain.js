const TZ = Session.getScriptTimeZone();

const TRIGGERS = [
    { handler: 'BestCardTrigger',        type: 'daily',  hour: 7 },
    { handler: 'RefundsTrigger',   type: 'weekly', hour: 7, weekday: ScriptApp.WeekDay.MONDAY },
    { handler: 'CardsMaintenanceTrigger',   type: 'daily',  hour: 7 },
    { handler: 'ExpirationsAlertTrigger',   type: 'daily',  hour: 7 },
    { handler: 'ReminderScheduler.run()', type: 'minutes', minutes: 5 }
];

function updateTriggers() {
    deleteAllTriggers();
    TRIGGERS.forEach(createTrigger_);
}

function createTrigger_({ handler, type, hour, weekday, minutes }) {
    let triggerBuilder = ScriptApp.newTrigger(handler).timeBased().inTimezone(TZ);
    if (type === 'daily') {
        triggerBuilder.atHour(hour).everyDays(1).create();
    } else if (type === 'weekly') {
        triggerBuilder.onWeekDay(weekday).atHour(hour).create();
    } else if (type === 'minutes') {
        triggerBuilder.everyMinutes(minutes).create();
    } else {
        throw new Error('Tipo de trigger no soportado: ' + type);
    }
}

function deleteAllTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => ScriptApp.deleteTrigger(t));
}

function testDaily() {
    TRIGGERS.forEach(t => {
        const fn = globalThis[t.handler];  
        if (typeof fn === 'function') {
        try {
            fn(); 
        } catch (err) {
            Logger.log(`Error al ejecutar ${t.handler}: ${err}`);
        }
        } else {
        Logger.log(`No existe la función ${t.handler}`);
        }
    });
}

function showActiveTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    Logger.log("⚠️ No hay triggers activos en este proyecto.");
    return;
  }

  Logger.log("📅 TRIGGERS ACTIVOS:");
  triggers.forEach((t, i) => {
    const handler = t.getHandlerFunction();
    const type = t.getEventType();
    const source = t.getTriggerSource();
    const id = t.getUniqueId();
    Logger.log(
      `${i + 1}. Handler: ${handler}\n   Tipo evento: ${type}\n   Fuente: ${source}\n   ID: ${id}\n`
    );
  });
}