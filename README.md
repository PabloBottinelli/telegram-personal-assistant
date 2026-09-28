<p align="center">
  <img src="assets/telegram-personal-assistant-banner.png" alt="Telegram Personal Assistant Banner" width="100%">
</p>

![Status](https://img.shields.io/badge/STATUS-EN%20DESARROLLO-4C9A2A)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=googleappsscript&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)

# Descripción 

Un asistente personal controlado desde Telegram que integra distintos módulos y herramientas que uso a diario para simplificar tareas de registro y automatizar procesos, dándoles una interfaz común y sencilla de utilizar.

Actualmente incluye un módulo completo de gestión de finanzas personales y un sistema de recordatorios. La arquitectura está pensada para poder incorporar nuevas funcionalidades de forma progresiva sin concentrar toda la lógica en un único módulo.

# Decisiones de diseño

## Telegram como interfaz

Telegram permite disponer de una interfaz accesible desde cualquier dispositivo sin desarrollar y mantener un frontend independiente, lo cual me permite destinar todo el tiempo de desarrollo a las distintas herramientas y utilidades del asistente.

## Google Sheets como persistencia

Para los módulos actuales, Google Sheets ofrece una solución simple, visible y fácilmente editable sin necesidad de mantener infraestructura adicional.

El acceso está encapsulado mediante repositories para reducir el acoplamiento entre la persistencia y las reglas de negocio.

# Funcionalidades actuales

## Finanzas

El módulo financiero permite administrar distintos aspectos de las finanzas personales directamente desde Telegram.

Entre sus funcionalidades se encuentran:

- Registro de gastos e ingresos: permite guardar detalles como fecha, monto, categoría, descripción y si hubo algún reintegro o descuento (esto último sirve para poder hacer un seguimiento en el caso de que el reintegro sea posterior a la compra).
- Registro de gastos con tarjeta de crédito: permite indicar la tarjeta utilizada y la cantidad de cuotas, información que luego se utiliza para generar los resúmenes de cada tarjeta.
- Administración de tarjetas, fechas de cierre, vencimientos.
- Armado de resúmenes de tarjetas para saber cuánto hay que pagar de cada una.
- Registro de deudas, deudores y pagos de deudas: sirve para llevar registro de lo que debo o me deben. 
- Totales de gastos e ingresos mensuales.
- Formatos rápidos para registrar operaciones frecuentes.
- Avisos automáticos para eventos relevantes, como fechas de cierre o vencimiento de tarjetas.

Algunas operaciones utilizan flujos conversacionales de varios pasos para solicitar únicamente la información necesaria en cada momento.

Por ejemplo:

```text
Crear ingreso -> Elegir categoría -> Guardar
```

## Recordatorios

El asistente permite crear recordatorios directamente desde Telegram junto con una descripción, frecuencia y horario.

Actualmente soporta distintos tipos de frecuencias:

- Semanal.
- Mensual.
- Cada N días.
- Fecha única.
- Varios días específicos de la semana.

Los recordatorios son procesados automáticamente mediante triggers de Google Apps Script y enviados por Telegram cuando corresponde.

# Arquitectura

El proyecto fue evolucionando desde una implementación procedural hacia una arquitectura modular con responsabilidades separadas.

```mermaid
flowchart LR
   subgraph Recordatorios["<b>Recordatorios/Avisos</b>"]
        TR["<b>Triggers de Apps Script</b><br>Ejecución programada"]
        PA["<b>Procesamiento automático</b><br>"]
        T2["<b>Telegram</b><br>Envía notificaciones"]

        TR --> PA
        PA --> T2
    end

    subgraph Principal["<b>Flujo principal</b>"]
      T1["<b>Telegram</b><br>Interfaz con el usuario"]
      W["<b>Webhook / doPost</b><br>Recibe los mensajes"]
      P["<b>Update Parser</b><br>Interpreta y normaliza updates"]
      CR["<b>Command Router</b><br>Enruta comandos"]
      SR["<b>State Router</b><br>Gestiona el estado conversacional"]
      CF["<b>Commands / Flows</b><br>Coordinan las operaciones"]
      V["<b>Validators</b><br>Validan y normalizan entradas"]
      S["<b>Services</b><br>Lógica de negocio"]
      R["<b>Repositories</b><br>Gestionan el acceso a datos"]
      GS[("<b>Google Sheets</b><br>Persistencia")]

        T1 --> W
        W --> P

        P --> CR
        P --> SR

        CR --> CF
        SR --> CF

        CF --> V
        V --> S
        S --> R
        R --> GS
    end

    Principal ~~~ Recordatorios
```

# Ejemplo de uso

Ejemplo de registro de un ingreso y consulta posterior de la información almacenada.

<p align="center">
  <img src="assets/demo.gif" width="500">
</p>

# Testing

El proyecto utiliza **Vitest** y un entorno simulado de Google Sheets para poder probar la lógica localmente sin depender de una hoja real.

La suite cubre todas las funcionalidades principales, aunque todavía queda mejorar la cobertura y reducir la dependencia de valores hardcodeados y condiciones variables —como la fecha actual— que pueden volver algunos tests frágiles con el tiempo.

![Statements](https://img.shields.io/badge/Statements-87.54%25-brightgreen)
![Branches](https://img.shields.io/badge/Branches-71.49%25-yellow)
![Functions](https://img.shields.io/badge/Functions-90.60%25-brightgreen)
![Lines](https://img.shields.io/badge/Lines-89.64%25-brightgreen)

## Ejecutar los tests

```bash
npm install
npm test
```

Modo watch:

```bash
npm run test:watch
```

## Cobertura

El proyecto incluye herramientas para generar reportes de cobertura:

```bash
npm run coverage
```

También existen comandos auxiliares para comparar reportes de cobertura antes y después de modificaciones.

# Instalación y configuración

Para ejecutar el asistente es necesario contar con:

- Node.js y npm
- una cuenta de Google
- un proyecto de Google Apps Script
- una hoja de Google Sheets
- un bot de Telegram

## 1. Clonar el repositorio

```bash
git clone https://github.com/PabloBottinelli/telegram-personal-assistant.git
cd telegram-personal-assistant
```

## 2. Instalar las dependencias

```bash
npm install
```

El proyecto utiliza `clasp` para trabajar localmente con Google Apps Script.

Si no está instalado:

```bash
npm install -g @google/clasp
```

Luego es necesario iniciar sesión:

```bash
clasp login
```

## 3. Crear y configurar el bot de Telegram

1. Abrir una conversación con `@BotFather` en Telegram.
2. Crear un nuevo bot utilizando `/newbot`.
3. Guardar el token generado.
4. Obtener el ID del chat autorizado que utilizará el asistente.

El token y los identificadores privados no deben subirse al repositorio.

## 4. Configurar Google Sheets

El asistente utiliza Google Sheets como capa de persistencia.

La estructura necesaria de hojas, columnas y formatos ya se encuentra preparada en una plantilla.

[Crear una copia de la plantilla en Google Sheets](https://docs.google.com/spreadsheets/d/1d_Q3W3qpIIdeAUtkIUkRUEhW4WuHis22ZL_40J_QLhU/copy)

Los nombres de las hojas y encabezados deben mantenerse, ya que son utilizados por la aplicación para identificar los datos.

## 5. Configurar Google Apps Script

Crear o vincular un proyecto de Google Apps Script y configurar `clasp` para trabajar con él.

Los archivos locales de configuración y credenciales no forman parte del repositorio:

```text
.clasp.json
.clasprc.json
env.js
```

`env.js` contiene la configuración específica de cada instalación, como las credenciales de Telegram y las referencias a los recursos utilizados por el asistente.

[Ver archivo de configuración de ejemplo](config/env.example.js)

## 6. Sincronizar el código

Una vez configurado el proyecto de Apps Script:

```bash
clasp push
```

Esto sincroniza el código local con Google Apps Script.

## 7. Desplegar la aplicación

Desde Google Apps Script, desplegar el proyecto como una **Web App**.

La URL generada será utilizada como endpoint para recibir los updates enviados por Telegram.

## 8. Configurar el webhook de Telegram

Finalmente, registrar la URL de la Web App como webhook del bot para que Telegram envíe los mensajes recibidos al `doPost` de la aplicación.

Una vez configurado el webhook, los mensajes enviados al bot comenzarán a ser procesados por el asistente.

# Evolución del proyecto

La idea original era desarrollar una aplicación de gestión financiera con una interfaz gráfica propia. Sin embargo, rápidamente me di cuenta de que estaba dedicando demasiado tiempo al diseño de la interfaz y no tanto al desarrollo de las funcionalidades que realmente quería usar.

A partir de eso surgió la idea de utilizar Telegram como interfaz, lo que me permitió concentrarme en la lógica y las automatizaciones, implementar nuevas herramientas más rápido y empezar a utilizar el proyecto desde etapas tempranas.

Con el tiempo fui incorporando nuevas funcionalidades financieras, un sistema de recordatorios, tests automatizados y fui pasando a una arquitectura más modular.

Así, el proyecto dejó de ser únicamente una herramienta para registrar y administrar gastos y pasó a convertirse en un asistente personal extensible, pensado para integrar distintas herramientas y automatizaciones bajo una misma interfaz.

# Próximas mejoras

- Simplificar la incorporación de nuevos módulos.
- Mejorar el manejo centralizado de configuración.
- Ampliar la cobertura de tests.
- Automatizar verificaciones antes de cada deployment.
- Mejorar la observabilidad y el manejo de errores.
- Desacoplar progresivamente funcionalidades que puedan convertirse en servicios independientes.
- Incorporar nuevas herramientas de visualización de datos.
- Simplificar la forma de interactuar con el asistente.

# Autor

| [<img src="https://github.com/PabloBottinelli.png" width="115"><br><sub>Pablo Bottinelli</sub>](https://github.com/PabloBottinelli) |
| :---: |