const START_ROW = 2;

// Hojas
const SHEET_MOVIMIENTOS = 'Movimientos';
const SHEET_CUOTAS      = "Deudas Tarjeta";
const SHEET_LISTAS      = 'Listas';

// Tablas
const TABLA_GASTOS = {
  startColLetter: 'A',
  startCol: 1,
  headers: ['Fecha','Categoría','Medio de pago','Monto', 'Moneda','Ahorro','Detalle','Reintegrado?','Devuelto?'],
  checkboxColOffset: 8,   // Reintegrado?  -> H
  devueltoColOffset: 9    // Devuelto?     -> I
};
const TABLA_INGRESOS = {
  startColLetter: 'L',
  startCol: 12,
  headers: ['Fecha','Monto','Moneda','Categoría','Descripción']
};
const TABLA_DEUDAS = {
  startColLetter: 'A',
  startCol: 1,
  headers: ['Fecha', 'Medio de pago', 'Moneda', 'Monto', '#Cuotas', '#CuotasRestantes', 'Detalle']
};
const TABLA_CATEGORIAS = {
  startColLetter: 'A',
  startCol: 1,
  headers: ['Categoría']
};
const TABLA_TARJETAS = {
  startColLetter: 'C',
  startCol: 3, 
  headers: ['Tarjeta de crédito','Último cierre','Último vencimiento','Próximo Cierre','Próximo Vencimiento']
};

const TARJETA_FIELD_TO_OFFSET = {
  'ULTIMO_CIERRE': 1,
  'ULTIMO_VENCIMIENTO': 2,
  'PROXIMO_CIERRE': 3,
  'PROXIMO_VENCIMIENTO': 4
};

// Comandos válidos
const COMMANDS = [
  "GASTO","INGRESO","TC",
  "COMANDOS","NUEVA TARJETA",
  "ULTIMO CIERRE","ULTIMO VENCIMIENTO","PROXIMO CIERRE","PROXIMO VENCIMIENTO", 
  "TOTALES", "REINTEGROS", "MARCAR REINTEGRADO", "FECHAS"
];

// Mapas de comandos → campo tarjetas
const CMD_TO_FIELD = {
  "ULTIMO CIERRE": "ULTIMO_CIERRE",
  "ULTIMO VENCIMIENTO": "ULTIMO_VENCIMIENTO",
  "PROXIMO CIERRE": "PROXIMO_CIERRE",
  "PROXIMO VENCIMIENTO": "PROXIMO_VENCIMIENTO"
};

// Estados
const USER_STATES = {
  ESPERANDO_CATEGORIA: 'esperandoCategoria',
  ESPERANDO_METODO: 'esperandoMetodo',
  ESPERANDO_METODO_FECHA: 'esperandoMetodoFecha',
  ESPERANDO_REINTEGRO_IDX: 'esperandoReintegroIdx'
};

const MSG = {
  COMANDOS:
    `
    NUEVA TARJETA
    Nombre

    ULTIMO CIERRE
    Fecha

    PROXIMO CIERRE
    Fecha

    ULTIMO VENCIMIENTO
    Fecha

    PROXIMO VENCIMIENTO
    Fecha

    GASTO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Medio de pago
    Ahorro (% o monto)
    Detalle
    Reintegro Pagado?(Si/No/-)

    INGRESO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Descripcion

    TC
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Ahorro
    #Cuotas
    Detalle
    Reintegro Pagado?(Si/No/-)
    
    TOTALES
    
    REINTEGROS
    
    MARCAR REINTEGRADO
    
    FECHAS`,
  ELEGIR_COMANDO: "Elegí un comando válido. Podés ver la lista con COMANDOS",
  FORMATO_GASTO: `Respetá el formato para GASTOS:
    GASTO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Medio de pago
    Ahorro (% o monto)
    Detalle
    Reintegro Pagado?(Si/No/-)`,
  FORMATO_INGRESO: `Respetá el formato para INGRESOS:
    INGRESO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Descripcion`,
  FORMATO_TC: `Respetá el formato para TC:
    TC
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Ahorro
    #Cuotas
    Detalle
    Reintegro Pagado?(Si/No/-)`,
  FECHA_INVALIDA: "📅 Fecha inválida. Usá formato YYYY-MM-DD o - si querés la fecha actual",
  FECHA_INVALIDA_STRICT: "📅 Fecha inválida. Usá YYYY-MM-DD.",
  TARJETA_NUEVA_FORMATO: "Formato:\nNUEVA TARJETA\nNombre",
  ERROR_GENERIC: "No se porqué pero pasó esto, avisale a Pablo: ",
  CATEGORIA_LISTA_HEADER: "Seleccioná una categoría escribiendo el NÚMERO:\n\n",
  CATEGORIA_LISTA_FOOTER: "\nO escribí NUEVA seguido del nombre para agregar una categoría nueva (ej: NUEVA Sueldo)",
  METODO_TARJETA_LISTA_FOOTER: "\nO escribí NUEVA seguido del nombre para agregar un método nuevo (ej: NUEVA BBVA VISA)",
  METODO_TARJETA_LISTA_HEADER: "Seleccioná un método escribiendo el NÚMERO:\n\n",
  ERRORES_PREFIX: "⚠️ Te mandaste las siguientes macanas:\n\n",
  MONTO_INVALIDO: "💵 Monto inválido. Debe ser un número (ej: 1200.50)",
  MONEDA_INVALIDA: "💱 Moneda inválida. Solo USD, USDT o ARS.",
  METODO_INVALIDO: "💳 El medio de pago no puede estar vacío.",
  AHORRO_INVALIDO: "💾 Ahorro inválido. Indicá un número positivo o un porcentaje (ej: 15 o 15%).",
  PORCENTAJE_INVALIDO: "💾 El porcentaje de ahorro debe ser un número positivo (ej: 10%).",
  MONTO_BASE_INVALIDO: "💵 Monto base inválido para calcular porcentaje.",
  VALOR_REINTEGRO_INVALIDO: "↩️ Valor inválido en reintegrado. Solo se acepta 'si' o 'no'.",
  CUOTAS_INVALIDO: "🧮 #Cuotas inválido. Debe ser un entero positivo (ej: 12)",
  DETALLE_VACIO: "📌 Descripción no puede estar vacía."
};
