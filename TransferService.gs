/**
 * Transfers approved records from multiple area spreadsheets
 * into a centralized master register.
 *
 * Assumptions:
 * - Master headers start on row 3
 * - Area sheets contain a "Status" column
 * - Records marked as "Approved" are eligible for transfer
 */
function transferApprovedRecordsToMaster() {
  const ui = SpreadsheetApp.getUi();
  const mainSS = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = mainSS.getSheetByName('MASTER_REGISTER');

  const areaSheetMap = getAreaSheetIdMap();   // AREA_NAME -> Spreadsheet ID
  const areaCodeMap = getAreaCodeMap();       // AREA_NAME -> AREA CODE

  if (!masterSheet) {
    ui.alert('Master register sheet not found.');
    return;
  }

  // Read master headers (row 3)
  const masterHeaders = masterSheet
    .getRange(3, 1, 1, masterSheet.getLastColumn())
    .getValues()[0]
    .map(h => String(h || '').trim());

  const masterHeaderMap = createHeaderMap(masterHeaders);
  const idColumnIndex = masterHeaderMap.get('ID');

  if (idColumnIndex === undefined) {
    ui.alert('ID column not found in master register.');
    return;
  }

  const existingIdRowMap = new Map();
  const lastSequentialNumbers = new Map();

  // Discover last used ID per area code
  if (masterSheet.getLastRow() > 3) {
    const ids = masterSheet
      .getRange(4, idColumnIndex + 1, masterSheet.getLastRow() - 3, 1)
      .getValues();

    ids.forEach((row, index) => {
      const id = String(row[0]).trim();
      if (!id) return;

      existingIdRowMap.set(id, index + 4);

      const code = id.slice(0, -3);
      const number = parseInt(id.slice(-3), 10);
      if (!isNaN(number)) {
        lastSequentialNumbers.set(
          code,
          Math.max(lastSequentialNumbers.get(code) || 0, number)
        );
      }
    });
  }

  const rowsToInsert = [];
  const rowsToUpdate = [];
  const areaUpdates = [];

  const STATUS_APPROVED = 'Approved';
  const STATUS_TRANSFERRED = 'Transferred';

  areaSheetMap.forEach((spreadsheetId, areaName) => {
    try {
      const areaSS = SpreadsheetApp.openById(spreadsheetId);
      const areaSheet = areaSS.getSheetByName('RECORDS');
      if (!areaSheet || areaSheet.getLastRow() < 2) return;

      const data = areaSheet.getDataRange().getValues();
      const headers = data.shift().map(h => String(h).trim());
      const headerMap = createHeaderMap(headers);

      const statusCol = headerMap.get('Status');
      const idCol = headerMap.get('ID');

      if (statusCol === undefined) return;

      const areaCode = areaCodeMap.get(areaName);
      if (!areaCode) return;

      data.forEach((row, index) => {
        if (row[statusCol] !== STATUS_APPROVED) return;

        const rowNumber = index + 2;
        let finalId;
        let isUpdate = false;

        const existingId = idCol !== undefined ? String(row[idCol]).trim() : '';

        if (existingId && existingIdRowMap.has(existingId)) {
          finalId = existingId;
          isUpdate = true;
        } else {
          const nextNumber = (lastSequentialNumbers.get(areaCode) || 0) + 1;
          lastSequentialNumbers.set(areaCode, nextNumber);
          finalId = areaCode + String(nextNumber).padStart(3, '0');
        }

        const masterRow = new Array(masterHeaders.length).fill('');

        masterHeaders.forEach((header, colIndex) => {
          switch (header) {
            case 'ID':
              masterRow[colIndex] = finalId;
              break;
            case 'AREA':
              masterRow[colIndex] = areaName;
              break;
            case 'STATUS':
              masterRow[colIndex] = 'Pending';
              break;
            case 'PROCESS':
              masterRow[colIndex] = row[headerMap.get('Process')];
              break;
            case 'OWNER':
              masterRow[colIndex] = row[headerMap.get('Owner')];
              break;
            case 'COMMENTS':
              masterRow[colIndex] = row[headerMap.get('Comments')] || '';
              break;
          }
        });

        if (isUpdate) {
          rowsToUpdate.push({
            rowNumber: existingIdRowMap.get(finalId),
            values: [masterRow]
          });
        } else {
          rowsToInsert.push(masterRow);
        }

        areaUpdates.push({
          sheet: areaSheet,
          row: rowNumber,
          statusCol: statusCol + 1,
          idCol: idCol !== undefined ? idCol + 1 : null,
          id: finalId
        });
      });

    } catch (error) {
      Logger.log(`Error processing area ${areaName}: ${error.message}`);
    }
  });

  // Write new records
  if (rowsToInsert.length) {
    masterSheet
      .getRange(masterSheet.getLastRow() + 1, 1, rowsToInsert.length, masterHeaders.length)
      .setValues(rowsToInsert);
  }

  // Update existing records
  rowsToUpdate.forEach(update => {
    masterSheet
      .getRange(update.rowNumber, 1, 1, masterHeaders.length)
      .setValues(update.values);
  });

  // Update area sheets
  areaUpdates.forEach(update => {
    update.sheet.getRange(update.row, update.statusCol).setValue(STATUS_TRANSFERRED);
    if (update.idCol) {
      update.sheet.getRange(update.row, update.idCol).setValue(update.id);
    }
  });

  ui.alert(`Transfer completed. ${rowsToInsert.length} new records and ${rowsToUpdate.length} updates.`);
}
