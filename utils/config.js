const START_ROW = 2;
const START_COL_LETTER = 'A';
const START_COL = 1;

// Hojas
const SHEET_CUOTAS = {
  name: 'Deudas Tarjeta',
  headers: ['Fecha', 'Medio de pago', 'Moneda', 'Monto', '#Cuotas', '#CuotasRestantes', 'Detalle']
};
const SHEET_GASTOS = {
  name: 'Gastos',
  headers: ['Fecha','Categoría','Medio de pago','Monto', 'Moneda','Ahorro','Detalle','Reintegrado?','Devuelto?'],
  checkboxColOffset: 8,   // Reintegrado?  -> H
  devueltoColOffset: 9    // Devuelto?     -> I
};
const SHEET_INGRESOS = {
  name:'Ingresos',
  headers: ['Fecha','Monto','Moneda','Categoría','Descripción']
};
const SHEET_CATEGORIAS = {
  name:'Categorias',
  headers: ['Categoría']
};
const SHEET_TARJETAS = {
  name:'Tarjetas de credito',
  headers: ['Tarjeta de crédito','Último cierre','Último vencimiento','Próximo Cierre','Próximo Vencimiento']
};

const SHEET_RECORDATORIOS = {
  name: 'Recordatorios',
  headers: ['Detalle', 'Tipo', 'Campo Clave', 'Horario']
};

// Estados
const USER_STATES = {
  ESPERANDO_CATEGORIA: 'esperandoCategoria',
  ESPERANDO_METODO: 'esperandoMetodo',
  ESPERANDO_METODO_FECHA: 'esperandoMetodoFecha',
  ESPERANDO_REINTEGRO_IDX: 'esperandoReintegroIdx'
};

const MSG_ERRORS = {
  FECHA_INVALIDA: "📅 Fecha inválida. Usá formato DD/MM o - si querés la fecha actual",
  FECHA_INVALIDA_STRICT: "📅 Fecha inválida. Usá DD/MM.",
  ERROR_GENERIC: "No se porqué pero pasó esto, avisale a Pablo: ",
  ERRORES_PREFIX: "⚠️ Te mandaste las siguientes macanas:\n\n",
  MONTO_INVALIDO: "💵 Monto inválido. Debe ser un número (ej: 1200.50)",
  MONEDA_INVALIDA: "💱 Moneda inválida. Solo USD, USDT o ARS.",
  METODO_INVALIDO: "💳 El medio de pago no puede estar vacío.",
  AHORRO_INVALIDO: "💾 Ahorro inválido. Indicá un número positivo o un porcentaje (ej: 15 o 15%).",
  PORCENTAJE_INVALIDO: "💾 El porcentaje de ahorro debe ser un número positivo (ej: 10%).",
  MONTO_BASE_INVALIDO: "💵 Monto base inválido para calcular porcentaje.",
  VALOR_REINTEGRO_INVALIDO: "↩️ Valor inválido en reintegrado. Solo se acepta 'si' o 'no'.",
  CUOTAS_INVALIDO: "🧮 #Cuotas inválido. Debe ser un entero positivo (ej: 12)",
  DETALLE_VACIO: "📌 Descripción no puede estar vacía.",
  NUMERO_INVALIDO: "❌ Número inválido. Elegí un número de la lista o creá una NUEVA.",
  FORMATO_INCORRECTO_NUEVA: "Tenés que poner un nombre después de NUEVA",
  INVALID_COMMAND: "Elegí un comando válido. Podés ver la lista con COMANDOS",
  INVALID_MONTH: "Mes inválido. Usá un número entre 1-12 o el nombre completo del mes."
};
