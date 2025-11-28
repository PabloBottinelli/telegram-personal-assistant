const CATEGORIA_LISTA_HEADER = "Seleccioná una categoría escribiendo el NÚMERO:\n\n";
const CATEGORIA_LISTA_FOOTER = "\nO escribí NUEVA seguido del nombre para agregar una categoría nueva (ej: NUEVA Sueldo)";

function itemListCategoriesMsg(){
    itemListMsg(SHEET_CATEGORIAS.name, CATEGORIA_LISTA_HEADER, CATEGORIA_LISTA_FOOTER);
}

function listCategories() {
  listItems(SHEET_CATEGORIAS.name, 'Estas son las categorías:\n');
}

