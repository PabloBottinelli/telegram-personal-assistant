const REMINDER_TYPES = [
    { code: 'DAILY', label: 'Diario' },
    { code: 'WEEKLY', label: 'Semanal (un día)' },
    { code: 'WEEKLY_MULTI', label: 'Semanal (varios días)' },
    { code: 'EVERY_N_DAYS', label: 'Cada N días' },
    { code: 'MONTHLY', label: 'Mensual (día del mes)' },
    { code: 'ONCE', label: 'Fecha específica' },
];

const weekdayMap = {
    "1":   { code: "MONDAY",    label: "Lunes"    },
    "2":   { code: "TUESDAY",   label: "Martes"   },
    "3":   { code: "WEDNESDAY", label: "Miércoles"},
    "4":   { code: "THURSDAY",  label: "Jueves"   },
    "5":   { code: "FRIDAY",    label: "Viernes"  },
    "6":   { code: "SATURDAY",  label: "Sábado"   },
    "7":   { code: "SUNDAY",    label: "Domingo"  },

    "lunes": { code: "MONDAY",  label: "Lunes"    },
    "lun":   { code: "MONDAY",  label: "Lunes"    },

    "martes": { code: "TUESDAY", label: "Martes"  },
    "mar":    { code: "TUESDAY", label: "Martes"  },

    "miercoles":  { code: "WEDNESDAY", label: "Miércoles" },
    "miércoles":  { code: "WEDNESDAY", label: "Miércoles" },
    "mie":        { code: "WEDNESDAY", label: "Miércoles" },

    "jueves": { code: "THURSDAY", label: "Jueves" },
    "jue":    { code: "THURSDAY", label: "Jueves" },

    "viernes": { code: "FRIDAY", label: "Viernes" },
    "vie":     { code: "FRIDAY", label: "Viernes" },

    "sabado":  { code: "SATURDAY", label: "Sábado" },
    "sábado":  { code: "SATURDAY", label: "Sábado" },
    "sab":     { code: "SATURDAY", label: "Sábado" },

    "domingo": { code: "SUNDAY", label: "Domingo" },
    "dom":     { code: "SUNDAY", label: "Domingo" },
  };

function createReminder(chatId, lines) {
    const errores = [];
    const detalleNorm = processDetailInput(lines[1], errores);

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        esperandoTipoDeRecordatorio: true,
        datos: {
            detalle: detalleNorm,
        },
        timestamp: Date.now()
    };

    saveState_(chatId, userState);

    let msg = "Elegí el TIPO de recordatorio escribiendo el NÚMERO:\n\n";
    REMINDER_TYPES.forEach((t, idx) => {
        msg += `${idx + 1}. ${t.label}\n`;
    });
    msg += "\n\nO escribí CANCELAR para abortar."

    sendTelegram(msg);
}

function buildCampoClave_(datos) {
  switch (datos.tipo) {

    case 'DAILY':
      return '-';

    case 'WEEKLY':
      return datos.weekday?.label || '-';

    case 'WEEKLY_MULTI':
      return datos.weekdays?.map(d => d.label).join(', ') || '-';

    case 'EVERY_N_DAYS': {
      const n = datos.everyNDays;
      const base = datos.baseDate instanceof Date
        ? `${String(datos.baseDate.getDate()).padStart(2, '0')}/` +
          `${String(datos.baseDate.getMonth() + 1).padStart(2, '0')}/` +
          `${datos.baseDate.getFullYear()}`
        : null;

      return base ? `${n}, ${base}` : String(n);
    }

    case 'MONTHLY':
      return String(datos.dayOfMonth);

    case 'ONCE': {
      const d = datos.onceDate;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    default:
      return '-';
  }
}


function buildTimeDate_(h, m) {
  const d = new Date();
  d.setHours(h);
  d.setMinutes(m);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

function createReminderFromState_(datos) {
  const sheet = getSheet_(SHEET_RECORDATORIOS.name);
  const lastRow = sheet.getLastRow() + 1;

  const campoClave = buildCampoClave_(datos);

  const timeCell = buildTimeDate_(datos.hour, datos.minute);

  sheet.getRange(lastRow, 1, 1, 4).setValues([[
    datos.detalle,
    datos.tipo,
    campoClave,
    timeCell,
  ]]);
}
