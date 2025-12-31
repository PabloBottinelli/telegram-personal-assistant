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
      const base = datos.baseDate instanceof Date ? dateToStringDM_(datos.baseDate) : null;

      return base ? `${n}, ${base}` : String(n);
    }

    case 'MONTHLY':
      return String(datos.dayOfMonth);

    case 'ONCE': {
      return dateToStringDM_(datos.onceDate);
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

  sheet.getRange(lastRow, 1, 1, 6).setValues([[
    datos.detalle,
    datos.tipo,
    campoClave,
    timeCell,
    true,
    ''
  ]]);
}

function ReminderTick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return; 

  try {
    const sheet = getSheet_(SHEET_RECORDATORIOS.name);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const now = new Date();

    for (let i = 0; i < values.length; i++) {
      const rowIndex = i + 2;

      const detalle = values[i][0];
      const tipo = values[i][1];
      const campo = values[i][2];
      const horarioCell = values[i][3];     
      const activo = values[i][4];          
      const ultima = values[i][5];          

      if (activo === false) continue;
      if (!detalle || !tipo || !(horarioCell instanceof Date)) continue;

      const target = new Date(now);
      target.setHours(horarioCell.getHours(), horarioCell.getMinutes(), 0, 0);

      if (now < target) continue;

      if (ultima instanceof Date && ultima >= target) continue;

      if (!reminderMatches_(tipo, campo, now)) continue;

      sendTelegram(`⏰ Recordatorio:\n${detalle}`);

      sheet.getRange(rowIndex, 6).setValue(now);

      if (tipo === 'ONCE') {
        sheet.getRange(rowIndex, 5).setValue(false);
      }
    }

  } finally {
    lock.releaseLock();
  }
}

function reminderMatches_(tipo, campoClave, now) {
  const campo = String(campoClave || '').trim();
  const labels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const today = labels[now.getDay()].toLowerCase();

  switch (tipo) {
    case 'DAILY':
      return true;

    case 'WEEKLY': {
      return campo.toLowerCase() === today;
    }

    case 'WEEKLY_MULTI': {
      const days = campo.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      return days.includes(today);
    }

    case 'MONTHLY': {
      const day = Number(campo);
      return Number.isInteger(day) && now.getDate() === day;
    }

    case 'ONCE': {
      const d = parseDDMMYYYY_(campo);
      if (!d) return false;

      return sameLocalDay_(d, now);
    }

    case 'EVERY_N_DAYS': {
      const parts = campo.split(',').map(s => s.trim());
      const n = Number(parts[0]);
      if (!Number.isInteger(n) || n < 1) return false;

      const base = parts[1] ? parseDDMMYYYY_(parts[1]) : null;
      if (!base) return false;

      const diffDays = Math.floor((noonTs_(now) - noonTs_(base)) / (24 * 3600 * 1000));
      return diffDays >= 0 && diffDays % n === 0;
    }

    default:
      return false;
  }
}


