# Website Blocker

A Chrome browser extension (Manifest V3) that lets you maintain a list of URLs
and blocks access to any website on that list.

## Features

- Add multiple websites to a block list from the toolbar popup or the options page.
- Blocks the domain **and all of its subdomains** (e.g. blocking `reddit.com`
  also blocks `www.reddit.com` and `old.reddit.com`).
- Navigating to a blocked site redirects to a friendly "blocked" page.
- Remove sites at any time.
- The block list is stored with `chrome.storage.sync`, so it syncs across the
  devices you're signed into Chrome on.
- Uses the `declarativeNetRequest` API, so blocking happens efficiently at the
  network layer.

## Installation (load unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this project folder (`websiteBlocker`).
5. The Website Blocker icon will appear in your toolbar.

## Usage

- Click the toolbar icon to open the popup.
- Type a domain (e.g. `facebook.com`) and click **Add**.
- The site is blocked immediately. Visiting it shows the blocked page.
- To manage the full list, right-click the icon → **Options**, or open the
  popup. Click **Remove** next to any entry to unblock it.

Entries are normalized automatically — you can paste a full URL like
`https://www.example.com/some/path` and it will be stored as `example.com`.

## How it works

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest (MV3), permissions, and entry points. |
| `background.js` | Service worker that converts the block list into `declarativeNetRequest` dynamic rules. |
| `popup.html` / `popup.js` | Toolbar popup UI for adding/removing sites. |
| `options.html` | Full-page management UI (reuses `popup.js`). |
| `blocked.html` / `blocked.js` | The page shown when a blocked site is requested. |
| `styles.css` | Shared styling for the popup and options page. |
| `icons/` | Extension icons. |

The block list lives under the `blockedSites` key in `chrome.storage.sync`.
Whenever it changes, `background.js` rebuilds the dynamic blocking rules.
