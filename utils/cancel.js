function handleCancel_(message) {
  const raw = String(message || "").trim();
  if (raw.toUpperCase() !== "CANCELAR") return false;
  statesReset();
  sendTelegram("Operación cancelada.");
  return true;
}
