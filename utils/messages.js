function parseTelegramMessage_(raw) {
  const text = String(raw || "").trim();

  if (!text) return [];

  const lines = text
    .split("\n")
    .map(s => s.trim())
    .filter(s => s !== "");

  if (lines.length === 1 && lines[0].includes(",")) {
    return lines[0]
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "");
  }

  return lines;
}