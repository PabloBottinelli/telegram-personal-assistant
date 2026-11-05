function parseTelegramUpdate_(e) {
  const contents = JSON.parse(e.postData.contents);
  const rawText = contents.message?.text;
  const text = rawText?.trim();
  const chatId = String(contents.message?.chat?.id || "");

  if (!text || !chatId) return null;

  return {chatId, text, rawText, raw: contents};
}
