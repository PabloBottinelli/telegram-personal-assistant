const REMINDER_TYPES = [
    { code: "DAILY", label: "Diario" },
    { code: "WEEKLY", label: "Semanal (un día)" },
    { code: "WEEKLY_MULTI", label: "Semanal (varios días)" },
    { code: "EVERY_N_DAYS", label: "Cada N días" },
    { code: "MONTHLY", label: "Mensual (día del mes)" },
    { code: "ONCE", label: "Fecha específica" }
];

const WEEKDAYS = {
    "1": { code: "MONDAY", label: "Lunes" },
    "2": { code: "TUESDAY", label: "Martes" },
    "3": { code: "WEDNESDAY", label: "Miércoles" },
    "4": { code: "THURSDAY", label: "Jueves" },
    "5": { code: "FRIDAY", label: "Viernes" },
    "6": { code: "SATURDAY", label: "Sábado" },
    "7": { code: "SUNDAY", label: "Domingo" },

    lunes: { code: "MONDAY", label: "Lunes" },
    lun: { code: "MONDAY", label: "Lunes" },

    martes: { code: "TUESDAY", label: "Martes" },
    mar: { code: "TUESDAY", label: "Martes" },

    miercoles: { code: "WEDNESDAY", label: "Miércoles" },
    miércoles: { code: "WEDNESDAY", label: "Miércoles" },
    mie: { code: "WEDNESDAY", label: "Miércoles" },

    jueves: { code: "THURSDAY", label: "Jueves" },
    jue: { code: "THURSDAY", label: "Jueves" },

    viernes: { code: "FRIDAY", label: "Viernes" },
    vie: { code: "FRIDAY", label: "Viernes" },

    sabado: { code: "SATURDAY", label: "Sábado" },
    sábado: { code: "SATURDAY", label: "Sábado" },
    sab: { code: "SATURDAY", label: "Sábado" },

    domingo: { code: "SUNDAY", label: "Domingo" },
    dom: { code: "SUNDAY", label: "Domingo" }
};