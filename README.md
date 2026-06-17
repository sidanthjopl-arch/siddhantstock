# Inward Stock — Rack & SKU Entry Terminal

A simple phone-friendly web app for warehouse staff: log in, scan a rack code,
scan/type a SKU, see its photo, enter quantity, save — the entry is written
straight into your **Inward Daily** Google Sheet.

## How it works

- **Frontend** (this repo): plain HTML/CSS/JS, hosted free on GitHub Pages.
- **Reading SKUs**: fetches your already-published `Sheet1` CSV link directly
  (no server needed for this part).
- **Writing entries**: Google Sheets doesn't allow public writes, so a small
  Google Apps Script acts as the "save" endpoint. The app sends each entry to
  it, and it appends a row to **Inward Daily**.

## ⚠️ Important security note

The login here is a simple gate, **not real security**. The usernames and
passwords live in `app.js`, which is plain text in your GitHub repo — anyone
who finds the repo or opens the browser dev tools can read them. That's fine
for keeping casual visitors out of an internal warehouse tool, but don't
reuse these passwords anywhere sensitive, and don't store anything truly
confidential behind this login.

## Step 1 — Deploy the Apps Script (one-time setup)

1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Delete any starter code in the editor, then paste in the contents of
   `AppsScript.gs` (included in this folder).
4. Click **Save** (the file/disk icon).
5. Click **Deploy → New deployment**.
6. Next to "Select type", click the gear icon and choose **Web app**.
7. Set:
   - Description: `Inward Stock API` (anything you like)
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**. Google will ask you to authorize — click **Authorize
   access**, choose your account, click **Advanced → Go to (project name)
   (unsafe)**, then **Allow**. (This warning appears because it's your own
   unpublished script — it's expected.)
9. Copy the **Web app URL** shown (it ends in `/exec`).

## Step 2 — Point the app at your script

1. Open `config.js` in this folder.
2. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL you copied.
3. The `SKU_CSV_URL` is already filled in with the Sheet1 publish link you
   gave — double check it by opening it in a browser; it should show two
   columns: SKU and image link.

## Step 3 — Put it on GitHub Pages

1. Create a new GitHub repository (can be public or private — private Pages
   needs a paid GitHub plan).
2. Upload these files to the repo root: `index.html`, `style.css`, `app.js`,
   `config.js`. (`AppsScript.gs` and this `README.md` are just references —
   no harm in uploading them too, but they're not used by the site.)
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**,
   branch **main**, folder **/ (root)**, then **Save**.
5. Wait about a minute, then open the URL GitHub shows you
   (something like `https://yourname.github.io/your-repo/`).

## Step 4 — Test it

1. Open the site on a phone, log in as one of the operators.
2. Scan or type a rack code → **Confirm rack**.
3. Scan or type a SKU that exists in Sheet1, column A → its photo should
   appear.
4. Enter a quantity → **Save entry**.
5. Open your Google Sheet and check the **Inward Daily** tab — a new row
   should appear with Date, Timestamp, Name, Rack ID, SKU, Qty.

If nothing appears in the sheet, double-check the Apps Script URL in
`config.js` and that the deployment's access is set to "Anyone".

## Editing the operator list later

Open `app.js` and edit the `USERS` object near the top — add, remove, or
change any name/password pair, then re-upload the file to GitHub.
