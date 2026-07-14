function parseTelegramUpdate_(e) {
  const contents = JSON.parse(e.postData.contents);
  const text = contents.message?.text?.trim();
  const chatId = String(contents.message?.chat?.id || "");

  if (!text || !chatId) return null;

  return {chatId, text, raw: contents};
}