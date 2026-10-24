const CreditCardMapper = {
  updateCycleRow(row, cols, cycle) {
    const updatedRow = [...row];

    updatedRow[getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name)] = cycle.ultimoCierre;
    updatedRow[getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name)] = cycle.ultimoVencimiento || "";
    updatedRow[getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name)] = cycle.proximoCierre || "";
    updatedRow[getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name)] = cycle.proximoVencimiento || "";

    return updatedRow;
  },

  fromRow(row, cols) {
    return {
      nombre: row[getRequiredHeaderIndex_(cols, "Tarjeta de crédito", SHEET_TARJETAS.name)],
      ultimoCierre: row[getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name)],
      ultimoVencimiento: row[getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name)],
      proximoCierre: row[getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name)],
      proximoVencimiento: row[getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name)],
      ultimoCierreProcesado: row[getRequiredHeaderIndex_(cols, "Último Cierre Procesado", SHEET_TARJETAS.name)],
      id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_TARJETAS.name)]
    };
  }
}

