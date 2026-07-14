var ItemFormatter = {
  formatNumberedList(items, header, footer) {
    let msg = header;

    items.forEach((item, i) => {
      msg += `${i + 1}. ${item}\n`;
    });

    msg += footer || "";
    return msg;
  },

  formatPlainList(items, header) {
    let msg = header;

    items.forEach(item => {
      msg += `${item}\n`;
    });

    return msg;
  }
};