# Partner Inquiry form → Google Sheet

The "Become a Partner" modal posts submissions to a Google Sheet via a free
Google Apps Script web app. ~5 minutes to set up.

## 1. Make the Sheet
1. Create a new Google Sheet (e.g. "National Resilience — Partner Inquiries").
2. In row 1, add headers: **Timestamp | Telegram | Phone | Email | Page**

## 2. Add the Apps Script
1. In the Sheet: **Extensions → Apps Script**.
2. Delete any starter code and paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var p = (e && e.parameter) || {};
  sheet.appendRow([
    p.submitted_at || new Date(),
    p.telegram || '',
    p.phone || '',
    p.email || '',
    p.page || ''
  ]);
  return ContentService.createTextOutput('ok');
}
```

3. Click **Save**.

## 3. Deploy as a Web App
1. **Deploy → New deployment**.
2. Gear icon → select type **Web app**.
3. Set **Execute as: Me**, **Who has access: Anyone**.
4. **Deploy**, authorize when prompted, and **copy the Web app URL**
   (it ends in `/exec`).

## 4. Wire it into the site
1. Open `script.js`, find `var FORM_ENDPOINT = "";` (in the partnerModal block).
2. Paste your `/exec` URL between the quotes.
3. Commit + push — done. New submissions append to the Sheet.

> Note: the form is delivered over `no-cors`, so the browser can't read the
> response — that's expected. The row still lands in the Sheet. The form
> shows the "Thank you" state optimistically after sending.

## Test
Open the live site, click **Become a Partner**, submit a test entry, and check
the Sheet for a new row.
