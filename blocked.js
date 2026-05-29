// Display which site was blocked, read from the "site" query parameter.
const params = new URLSearchParams(window.location.search);
const site = params.get("site");
if (site) {
  document.getElementById("site").textContent = site;
}
