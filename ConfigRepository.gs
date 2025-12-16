/**
 * Retrieves business areas from a configuration sheet.
 * Expects area names in column A, starting at row 2.
 * @returns {string[]}
 */
function getAreas() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = spreadsheet.getSheetByName('Config');

    if (!configSheet) {
      throw new Error('Config sheet not found.');
    }

    const range = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 1);
    return range
      .getValues()
      .map(row => row[0])
      .filter(Boolean);

  } catch (error) {
    Logger.log(error);
    return ['Error loading areas'];
  }
}

/**
 * Builds a map relating AREA NAME (uppercase) to a Google Drive folder ID.
 * Expected columns:
 * - Column A: Area Name
 * - Column L: Folder ID
 * @returns {Map<string, string>}
 */
function getAreaFolderIdMap() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName('Config');
  const map = new Map();

  if (configSheet && configSheet.getLastRow() > 1) {
    const data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 12).getValues();
    data.forEach(row => {
      const areaName = row[0];
      const folderId = row[11];
      if (areaName && folderId) {
        map.set(
          String(areaName).trim().toUpperCase(),
          String(folderId).trim()
        );
      }
    });
  }

  return map;
}

/**
 * Builds a map relating AREA NAME (uppercase) to a Google Sheets ID.
 * Expected columns:
 * - Column A: Area Name
 * - Column J: Spreadsheet ID
 * @returns {Map<string, string>}
 */
function getAreaSheetIdMap() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName('Config');
  const map = new Map();

  if (configSheet && configSheet.getLastRow() > 1) {
    const data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 10).getValues();
    data.forEach(row => {
      const areaName = row[0];
      const sheetId = row[9];
      if (areaName && sheetId) {
        map.set(
          String(areaName).trim().toUpperCase(),
          String(sheetId).trim()
        );
      }
    });
  }

  return map;
}

/**
 * Builds a map relating AREA NAME (uppercase) to an internal area code.
 * Expected columns:
 * - Column A: Area Name
 * - Column K: Area Code
 * @returns {Map<string, string>}
 */
function getAreaCodeMap() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName('Config');
  const map = new Map();

  if (configSheet && configSheet.getLastRow() > 1) {
    const data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 11).getValues();
    data.forEach(row => {
      const areaName = row[0];
      const areaCode = row[10];
      if (areaName && areaCode) {
        map.set(
          String(areaName).trim().toUpperCase(),
          String(areaCode).trim().toUpperCase()
        );
      }
    });
  }

  return map;
}

/**
 * Retrieves notification email addresses from configuration.
 * Expected cell:
 * - M1: comma-separated email list
 * @returns {string|null}
 */
function getNotificationEmails() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = spreadsheet.getSheetByName('Config');
    const emailCell = configSheet.getRange('M1').getValue();

    if (emailCell && typeof emailCell === 'string' && emailCell.includes('@')) {
      return emailCell.trim();
    }

    Logger.log('Notification emails not found or invalid.');
    return null;

  } catch (error) {
    Logger.log(`Error retrieving notification emails: ${error.message}`);
    return null;
  }
}
