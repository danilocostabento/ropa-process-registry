/**
 * Adds a custom menu to the Google Sheets UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Privacy')
    .addItem('Sync approved records', 'syncApprovedRecords')
    .addToUi();
}

// =====================================================================
//  WEB APP ENTRY POINT
// =====================================================================

/**
 * Web App entry point.
 * Renders the main HTML form.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.params = e ? e.parameter : {};
  
  return template.evaluate()
    .setTitle('RoPA Registration Form');
}

/**
 * Includes HTML partials (CSS / JS).
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}
