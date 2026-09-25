# Telegram Finance Manager

Gestor de finanzas personales desarrollado en JavaScript sobre Google Apps Script, controlado mediante un bot de Telegram y con Google Sheets como capa de persistencia.

El proyecto permite registrar y consultar gastos, ingresos, tarjetas de crédito, cuotas, deudas, reintegros y recordatorios desde una conversación de Telegram, manteniendo la lógica de negocio separada de la interacción con el usuario y del acceso a los datos.

## Funcionalidades

- Registro de gastos e ingresos.
- Registro de gastos con tarjeta de crédito.
- Manejo de cuotas y vencimientos.
- Administración de tarjetas de crédito.
- Administración de categorías.
- Registro y seguimiento de deudas.
- Administración de deudores y pagos de deuda.
- Registro de descuentos y reintegros.
- Recordatorios programados.
- Resúmenes y totales mensuales.
- Resumen de consumos de tarjetas.
- Flujos conversacionales de varios pasos mediante estados.
- Validación y normalización de las entradas recibidas por Telegram.
- Triggers automáticos mediante Google Apps Script.
- Suite de tests automatizados con Vitest.

## Arquitectura

El proyecto evolucionó desde una implementación inicial más acoplada hacia una arquitectura separada por responsabilidades.

```text
                         Telegram
                             │
                             ▼
                     Webhook / doPost
                             │
                             ▼
                       Update Parser
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
          Command Router             State Router
                │                         │
                └────────────┬────────────┘
                             ▼
                      Commands / Flows
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
               Validators          Services
                                      │
                                      ▼
                                 Repositories
                                      │
                                      ▼
                                Google Sheets


                  Triggers de Apps Script
                           │
                           ▼
                 Recordatorios / tareas
                           │
                           ▼
                        Telegram
```

### Responsabilidades principales

**Commands**

Procesan comandos directos recibidos desde Telegram y coordinan las operaciones necesarias.

**Flows**

Manejan interacciones que requieren varios pasos, conservando el estado de la conversación entre mensajes.

**Services**

Contienen las reglas y lógica de negocio. No dependen de la interfaz de Telegram.

**Repositories**

Encapsulan el acceso a Google Sheets y transforman las operaciones del dominio en lecturas y escrituras sobre las hojas.

**Validators**

Validan y normalizan los datos ingresados por el usuario.

**Parsers**

Transforman texto recibido desde Telegram en datos estructurados.

**Formatters**

Transforman datos del dominio en mensajes listos para mostrar al usuario.

**Mappers**

Convierten filas de Google Sheets en objetos del dominio y viceversa.

## Tecnologías

- JavaScript
- Google Apps Script
- Google Sheets
- Telegram Bot API
- Vitest
- Istanbul
- npm
- clasp
- Git / GitHub

## Estructura del proyecto

```text
telegram-finance-manager/
│
├── app/
│   ├── commandRouter.js
│   ├── errorHandler.js
│   ├── main.js
│   ├── stateRouter.js
│   ├── states.js
│   └── updateParser.js
│
├── config/
│   ├── commands.js
│   ├── messages.js
│   └── sheets.js
│
├── domain/
│   ├── cardStatement/
│   ├── categories/
│   ├── creditCardExpenses/
│   ├── creditCards/
│   ├── debtPayments/
│   ├── debtors/
│   ├── debts/
│   ├── expenses/
│   ├── incomes/
│   ├── items/
│   ├── refunds/
│   ├── reminders/
│   ├── totals/
│   └── triggers/
│
├── services/
│   ├── sheets/
│   ├── telegram/
│   └── triggers/
│
├── shared/
│   ├── coins.js
│   ├── dates.js
│   ├── ids.js
│   ├── inputValidators.js
│   ├── numbers.js
│   └── parsers.js
│
├── tests/
│   ├── unit/
│   └── ...
│
├── context/
│   └── documentación técnica del proyecto
│
├── appsscript.json
├── jsconfig.json
├── package.json
└── package-lock.json
```

## Flujo de una operación

Por ejemplo, al registrar un gasto:

```text
Usuario
  │
  │ mensaje de Telegram
  ▼
Webhook
  │
  ▼
Update Parser
  │
  ▼
Router
  │
  ▼
Flow de gastos
  │
  ├── valida los datos
  │
  ▼
Expense Service
  │
  ├── aplica reglas de negocio
  │
  ▼
Expense Repository
  │
  ▼
Google Sheets
  │
  ▼
Formatter
  │
  ▼
Telegram
```

