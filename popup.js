// Popup logic: shared list management for adding/removing blocked sites.

const STORAGE_KEY = "blockedSites";

const form = document.getElementById("add-form");
const input = document.getElementById("site-input");
const list = document.getElementById("site-list");
const emptyState = document.getElementById("empty-state");
const message = document.getElementById("message");

/** Normalize an entry the same way the background worker does. */
function normalizeEntry(raw) {
  if (!raw) return null;
  let value = String(raw).trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z]+:\/\//, "");
  value = value.split("/")[0].split("?")[0].split("#")[0];
  value = value.replace(/^www\./, "");
  value = value.split(":")[0];
  if (!value) return null;
  // Basic sanity check: must contain a dot and only valid hostname chars.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) return null;
  return value;
}

async function getSites() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function saveSites(sites) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: sites });
}

function showMessage(text, isError) {
  message.textContent = text;
  message.className = "hint" + (isError ? " error" : "");
  if (text) {
    setTimeout(() => {
      message.textContent = "";
    }, 2500);
  }
}

function render(sites) {
  list.innerHTML = "";
  if (sites.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  for (const site of sites) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "site-name";
    span.textContent = site;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeSite(site));

    li.appendChild(span);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
}

async function addSite(raw) {
  const site = normalizeEntry(raw);
  if (!site) {
    showMessage("Please enter a valid domain (e.g. example.com).", true);
    return;
  }
  const sites = await getSites();
  if (sites.includes(site)) {
    showMessage(`"${site}" is already blocked.`, true);
    return;
  }
  sites.push(site);
  sites.sort();
  await saveSites(sites);
  render(sites);
  showMessage(`Blocked "${site}".`, false);
  input.value = "";
}

async function removeSite(site) {
  let sites = await getSites();
  sites = sites.filter((s) => s !== site);
  await saveSites(sites);
  render(sites);
  showMessage(`Unblocked "${site}".`, false);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addSite(input.value);
});

// Initial load.
getSites().then(render);
