# RoPA Mapping System (LGPD Compliance)

## Overview

This project implements a **RoPA (Record of Processing Activities) mapping system** designed to support LGPD compliance. It provides a structured, auditable, and scalable way to collect, review, consolidate, and maintain information about personal data processing activities across different organizational areas.

The solution is built entirely on the **Google Workspace ecosystem**, combining:

* Google Sheets (data storage and governance)
* Google Apps Script (business logic and automation)
* A Web App form (standardized data collection)

The architecture centralizes control within the LGPD team while ensuring usability, transparency, and controlled visibility for business areas.

---

## Key Features

* 🌐 Web-based form for standardized process submission
* 🧩 Dynamic configuration via Google Sheets (no hard-coded areas)
* 🔔 Automated email notifications to the LGPD team
* 🏷️ Controlled triage workflow with mandatory comments
* 📦 Staging and consolidation mechanism before master registration
* 🔢 Automatic generation of unique RoPA IDs per area
* 📊 Centralized and sortable Master RoPA Register
* 🔐 Permission-based access model

---

## System Architecture

### Main Components

#### 1. Web Form (Google Apps Script Web App)

* Entry point for users from each area
* Dynamically loads areas and examples from the configuration sheet
* Validates mandatory fields
* Submits data and attachments to the correct Area Spreadsheet

#### 2. LGPD Master Spreadsheet

* Central control and governance point
* Hosts the main Apps Script project (Web App)
* Stores configuration and the final Master RoPA Register

Key sheets:

* **Dados** (Critical configuration)
* **REGISTRO MESTRE_FCAV** (Final consolidated RoPA register)

#### 3. Area Spreadsheets

* One spreadsheet per organizational area (e.g., HR, Finance)
* Used for triage, staging, and controlled visibility

Key sheets:

* **Registros** – incoming submissions and LGPD triage
* **Processos Aprovados** – approved records waiting for consolidation

#### 4. Google Apps Script

* **Main Script (Master Spreadsheet)**

  * Serves the Web App
  * Reads configuration
  * Sends notifications
  * Consolidates approved records into the Master Register

* **Area Scripts (Area Spreadsheets)**

  * Handle triage logic
  * Enforce mandatory comments
  * Manage status changes and notes

---

## Data Flow

1. **Submission**

   * User fills out the Web Form and selects their Area

2. **Reception**

   * Data is saved in the corresponding Area Spreadsheet (`Registros` sheet)
   * Initial status: `Pending`
   * LGPD team is notified by email

3. **Triage (LGPD Team)**

   * Status options:

     * Pending
     * Duplicate (comment required)
     * Needs Information (comment required)
     * Approved

4. **Staging**

   * Approved records are copied to `Processos Aprovados`
   * Status set to `Approved for Master`

5. **Consolidation**

   * LGPD team runs: **LGPD > Transfer Approved to Master**
   * Records are:

     * Validated
     * Assigned a sequential ID per area
     * Copied to the Master Register
     * Marked as `Transferred to Master` in Area Spreadsheets

---

## Configuration

### Configuration Sheet (`Dados`)

| Column | Purpose                                         |
| ------ | ----------------------------------------------- |
| A      | Area name (must match form selection)           |
| B–I    | Example texts for form tooltips (`;` separated) |
| J      | Area Spreadsheet ID                             |
| K      | Area code (used in Master ID generation)        |
| L      | Google Drive folder ID (optional usage)         |
| M1     | Notification emails (comma-separated)           |

---

## Permissions Model

* **LGPD Team**

  * Edit access to all spreadsheets
  * Executes consolidation and maintenance

* **Business Areas**

  * Read-only access to their Area Spreadsheet
  * Visibility into approved processes only

* **Web App Execution**

  * Runs as the script owner
  * Requires edit access to all Area Spreadsheets

---

## Deployment Notes

* Any change to the **Main Script** requires a new Web App deployment
* Any change to **Area Scripts** must be replicated across all Area Spreadsheets
* Installable triggers are required for triage automation

---

## Troubleshooting

Common checks:

* Web App URL must use `/exec`
* Configuration sheet (`Data`) must be correctly populated
* Status labels must match exactly
* Required triggers must be installed and authorized
* Script owner must have sufficient permissions

---

## Disclaimer

This repository represents a **technical reference implementation**. Any organizational identifiers, visual identity, or sensitive operational details should be adapted or removed before reuse in other environments.

---

## Author

**Danilo Costa Bento**
Privacy, Data Protection & Process Automation