Esta separación permite modificar la persistencia, las reglas de negocio o la interfaz sin concentrar toda la lógica en un único archivo.

## Testing

El proyecto utiliza Vitest para ejecutar tests automatizados de los distintos dominios y componentes.

Entre otras cosas, se prueban:

- gastos;
- ingresos;
- tarjetas de crédito;
- gastos con tarjeta;
- deudas;
- pagos de deuda;
- deudores;
- categorías;
- reintegros;
- recordatorios;
- totales;
- estados y comandos;
- resumen de tarjetas;
- validaciones de entrada;
- triggers.

Para ejecutar los tests:

```bash
npm install
npm test
```

Para ejecutarlos en modo watch:

```bash
npm run test:watch
```

El proyecto también incluye herramientas para generar reportes de cobertura:

```bash
npm run coverage
```

Los tests utilizan una implementación simulada del entorno de Google Sheets para poder probar la lógica localmente sin depender de una hoja real durante cada ejecución.

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd telegram-finance-manager
```

### 2. Instalar las dependencias de desarrollo

```bash
npm install
```

### 3. Configurar Google Apps Script

El proyecto utiliza `clasp` para sincronizar el código local con Google Apps Script.

La configuración local de `clasp` y los archivos que contienen credenciales no deben versionarse.

Archivos como:

```text
.clasp.json
.clasprc.json
env.js
```

están excluidos del repositorio mediante `.gitignore`.

### 4. Configurar Telegram

El bot necesita un token de Telegram y el identificador autorizado del chat.

Estos valores deben configurarse únicamente de forma local o dentro del entorno de Apps Script y nunca deben almacenarse en Git.

Ejemplo conceptual:

```javascript
const TELEGRAM_TOKEN = "...";
const TELEGRAM_CHAT_ID = "...";
```

No se deben subir credenciales reales al repositorio.

### 5. Desplegar

Una vez configurado el proyecto de Apps Script:

```bash
clasp push
```

El proyecto puede desplegarse como Web App para recibir los updates enviados por Telegram mediante webhook.

## Seguridad

El repositorio no almacena tokens ni credenciales de acceso.

Los archivos de configuración sensibles se mantienen fuera del control de versiones mediante `.gitignore`.

Además, antes de publicar el proyecto se realizó un escaneo completo del historial Git con Gitleaks para detectar posibles secretos versionados.

## Decisiones de diseño

### Google Sheets como persistencia

Google Sheets permite mantener una base de datos simple, visible y editable sin necesidad de desplegar infraestructura adicional.

El acceso a las hojas está encapsulado en repositories para evitar que el resto de la aplicación dependa directamente de su implementación.

### Telegram como interfaz

Telegram funciona como interfaz del sistema, permitiendo registrar movimientos rápidamente desde cualquier dispositivo sin desarrollar una aplicación frontend independiente.

### Estados conversacionales

Algunas operaciones requieren varios datos antes de poder completarse.

Los flows y estados permiten implementar conversaciones como:

```text
Registrar gasto
      ↓
Ingresar monto
      ↓
Seleccionar categoría
      ↓
Seleccionar medio de pago
      ↓
Confirmar
```

sin mezclar la lógica de conversación con las reglas de negocio.

### Separación entre lógica y presentación

Los services no envían mensajes directamente a Telegram.

La lógica del dominio devuelve resultados que luego son transformados por formatters y enviados por la capa correspondiente.

Esto permite testear la lógica sin depender de Telegram.

## Evolución del proyecto

El proyecto comenzó como una automatización personal para registrar movimientos en Google Sheets desde Telegram.

A medida que fueron aumentando las funcionalidades, la estructura fue evolucionando hacia una arquitectura modular con separación entre:

```text
interfaz
estado
lógica de negocio
validación
persistencia
formato
```

También se incorporó progresivamente una suite de tests automatizados para cubrir reglas de negocio y casos límite detectados durante el desarrollo.

## Próximas mejoras

Algunas posibles extensiones del proyecto son:

- dashboards y visualizaciones de gastos;
- presupuestos mensuales por categoría;
- alertas de desvíos respecto del presupuesto;
- análisis histórico de gastos;
- reportes automáticos mensuales;
- mejoras en la gestión de configuración y secretos;
- mayor automatización del proceso de deployment;
- integración continua para ejecutar los tests en cada cambio.

## Autor

**Pablo Bottinelli**

Proyecto desarrollado como herramienta personal y como ejercicio de diseño, automatización, testing y arquitectura de software.