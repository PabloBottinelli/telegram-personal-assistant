function listPageWithFormat_(parts, sheetName, mapper, formatter) {
    const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
    const values = listSheetValuesByPage_(sheetName, mapper, pageNumber, 10)
    const msg = formatter.formatTransactionList(values, pageNumber)
    sendTelegram(msg)
}

function formatPaginatedList_(items, pageNumber, title, emptyMessage, formatItem){
    if (items.length === 0) return emptyMessage
    const blocks = items.map(formatItem)
    return `${title} de la página ${pageNumber}: \n\n${blocks.join("\n\n")}`
}