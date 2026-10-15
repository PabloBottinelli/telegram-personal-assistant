var PromotionCommand = {
  search(parts) {
    const query = String(parts[1] || "").trim();
    const promotions = PromotionsService.search(query);

    sendTelegram(PromotionsFormatter.format(promotions));
  }
};
