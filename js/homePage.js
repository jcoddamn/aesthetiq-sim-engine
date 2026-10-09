import { procedures } from "./procedureData.js?v=3";
import { icon } from "./productUI.js?v=1";
const areas = document.getElementById("areas");
for (const area of ["Face", "Body", "Skin", "Hair", "Smile"]) {
  const a = document.createElement("a");
  a.className = "aq-card aq-area";
  a.href = "procedures.html?area=" + area;
  const name = document.createElement("strong"),
    count = document.createElement("small");
  name.textContent = area;
  count.textContent =
    procedures.filter((p) => p.area === area).length + " procedures";
  a.append(icon(area), name, count);
  areas.append(a);
}
const featured = document.getElementById("featured");
featured.replaceChildren();
for (const id of ["lip-filler", "rhinoplasty", "chemical-peel"]) {
  const p = procedures.find((p) => p.id === id);
  if (!p) continue;
  const a = document.createElement("a");
  a.className = "aq-card";
  a.href = "procedure.html?id=" + p.id;
  const meta = document.createElement("span"),
    title = document.createElement("h3"),
    copy = document.createElement("p");
  meta.className = "aq-card-meta";
  meta.textContent = p.area + " / " + p.type;
  title.textContent = p.name;
  copy.textContent = p.summary;
  a.append(icon(p.area), meta, title, copy);
  featured.append(a);
}
