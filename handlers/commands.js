function sendCommandMenu() {
  sendTelegram(MSG_COMMANDS.COMANDOS);
}

const COMMANDS = [
  "GASTO","INGRESO","TC",
  "COMANDOS","NUEVA TARJETA",
  "ULTIMO CIERRE","ULTIMO VENCIMIENTO","PROXIMO CIERRE","PROXIMO VENCIMIENTO", 
  "TOTALES", "REINTEGROS", "MARCAR REINTEGRADO", "FECHAS"
];

const MSG_COMMANDS = {
  COMANDOS:
    `
    NUEVA TARJETA
    Nombre

    ULTIMO CIERRE
    Fecha

    PROXIMO CIERRE
    Fecha

    ULTIMO VENCIMIENTO
    Fecha

    PROXIMO VENCIMIENTO
    Fecha

    GASTO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Medio de pago
    Ahorro (% o monto)
    Detalle
    Reintegro Pagado?(Si/No/-)

    INGRESO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Descripcion

    TC
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Ahorro
    #Cuotas
    Detalle
    Reintegro Pagado?(Si/No/-)
    
    TOTALES
    
    REINTEGROS
    
    MARCAR REINTEGRADO
    
    FECHAS`,
  ELEGIR_COMANDO: "Elegí un comando válido. Podés ver la lista con COMANDOS",
  FORMATO_GASTO: `Respetá el formato para GASTOS:
    GASTO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Medio de pago
    Ahorro (% o monto)
    Detalle
    Reintegro Pagado?(Si/No/-)`,
  FORMATO_INGRESO: `Respetá el formato para INGRESOS:
    INGRESO
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Descripcion`,
  FORMATO_TC: `Respetá el formato para TC:
    TC
    Fecha (u -)
    Monto
    Moneda (USD, USDT o ARS)
    Ahorro
    #Cuotas
    Detalle
    Reintegro Pagado?(Si/No/-)`,
  TARJETA_NUEVA_FORMATO: "Formato:\nNUEVA TARJETA\nNombre",
  FORMATO_INCORRECTO_NUEVA: "Tenés que poner un nombre después de NUEVA",
};