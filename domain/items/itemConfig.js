function getItemSheetConfig_(sheetName) {
  if (sheetName === SHEET_CATEGORIAS.name) {
    return {
      idPrefix: "CAT",
      nameHeader: "Categoría"
    };
  }

  if (sheetName === SHEET_TARJETAS.name) {
    return {
      idPrefix: "TAR",
      nameHeader: "Tarjeta de crédito"
    };
  }

  if (sheetName === SHEET_DEUDORES.name) {
    return {
      idPrefix: "DEUDOR",
      nameHeader: "Nombre"
    };
  }

  throw new Error("No sé cómo agregar ítems en la hoja: " + sheetName);
}