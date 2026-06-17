/**
 * INWARD STOCK — Apps Script backend
 * ───────────────────────────────────
 * This file is NOT uploaded to GitHub. Copy/paste its contents into:
 *   Your Google Sheet → Extensions → Apps Script
 * then deploy it as a Web App (see README.md for exact steps).
 *
 * It appends one row per submission to the "Inward Daily" sheet with
 * columns: Date | Timestamp | Name | Rack ID | SKU | Qty
 */

const SHEET_ID = "16u9ZGfrvtqKo49kFw-AeyZ6pNfNgnUaJmbwcn-k3YM4";
const SHEET_NAME = "Inward Daily";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Timestamp", "Name", "Rack ID", "SKU", "Qty"]);
    }

    sheet.appendRow([
      data.date || "",
      data.timestamp || "",
      data.name || "",
      data.rack || "",
      data.sku || "",
      data.qty || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Inward Stock API is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
