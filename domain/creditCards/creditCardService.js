var CreditCardService = {
  startChangeDateFlow(chatId, date, type) {
    saveState_(chatId, {
      flow: "CHANGE_CARD_DATE",
      step: "WAITING_CARD",
      data: {date, type},
      timestamp: Date.now()
    });

    CreditCardCommand.sendSelectionList();
  },

  changeDate(data) {
    CreditCardRepository.setDate(data);
  }
};