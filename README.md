<p align="center">
  <a href="README.md">🇬🇧 English</a> |
  <a href="README.es.md">🇦🇷 Español</a>
</p>

<p align="center">
  <img src="assets/telegram-personal-assistant-banner.png" alt="Telegram Personal Assistant Banner" width="100%">
</p>

![Status](https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-4C9A2A)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript\&logoColor=000)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=googleappsscript\&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram\&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest\&logoColor=white)

# Description

A personal assistant controlled through Telegram that integrates various modules and everyday tools to simplify data entry and automate workflows, providing a single, easy-to-use interface.

It currently includes personal finance management tools, a reminder system, and a banking promotions search module integrated with a separate project. The architecture is designed to support the gradual addition of new features without concentrating all the logic in a single module.

# Design Decisions

## Telegram as the Interface

Telegram provides an interface accessible from any device without the need to develop and maintain a separate frontend. This allows me to focus development efforts on the assistant's features and utilities rather than on building a user interface.

## Google Sheets as Data Storage

For the finance and reminder modules, Google Sheets provides a simple, transparent, and easily editable storage solution without requiring additional infrastructure.

Data access is encapsulated through repositories to reduce coupling between the persistence layer and business logic.

# Current Features

## Personal Finance

The finance module allows users to manage different aspects of their personal finances directly through Telegram.

Its main features include:

* **Expense and income tracking:** Records details such as date, amount, category, description, and any applicable discount or cashback. It also allows tracking cashback payments that are credited after the purchase.
* **Credit card expense tracking:** Records the card used and the number of installments, which are then used to generate credit card statements.
* **Credit card management:** Tracks cards, statement closing dates, and payment due dates.
* **Credit card statements:** Calculates the amounts due for each credit card.
* **Debt management:** Tracks debts, money owed by others, and debt repayments.
* **Monthly summaries:** Provides monthly expense and income totals.
* **Quick-entry formats:** Simplifies the registration of frequent transactions.
* **Automated notifications:** Sends alerts for relevant events, such as credit card statement closing dates and payment deadlines.

Some operations use multi-step conversational flows to request only the information needed at each stage.

For example:

```text
Create income -> Select category -> Save
```

## Reminders

The assistant allows users to create reminders directly through Telegram by specifying a description, frequency, and time.

It currently supports several scheduling options:

* Weekly.
* Monthly.
* Every N days.
* One-time reminders.
* Specific days of the week.

Reminders are automatically processed using Google Apps Script triggers and sent through Telegram when scheduled.

## Banking Promotions

The assistant allows users to search for banking discounts and benefits directly through Telegram by integrating with [Banking Promotions](https://github.com/PabloBottinelli/promociones-bancarias), a separate project I am developing in Python.

The system collects and normalizes promotions from different Argentine banks, stores the information in Supabase, and keeps it updated through automated processes.

The assistant retrieves this information through the Supabase REST API, using an RPC function to perform keyword-based searches.

Matching promotions are displayed in Telegram with relevant details, including discounts, payment methods, interest-free installments, applicable days, cashback limits, validity periods, and conditions.

For example:

<p align="left">
  <img src="assets/demoPromos.png" alt="Banking promotions search example" width="30%">
</p>

# Architecture

The project has evolved from a procedural implementation into a modular architecture with clearly separated responsibilities.

```mermaid
flowchart LR
   subgraph Reminders["<b>Reminders / Notifications</b>"]
        TR["<b>Apps Script Triggers</b><br>Scheduled execution"]
        PA["<b>Automated Processing</b>"]
        T2["<b>Telegram</b><br>Sends notifications"]

        TR --> PA
        PA --> T2
    end

    subgraph Main["<b>Main Flow</b>"]
      T1["<b>Telegram</b><br>User interface"]
      W["<b>Webhook / doPost</b><br>Receives messages"]
      P["<b>Update Parser</b><br>Parses and normalizes updates"]
      CR["<b>Command Router</b><br>Routes commands"]
      SR["<b>State Router</b><br>Manages conversational state"]
      CF["<b>Commands / Flows</b><br>Coordinate operations"]
      V["<b>Validators</b><br>Validate and normalize inputs"]
      S["<b>Services</b><br>Business logic"]
      R["<b>Repositories</b><br>Manage data access"]
      GS[("<b>Google Sheets</b><br>Data storage")]
      PS["<b>PromotionsService</b><br>Promotion queries"]
      SB[("<b>Supabase</b><br>Banking promotions")]

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

        S --> PS
        PS --> SB

    end

    Main ~~~ Reminders
```

# Usage Example

Example of recording an income transaction and subsequently retrieving the stored information.

<p align="center">
  <img src="assets/demo.gif" width="500" alt="Telegram Personal Assistant demo">
</p>

# Testing

The project uses **Vitest** and a simulated Google Sheets environment to test business logic locally without relying on a real spreadsheet.

The test suite covers all major features, although there is still room to improve coverage and reduce dependencies on hardcoded values and variable conditions, such as the current date, which can make some tests fragile over time.

The project includes tools for generating test coverage reports:

![Statements](https://img.shields.io/badge/Statements-87.54%25-brightgreen)
![Branches](https://img.shields.io/badge/Branches-71.49%25-yellow)
![Functions](https://img.shields.io/badge/Functions-90.60%25-brightgreen)
![Lines](https://img.shields.io/badge/Lines-89.64%25-brightgreen)

Additional utility commands are available to compare coverage reports before and after making changes.

# Project Evolution

The original idea was to develop a personal finance management application with its own graphical interface. However, I quickly realized that I was spending too much time designing the interface rather than developing the features I actually wanted to use.

This led me to adopt Telegram as the interface, allowing me to focus on business logic and automation, implement new tools faster, and start using the project from its early development stages.

Over time, I added new financial features, a reminder system, automated tests, and gradually refactored the codebase toward a more modular architecture.

The project eventually evolved from a simple expense-tracking tool into an extensible personal assistant designed to integrate different utilities, automations, and external services through a single interface.

# Future Improvements

* Simplify the process of adding new modules.
* Improve centralized configuration management.
* Expand test coverage.
* Automate checks before each deployment.
* Improve observability and error handling.
* Gradually decouple features that could become independent services.
* Introduce new data visualization tools.
* Simplify user interactions with the assistant.

# Author

| [<img src="https://github.com/PabloBottinelli.png" width="115"><br><sub>Pablo Bottinelli</sub>](https://github.com/PabloBottinelli) |
| :---------------------------------------------------------------------------------------------------------------------------------: |
