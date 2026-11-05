function parseTelegramMessage_(raw) {
  const text = String(raw ?? "").replace(/\r\n?/g, "\n");

  if (!text.trim()) return [];

  if (text.includes("\n")) {
    return text.split("\n").map(field => field.trim());
  }

  const fields = text.split(", ");
  const commandName = fields[0].trim().toUpperCase();
  const quickFieldCount = COMMANDS[commandName]?.quickFieldCount;

  if (!quickFieldCount || fields.length < quickFieldCount) {
    return fields.map(field => field.trim());
  }

  const detailIndex = quickFieldCount - 1;

  const initialFields = fields
    .slice(0, detailIndex)
    .map(field => field.trim());

  const detail = fields
    .slice(detailIndex)
    .join(", ")
    .trim();

  return [...initialFields, detail];
}
