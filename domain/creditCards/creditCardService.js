var CreditCardService = {
  startChangeDateFlow(chatId, date, type) {
    saveState_(chatId, {
      flow: "CHANGE_CARD_DATE",
      step: "WAITING_CARD",
      data: { date, type },
      timestamp: Date.now()
    });

    CreditCardCommand.sendSelectionList();
  },

  changeDate(data) {
    CreditCardRepository.setDate(data);
  },

  advanceExpiredCycles(today) {
    const cards = CreditCardRepository.list();
    const movedCards = [];

    for (const card of cards) {
      const nextClose = card.proximoCierre;

      if (!(nextClose instanceof Date)) continue;
      if (nextClose >= today) continue;

      const updatedCard = {
        ...card,
        ultimoCierre: nextClose,
        ultimoVencimiento: card.proximoVencimiento instanceof Date ? card.proximoVencimiento : null,
        proximoCierre: null,
        proximoVencimiento: null
      };

      const updated = CreditCardRepository.updateCycle(
        card.id,
        updatedCard
      );

      if (!updated) continue;

      const cardName = String(card.nombre || "").trim();

      if (cardName) {
        movedCards.push({
          card: updatedCard,
          closeDate: nextClose
        });
      }
    }

    return movedCards;
  }
};