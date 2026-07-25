function CardsMaintenanceTrigger() {
  const today = todayNoon_();
  const movedCards = CreditCardRepository.moveExpiredCycles(today);

  for (const moved of movedCards) {
    const cardName = String(moved.card.nombre || "").trim();

    try {
      const result = CardStatementService.build(moved.card, moved.closeDate);

      for (const warning of result.warnings) {
        sendTelegram(CardStatementFormatter.warning(warning));
      }

      sendTelegram(CardStatementFormatter.format(result));
      CardStatementService.updateRemainingInstallments(cardName, moved.closeDate);
    } catch (error) {
      sendTelegram(CardStatementFormatter.generationError(cardName, error));
    }
  }
}