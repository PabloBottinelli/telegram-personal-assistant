const START_ROW = 2;
const START_COL_LETTER = 'A';
const START_COL = 1;

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
  headers: ['Detalle', 'Tipo', 'Campo Clave', 'Horario', 'Activo', 'Ultima Ejecucion']
};