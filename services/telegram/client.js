const TELEGRAM_MESSAGE_MAX_LENGTH = 4000;

function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const messages = splitTelegramMessage_(String(text || ""), TELEGRAM_MESSAGE_MAX_LENGTH);

  for (const message of messages) {
    const payload = {
      method: "post",
      payload: {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      }
    };

    UrlFetchApp.fetch(url, payload);
  }
}


function splitTelegramMessage_(text, maxLength) {
  if (text.length <= maxLength) {
    return [text];
  }

  const blocks = text.split("\n\n");
  const messages = [];
  let current = "";

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      messages.push(current);
      current = "";
    }

    if (block.length <= maxLength) {
      current = block;
      continue;
    }

    const parts = splitLongBlock_(block, maxLength);
    messages.push(...parts.slice(0, -1));
    current = parts[parts.length - 1];
  }

  if (current) {
    messages.push(current);
  }

  return messages;
}


function splitLongBlock_(text, maxLength) {
  const lines = text.split("\n");
  const parts = [];
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      parts.push(current);
      current = "";
    }

    if (line.length <= maxLength) {
      current = line;
      continue;
    }

    for (let start = 0; start < line.length; start += maxLength) {
      parts.push(line.slice(start, start + maxLength));
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}