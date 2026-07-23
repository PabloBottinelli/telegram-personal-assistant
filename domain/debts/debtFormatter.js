var DebtFormatter = {
  formatPendingGroups(groups) {
    const blocks = groups.map(group => {
      const header =
        `*${group.deudor}* debe en total ${fmtMoney_(group.moneda, group.total)}\n`;

      const detailLines = group.debts.map((d, idx) => {
        const fecha = d.fecha instanceof Date ? dateToStringDM_(d.fecha) : "-";
        const detalle = String(d.detalle || "-");
        const pendiente = nOrZero_(d.montoPendiente);

        return (
          `${idx + 1}. ${fmtMoney_(d.moneda, pendiente)}\n` +
          `   Fecha: ${fecha}\n` +
          `   Detalle: ${detalle}\n` +
          `   ID: ${d.id}`
        );
      });

      return header + "\n" + detailLines.join("\n\n");
    });

    return blocks.join("\n\n----------------\n\n");
  },

  formatPaymentSelection(deudor, debts) {
    let msg =
      `${deudor} tiene varias deudas pendientes.\n` +
      `Elegí cuál querés pagar:\n\n`;

    debts.forEach((d, idx) => {
      const fecha = d.fecha instanceof Date ? dateToStringDM_(d.fecha) : "-";
      const pendiente = nOrZero_(d.montoPendiente);

      msg +=
        `${idx + 1}. ${fmtMoney_(d.moneda, pendiente)}\n` +
        `   Fecha: ${fecha}\n` +
        `   Detalle: ${d.detalle || "-"}\n\n`;
    });

    msg += "O escribí CANCELAR para abortar.";

    return msg;
  }
};