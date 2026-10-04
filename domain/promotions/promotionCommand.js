var PromotionCommand = {
    search(parts) {
        const query = String(parts[1] || "").trim();
        const promotions = PromotionsService.search(query, 10);

        sendTelegram(PromotionsFormatter.format(promotions));
    }
};