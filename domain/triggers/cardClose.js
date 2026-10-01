function CardsMaintenanceTrigger() {
  const today = todayNoon_();
  const movedCards = CreditCardService.advanceExpiredCycles(today);

  for (const moved of movedCards) {
    const cardName = String(moved.card.nombre || "").trim();

    try {
      const result = CardStatementService.build(moved.card, moved.closeDate);

      for (const warning of result.warnings) {
        sendTelegram(CardStatementFormatter.warning(warning));
      }

      sendTelegram(CardStatementFormatter.format(result));
    } catch (error) {
      sendTelegram(CardStatementFormatter.generationError(cardName, error));
    }
  }
}