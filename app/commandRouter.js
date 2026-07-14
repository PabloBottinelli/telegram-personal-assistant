function handleCommand_(update) {
  const parts = parseTelegramMessage_(update.text);
  const commandName = parts[0].trim().toUpperCase()
  const command = COMMANDS[commandName];

  if (!command) {
    sendTelegram(MSG_ERRORS.INVALID_COMMAND);
    return;
  }

  if (command.validLengths && !command.validLengths.includes(parts.length)) {
    sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + command.format_indication);
    return;
  }

  command.handler(update.chatId, parts);
}

function sendCommandMenu() {
  const lines = [];

  for (const commandKey of Object.keys(COMMANDS)) {
    const fmt = COMMANDS[commandKey].format_indication
    if (!fmt) {
      sendTelegram(`Falta el formato para la ruta: ${commandKey }`); 
      return;
    }
    lines.push(`*${commandKey }*\n${fmt}`);
  }

  const msg = lines.join("\n\n");
  sendTelegram(msg);
}


