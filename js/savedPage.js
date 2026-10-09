import { getProcedureById } from "./procedureData.js?v=3";
import { icon } from "./productUI.js?v=1";
const key = "aesthetiqSavedProcedures",
  container = document.getElementById("savedContainer"),
  status = document.getElementById("savedStatus");
function read() {
  const value = JSON.parse(localStorage.getItem(key) || "[]");
  if (!Array.isArray(value)) throw Error("Invalid saved list");
  return [...new Set(value.filter((v) => typeof v === "string"))];
}
function render() {
  container.replaceChildren();
  let ids = [];
  try {
    ids = read();
  } catch {
    status.textContent =
      "Your saved list could not be read in this browser. You can still explore the library.";
  }
  const items = ids.map(getProcedureById).filter(Boolean);
  if (!items.length) {
    const section = document.createElement("section");
    section.className = "aq-empty";
    const h = document.createElement("h2"),
      p = document.createElement("p"),
      a = document.createElement("a");
    h.textContent = "A little space for your possibilities";
    p.textContent =
      "Select Save on a procedure to keep it here. Start with the areas you’re curious about.";
    a.href = "procedures.html";
    a.className = "aq-button primary";
    a.textContent = "Explore procedures";
    section.append(icon("saved"), h, p, a);
    container.append(section);
    return;
  }
  for (const p of items) {
    const card = document.createElement("article");
    card.className = "aq-card";
    const meta = document.createElement("span"),
      title = document.createElement("h2"),
      copy = document.createElement("p"),
      actions = document.createElement("div"),
      details = document.createElement("a"),
      remove = document.createElement("button");
    meta.className = "aq-card-meta";
    meta.textContent = p.area + " / " + p.type;
    title.textContent = p.name;
    copy.textContent = p.summary;
    actions.className = "aq-actions";
    details.className = "aq-button";
    details.href = "procedure.html?id=" + encodeURIComponent(p.id);
    details.textContent = "View procedure";
    remove.className = "aq-text-button";
    remove.textContent = "Remove";
    remove.setAttribute(
      "aria-label",
      "Remove " + p.name + " from saved procedures",
    );
    remove.onclick = () => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(read().filter((id) => id !== p.id)),
        );
        status.textContent = p.name + " removed.";
        render();
        const next = container.querySelector("a");
        next?.focus();
      } catch {
        status.textContent =
          "Unable to update your list. Check that browser storage is available and try again.";
      }
    };
    actions.append(details, remove);
    card.append(icon(p.area), meta, title, copy, actions);
    container.append(card);
  }
}
window.addEventListener("storage", (event) => {
  if (event.key === key || event.key === null) {
    status.textContent = "Saved list updated.";
    render();
  }
});
render();
