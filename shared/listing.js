function listPageWithFormat_(parts, sheetName, mapper, formatter) {
    const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
    const values = listSheetValuesByPage_(sheetName, mapper, pageNumber, 10)
    const msg = formatter.formatTransactionList(values, pageNumber)
    sendTelegram(msg)
}