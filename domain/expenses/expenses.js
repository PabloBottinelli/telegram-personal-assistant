function appendExpenseRow(expense) {
  const gasto = {
    id: expense.id || generateId_("GAS"),
    fecha: expense.datos.fecha,
    categoria: expense.categoria,
    medio: expense.datos.metodo,
    monto: expense.datos.monto,
    moneda: expense.datos.moneda,
    ahorro: expense.datos.ahorro ?? "",
    detalle: expense.datos.detalle ?? "",
    tipo: expense.datos.tipo,
    reintegrado: expense.datos.reintegrado === true,
  };

  return ExpenseRepository.append(gasto);
}