import vm from "node:vm";

export function rowToObject(headers, row) {
  return Object.fromEntries(
    headers.map((header, index) => [header, row[index]])
  );
}

export function getGlobal(app, name) {
  return vm.runInContext(name, app.context);
}

export function appendRowsByConfig(app, configName, rows) {
  const config = getGlobal(app, configName);
  app.appendRows(config.name, rows);
}

export function sheetRowsByConfig(app, configName) {
  const config = getGlobal(app, configName);
  return app.sheetRows(config.name);
}