const TZ = Session.getScriptTimeZone();

const TRIGGERS = [
    { handler: 'BestCardTrigger_',        type: 'daily',  hour: 7 },
    { handler: 'RefundsTrigger_',   type: 'weekly', hour: 7, weekday: ScriptApp.WeekDay.MONDAY },
    { handler: 'CardsMaintenanceTrigger_',   type: 'daily',  hour: 7 },
    { handler: 'ExpirationsAlertTrigger_',   type: 'daily',  hour: 7 },
];

function updateTriggers() {
    deleteAllTriggers();
    TRIGGERS.forEach(createTrigger_);
}

function createTrigger_({ handler, type, hour, weekday }) {
    let triggerBuilder = ScriptApp.newTrigger(handler).timeBased().inTimezone(TZ);
    if (type === 'daily') {
        triggerBuilder.atHour(hour).everyDays(1).create();
    } else if (type === 'weekly') {
        triggerBuilder.onWeekDay(weekday).atHour(hour).create();
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