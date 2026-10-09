const paths = {
  home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
  library:
    "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2",
  preview: "M8 5l2-2h4l2 2h5v16H3V5zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  saved: "M6 3h12v18l-6-4-6 4z",
  Face: "M7 3c-6 6-3 17 5 19 8-2 11-13 5-19M8 10h1m6 0h1m-5 0-1 5h3m-3 3h4",
  Body: "M9 3h6m-7 3c2 3 1 5-1 8l-1 7m10-15c-2 3-1 5 1 8l1 7M8 15h8",
  Skin: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  Hair: "M4 21V11a8 8 0 0 1 16 0v10M8 20V10m4 9V6m4 14V10",
  Smile: "M3 9c3 11 15 11 18 0-5 3-13 3-18 0ZM6 12h12",
  arrow: "M4 12h16m-6-6 6 6-6 6",
};
export function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("aq-icon");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] || paths.Skin);
  svg.append(path);
  return svg;
}
const page = location.pathname.split("/").pop() || "index.html";
const main = document.querySelector("main");
if (main) {
  main.id = main.id || "main-content";
  main.tabIndex = -1;
  const skip = document.createElement("a");
  skip.href = "#" + main.id;
  skip.className = "aq-skip";
  skip.textContent = "Skip to content";
  document.body.prepend(skip);
}
for (const nav of document.querySelectorAll("nav.bottom-nav")) {
  nav.setAttribute("aria-label", "Primary navigation");
  nav.replaceChildren();
  const inner = document.createElement("div");
  inner.className = "bottom-nav-inner";
  for (const [href, label, key] of [
    ["index.html", "Home", "home"],
    ["procedures.html", "Library", "library"],
    ["simulation.html", "Preview", "preview"],
    ["saved.html", "Saved", "saved"],
  ]) {
    const a = document.createElement("a");
    a.href = href;
    a.className = "nav-item";
    const active =
      page === href || (page === "home.html" && href === "index.html");
    if (active) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
    const text = document.createElement("span");
    text.textContent = label;
    a.append(icon(key), text);
    inner.append(a);
  }
  nav.append(inner);
}
for (const el of document.querySelectorAll("[data-icon]"))
  el.replaceChildren(icon(el.dataset.icon));
for (const el of document.querySelectorAll(".camera-button"))
  el.replaceChildren(icon("preview"));
const decorate = () => {
  for (const el of document.querySelectorAll(
    ".procedure-icon:not([data-polished])",
  )) {
    const area =
      el.parentElement.querySelector(".procedure-meta span")?.textContent ||
      "Skin";
    el.replaceChildren(icon(area));
    el.dataset.polished = "true";
  }
};
decorate();
const list = document.getElementById("procedureList");
if (list) new MutationObserver(decorate).observe(list, { childList: true });
// Keep keyboard focus inside the treatment sheet and return it to its opener.
const sheet = document.getElementById("optionSheetBackdrop");
if (sheet) {
  let opener = null,
    wasOpen = false;
  const background = [main, document.getElementById("bottomActionBar")].filter(
    Boolean,
  );
  const focusable = () =>
    [
      ...sheet.querySelectorAll(
        'button:not(:disabled),input:not(:disabled),a[href],select:not(:disabled),[tabindex="0"]',
      ),
    ].filter((el) => !el.closest("[hidden]"));
  new MutationObserver(() => {
    const open = sheet.classList.contains("open");
    if (open === wasOpen) return;
    wasOpen = open;
    if (open) {
      opener = document.activeElement;
      background.forEach((el) => {
        el.inert = true;
      });
      focusable()[0]?.focus();
    } else {
      background.forEach((el) => {
        el.inert = false;
      });
      opener?.focus();
    }
  }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  sheet.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !wasOpen) return;
    const controls = focusable(),
      first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}
