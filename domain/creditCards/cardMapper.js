function cardFromRow_(row, cols) {
  return {
    nombre: row[getRequiredHeaderIndex_(cols, "Tarjeta de crédito", SHEET_TARJETAS.name)],
    ultimoCierre: row[getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name)],
    ultimoVencimiento: row[getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name)],
    proximoCierre: row[getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name)],
    proximoVencimiento: row[getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name)],
    id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_TARJETAS.name)]
  };
}