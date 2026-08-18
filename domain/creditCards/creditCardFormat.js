var CreditCardFormatter = {
    formatDates(cards) {
        if(cards.length === 0){
            return "No hay tarjetas cargadas."
        }

        const fmtDate = value => value instanceof Date ? dateToStringDM_(value) : "-"

        const blocks = cards.map(card => {
            const name = String(card.nombre || "").trim()
            const dates = `FUC: ${fmtDate(card.ultimoCierre)} | ` +
            `FUV: ${fmtDate(card.ultimoVencimiento)} | ` +
            `FPC: ${fmtDate(card.proximoCierre)} | ` +
            `FPV: ${fmtDate(card.proximoVencimiento)}` 

            return `${name}\n ${dates}`
        })

        return "Fechas de Tarjetas\n\n" + blocks.join("\n\n")
    }
}