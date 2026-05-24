function generateId_(prefix) {
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd-HHmmss"
  );

  const random = Utilities.getUuid().split("-")[0];

  return `${prefix}-${timestamp}-${random}`;
}