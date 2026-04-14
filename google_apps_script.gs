/**
 * Simple Google Apps Script to accept POSTed JSON and append to a sheet.
 * Usage:
 * 1. Create a new Apps Script project bound to your Google Sheet or use standalone.
 * 2. Replace SPREADSHEET_ID with your sheet id or deploy the script as 'Execute as: Me' and 'Who has access: Anyone, even anonymous' (or restrict as needed).
 * 3. Deploy as Web App and use the web app URL in the client-side `GAS_WEBAPP_URL`.
 */

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    const ts = new Date();
    const packages = (body.packages || []).join(', ');

    const row = [ts, body.name || '', body.phone || '', body.address || '', body.pincode || '', packages];
    sheet.appendRow(row);

    // Return JSON with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify({ result: 'success' }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    const output = ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.message }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * Support JSONP via GET to avoid CORS from browser clients.
 * Call the web app with query params and a `callback` param:
 *   https://script.google.com/.../exec?callback=gsCallback&name=...&phone=...&address=...&pincode=...&packages=...
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const callback = params.callback;
    const packagesRaw = params.packages || '';
    const packagesArr = packagesRaw ? packagesRaw.split('|').map(decodeURIComponent) : [];

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const ts = new Date();

    const row = [
      ts, 
      params.name || '', 
      params.phone || '', 
      params.address || '', 
      params.pincode || '', 
      packagesArr.join(', '),
      params.total || '0'
    ];
    sheet.appendRow(row);

    const payload = { result: 'success' };
    const json = JSON.stringify(payload);

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const payload = { result: 'error', message: err.message };
    const json = JSON.stringify(payload);
    const callback = (e.parameter || {}).callback;
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
