// Website Blocker - background service worker
// Maintains declarativeNetRequest dynamic rules based on the user's blocklist
// stored in chrome.storage.sync under the key "blockedSites".

const STORAGE_KEY = "blockedSites";
const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");

/**
 * Normalize a user-supplied entry into a hostname-style pattern usable by
 * declarativeNetRequest's urlFilter. We strip protocol, paths, and "www.".
 * Returns null for empty/invalid entries.
 */
function normalizeEntry(raw) {
  if (!raw) return null;
  let value = String(raw).trim().toLowerCase();
  if (!value) return null;

  // Remove protocol if present.
  value = value.replace(/^[a-z]+:\/\//, "");
  // Remove anything after the first slash, query, or hash.
  value = value.split("/")[0].split("?")[0].split("#")[0];
  // Remove a leading "www." so "www.example.com" and "example.com" both match.
  value = value.replace(/^www\./, "");
  // Drop a port if any.
  value = value.split(":")[0];

  if (!value) return null;
  return value;
}

/**
 * Build declarativeNetRequest rules from a list of normalized hostnames.
 * Each entry blocks the domain and all of its subdomains for main-frame
 * navigations, redirecting to our blocked page.
 */
function buildRules(sites) {
  const rules = [];
  let id = 1;
  for (const site of sites) {
    const pattern = normalizeEntry(site);
    if (!pattern) continue;
    rules.push({
      id: id++,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: BLOCKED_PAGE + "?site=" + encodeURIComponent(pattern) }
      },
      condition: {
        // "||" matches the domain and any subdomain; "^" terminates the host.
        urlFilter: "||" + pattern + "^",
        resourceTypes: ["main_frame"]
      }
    });
  }
  return rules;
}

/**
 * Re-sync the dynamic rule set with the current blocklist in storage.
 */
async function refreshRules() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  const sites = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const newRules = buildRules(sites);

  // Remove all existing dynamic rules, then add the freshly built ones.
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: newRules
  });
}

// Rebuild rules when the extension is installed/updated or the browser starts.
chrome.runtime.onInstalled.addListener(refreshRules);
chrome.runtime.onStartup.addListener(refreshRules);

// Rebuild rules whenever the blocklist changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    refreshRules();
  }
});

// Allow popup/options pages to request an immediate refresh.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "refreshRules") {
    refreshRules().then(() => sendResponse({ ok: true }));
    return true; // keep the message channel open for the async response
  }
});
