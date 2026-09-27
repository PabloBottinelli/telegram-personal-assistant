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

Actualmente incluye un módulo completo de gestión de finanzas personales (con unas cuantas mejoras y ampliaciones a realizar) y un sistema de recordatorios, pero la idea es poder incorporar nuevas funcionalidades de forma progresiva sin concentrar toda la lógica en un único módulo.

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

- registro de gastos;
- registro de ingresos;
- registro de gastos con tarjeta de crédito;
- administración de tarjetas;
- fechas de cierre y vencimiento;
- armado de resúmenes de tarjetas;
- categorías personalizadas;
- descuentos y reintegros;
- manejo de deudas y deudores;
- totales de gastos e ingresos mensuales;
- soporte para distintas monedas;
- formatos rápidos para registrar operaciones frecuentes.
- triggers de avisos relevantes

Algunas operaciones utilizan flujos conversacionales de varios pasos para solicitar únicamente la información necesaria en cada momento.

Por ejemplo:

```text
Crear ingreso -> Elegir categoría -> Guardar
```

## Recordatorios

El asistente permite crear recordatorios directamente desde Telegram junto con una descripción, frecuencia y horario.

Actualmente soporta distintos tipos de frecuencias:

- semanal;
- mensual;
- cada N días;
- fecha única;
- varios días específicos de la semana.

Los recordatorios son procesados automáticamente mediante triggers de Google Apps Script y enviados por Telegram cuando corresponde.

# Arquitectura

El proyecto fue evolucionando desde una implementación procedural hacia una arquitectura modular con responsabilidades separadas.

```mermaid
flowchart LR
   subgraph Recordatorios["<b>Recordatorios/Avisos</b>"]
        TR["<b>Triggers de Apps Script</b><br>Ejecución programada"]
        PA["<b>Procesamiento automatico</b><br>"]
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

El bot guía al usuario durante el registro y permite consultar posteriormente la información almacenada.

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

| Métrica | Cobertura | Cubiertos |
| --- | ---: | ---: |
| Statements | **87.54%** | 1758 / 2008 |
| Branches | **71.49%** | 760 / 1063 |
| Functions | **90.60%** | 347 / 383 |
| Lines | **89.64%** | 1688 / 1883 |

## Ejecutar los tests

```bash
npm install
npm test
```

Modo watch:

```bash
npm run test:watch
```

## Coverage

El proyecto incluye herramientas para generar reportes de cobertura:

```bash
npm run coverage
```

También existen comandos auxiliares para comparar reportes de cobertura antes y después de modificaciones.

# Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/PabloBottinelli/telegram-personal-assistant.git
cd telegram-personal-assistant
```

## 2. Instalar las dependencias de desarrollo

```bash
npm install
```

## 3. Configurar Google Apps Script

El proyecto utiliza `clasp` para trabajar localmente con Google Apps Script.

Los archivos locales de autenticación y configuración sensible no forman parte del repositorio.

Entre ellos:

```text
.clasp.json
.clasprc.json
env.js
```

## 4. Configurar Telegram

Para ejecutar el bot es necesario configurar:

- crear bot de telegram con @BotFather
- obtener token del bot de Telegram;
- obtener id del chat autorizado;
- proyecto correspondiente de Google Apps Script;
- Google Sheets utilizado para la persistencia.

Las credenciales deben mantenerse fuera del control de versiones.

## 5. Sincronizar con Apps Script

Una vez configurado `clasp`:

```bash
clasp push
```

El proyecto puede desplegarse como una Web App de Google Apps Script para recibir los updates enviados por Telegram.

# Evolución del proyecto

La idea original era desarrollar una aplicación de gestión financiera con una interfaz gráfica propia. Sin embargo, rápidamente me di cuenta de que estaba dedicando demasiado tiempo al diseño de la interfaz y no tanto al desarrollo de las funcionalidades que realmente quería usar.

A partir de eso surgió la idea de utilizar Telegram como interfaz, lo que me permitió concentrarme en la lógica y las automatizaciones, implementar nuevas herramientas más rápido y empezar a utilizar el proyecto desde etapas tempranas.

Con el tiempo fui incorporando nuevas funcionalidades financieras, un sistema de recordatorios, tests automatizados y fuí pasando a una arquitectura más modular.

Así, el proyecto dejó de ser únicamente una herramienta para registrar y administrar gastos y pasó a convertirse en un asistente personal.

# Próximas mejoras

- simplificar la incorporación de nuevos módulos;
- mejorar el manejo centralizado de configuración;
- ampliar la cobertura de tests;
- automatizar verificaciones antes de cada deployment;
- mejorar observabilidad y manejo de errores;
- desacoplar progresivamente funcionalidades que puedan convertirse en servicios independientes;
- incorporar nuevas herramientas de visualización de datos;
- simplificar la forma de interactuar con el asistente;

# Autor

| [<img src="https://github.com/PabloBottinelli.png" width="115"><br><sub>Pablo Bottinelli</sub>](https://github.com/PabloBottinelli) |
| :---: |