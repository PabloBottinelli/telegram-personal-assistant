const USER_STATES = {
  ESPERANDO_CATEGORIA: 'esperandoCategoria',
  ESPERANDO_METODO: 'esperandoMetodo',
  ESPERANDO_METODO_FECHA: 'esperandoMetodoFecha',
  ESPERANDO_REINTEGRO_IDX: 'esperandoReintegroIdx'
};

function loadState_(chatId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(chatId);
  if (!raw) return null;

  const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return JSON.parse(raw, (k, v) => (typeof v === "string" && isoRe.test(v)) ? new Date(v) : v);
}

function saveState_(chatId, st) {
  PropertiesService.getScriptProperties().setProperty(chatId, JSON.stringify(st));
}

function statesReset() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}
