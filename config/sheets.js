const START_ROW = 2;
const START_COL_LETTER = 'A';
const START_COL = 1;

const SHEET_CUOTAS = {
  name: 'Deudas Tarjeta',
  headers: ['Fecha', 'Medio de pago', 'Moneda', 'Monto', '#Cuotas', '#CuotasRestantes', 'Detalle', 'ID', 'Gasto ID']
};
const SHEET_GASTOS = {
  name: 'Gastos',
  headers: ['Fecha','Categoría','Medio de pago','Monto', 'Moneda','Ahorro','Detalle', 'Tipo', 'Reintegrado?', 'ID'],
  checkboxColOffset: 9,   
};
const SHEET_INGRESOS = {
  name:'Ingresos',
  headers: ['Fecha','Monto','Moneda','Categoría','Descripción', 'ID']
};
const SHEET_CATEGORIAS = {
  name:'Categorias',
  headers: ['Categoría', 'ID']
};
const SHEET_TARJETAS = {
  name:'Tarjetas de credito',
  headers: ['Tarjeta de crédito','Último cierre','Último vencimiento','Próximo Cierre','Próximo Vencimiento', 'ID']
};

const SHEET_RECORDATORIOS = {
  name: 'Recordatorios',
  headers: ['Detalle', 'Tipo', 'Campo Clave', 'Horario', 'Activo', 'Ultima Ejecucion', 'ID']
};

const SHEET_DEUDAS = {
  name: 'Deudas',
  headers: ['Fecha', 'Deudor', 'Moneda', 'Monto', 'Monto Pendiente', 'Detalle', 'Estado', 'ID', 'Gasto ID']
};

const SHEET_PAGOS_DEUDAS = {
  name: 'Pagos de deudas',
  headers: ['Fecha', 'Deudor', 'Moneda', 'Monto', 'Deuda ID', 'ID']
};

const SHEET_DEUDORES = {
  name: 'Deudores',
  headers: ['Nombre', 'ID']
};