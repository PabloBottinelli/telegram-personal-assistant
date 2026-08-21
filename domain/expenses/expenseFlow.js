var ExpenseFlow = {
  handleCategoryStep(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

    if (!result.ok) {
      sendTelegram(result.error);
      CategoryCommand.sendSelectionListWithCreateOption();
      return;
    }

    state.data.categoria = result.value;

    const isAjenoCategory = String(result.value || "").trim().toLowerCase() === "ajeno";

    if (isAjenoCategory) {
      state.step = "WAITING_DEBTOR";
      saveState_(chatId, state);

      if (result.exist) {
        sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Categoría "${result.value}" seleccionada. Ahora elegí quién te debe este gasto.`);
      } else {
        sendTelegram(`✅ Categoría "${result.value}" guardada. Ahora elegí quién te debe este gasto.`);
      }

      DebtorCommand.sendSelectionList();
      return;
    }

    ExpenseService.create(state.data);

    if (result.exist) {
      sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Gasto registrado en ${result.value}.`);
    } else {
      sendTelegram(`✅ Gasto registrado en ${result.value}.`);
    }

    statesReset();
  },

  handleDebtorStep(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

    if (!result.ok) {
      sendTelegram(result.error);
      DebtorCommand.sendSelectionList();
      return;
    }

    state.data.deudor = result.value;

    const gastoId = ExpenseService.create(state.data);

    const deudaId = DebtService.create({
      fecha: state.data.fecha,
      deudor: state.data.deudor,
      moneda: state.data.moneda,
      monto: state.data.monto,
      detalle: state.data.detalle,
      gastoId: gastoId || ""
    });

    if (result.exist) {
      sendTelegram(
        `${result.value} ya existe, no se guardará nuevamente.\n ✅ Gasto registrado en ${result.value}.\n` +
        `✅ Gasto ajeno registrado.\n` +
        `Deudor: ${state.data.deudor}\n` +
        `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
        `Detalle: ${state.data.detalle}\n` +
        `Deuda ID: ${deudaId}`
      );
    } else {
      sendTelegram(
        `✅ Gasto ajeno registrado.\n` +
        `Deudor: ${state.data.deudor}\n` +
        `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
        `Detalle: ${state.data.detalle}\n` +
        `Deuda ID: ${deudaId}`
      );
    }

    statesReset();
  }
}
