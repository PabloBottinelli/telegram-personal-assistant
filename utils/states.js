function loadState_(chatId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(chatId);
  return raw ? JSON.parse(raw) : null;
}

function saveState_(chatId, st) {
  PropertiesService.getScriptProperties().setProperty(chatId, JSON.stringify(st));
}

function clearState_(chatId) {
  PropertiesService.getScriptProperties().deleteProperty(chatId);
}

function statesReset() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}
