// DOM interaction tests; these do not replace real-browser layout/camera QA.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { procedures, getProcedureById } from "../js/procedureData.js";
const require = createRequire(import.meta.url);
const { JSDOM } = require(
  process.env.AESTHETIQ_UI_TEST_MODULES
    ? process.env.AESTHETIQ_UI_TEST_MODULES + "/jsdom"
    : "jsdom",
);
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
async function open(file, query = "") {
  const dom = new JSDOM(await read(file), {
    url: "https://aesthetiq.example/" + file + query,
    runScripts: "outside-only",
  });
  dom.window.procedures = procedures;
  dom.window.getProcedureById = getProcedureById;
  return dom;
}
async function script(dom, path) {
  const source = (await read(path))
    .replace(/^import .*?;\s*$/gm, "")
    .replace(/export function /g, "function ");
  dom.window.eval(source);
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
test("home lists live catalog counts and navigation has working destinations", async () => {
  const dom = await open("index.html");
  try {
    await script(dom, "js/productUI.js");
    await script(dom, "js/homePage.js");
    const d = dom.window.document;
    assert.equal(d.querySelectorAll("#areas a").length, 5);
    assert.equal(d.querySelectorAll("#featured a").length, 3);
    assert.equal(d.querySelectorAll(".bottom-nav a").length, 4);
    assert.equal(d.querySelector("[aria-current=page]").textContent, "Home");
    for (const area of ["Face", "Body", "Skin", "Hair", "Smile"])
      assert.match(
        d.querySelector('a[href="procedures.html?area=' + area + '"]')
          .textContent,
        new RegExp(
          procedures.filter((p) => p.area === area).length + " procedures",
        ),
      );
    assert.equal(d.querySelectorAll('a[href="#"]').length, 0);
  } finally {
    dom.window.close();
  }
});
test("saved list removes final item, handles stale IDs, and does not use incorrect preview links", async () => {
  const dom = await open("saved.html");
  try {
    dom.window.localStorage.setItem(
      "aesthetiqSavedProcedures",
      JSON.stringify(["lip-filler", "stale-id"]),
    );
    await script(dom, "js/productUI.js");
    await script(dom, "js/savedPage.js");
    const d = dom.window.document;
    assert.equal(d.querySelectorAll("#savedContainer article").length, 1);
    d.querySelector("#savedContainer button").click();
    assert.ok(d.querySelector(".aq-empty"));
    assert.equal(d.querySelectorAll("#savedContainer article").length, 0);
    assert.match(d.getElementById("savedStatus").textContent, /removed/);
    assert.equal(
      d.querySelector("#savedContainer a").getAttribute("href"),
      "procedures.html",
    );
  } finally {
    dom.window.close();
  }
});
test("corrupt saved storage shows a recoverable state without crashing", async () => {
  const dom = await open("saved.html");
  try {
    dom.window.localStorage.setItem("aesthetiqSavedProcedures", "not-json");
    await script(dom, "js/productUI.js");
    await script(dom, "js/savedPage.js");
    assert.match(
      dom.window.document.getElementById("savedStatus").textContent,
      /could not be read/,
    );
    assert.ok(dom.window.document.querySelector(".aq-empty"));
  } finally {
    dom.window.close();
  }
});
test("library search, reset, body filter, sort and icon rendering work together", async () => {
  const dom = await open("procedures.html");
  try {
    const d = dom.window.document,
      source = [
        ...d.querySelectorAll("script[type=module]:not([src])"),
      ][0].textContent.replace(/import .*?;/s, "");
    dom.window.eval(source);
    await script(dom, "js/productUI.js");
    assert.equal(d.querySelectorAll("#procedureList > a").length, 54);
    d.querySelector('[data-status="Experimental 2D"]').click();
    await tick();
    assert.equal(d.querySelectorAll("#procedureList > a").length, 14);
    assert.ok(d.querySelector(".procedure-icon svg"));
    d.getElementById("resetFiltersButton").click();
    const search = d.getElementById("searchInput");
    search.value = "zzzzzz";
    search.dispatchEvent(new dom.window.Event("input"));
    assert.equal(d.getElementById("procedureList").hidden, true);
    assert.ok(d.getElementById("emptyState").classList.contains("visible"));
    d.getElementById("emptyResetButton").click();
    assert.equal(d.querySelectorAll("#procedureList > a").length, 54);
    d.getElementById("sortSelect").value = "status";
    d.getElementById("sortSelect").dispatchEvent(
      new dom.window.Event("change"),
    );
    assert.equal(d.querySelectorAll("#procedureList > a").length, 54);
  } finally {
    dom.window.close();
  }
});
test("treatment sheet contains keyboard focus and restores its opener", async () => {
  const dom = await open("procedure.html");
  try {
    await script(dom, "js/productUI.js");
    const d = dom.window.document,
      opener = d.getElementById("topFavoriteButton"),
      sheet = d.getElementById("optionSheetBackdrop");
    opener.focus();
    sheet.classList.add("open");
    await tick();
    assert.equal(d.activeElement.id, "closeOptionSheet");
    assert.equal(d.querySelector("main").inert, true);
    sheet.classList.remove("open");
    await tick();
    assert.equal(d.activeElement, opener);
    assert.equal(d.querySelector("main").inert, false);
  } finally {
    dom.window.close();
  }
});
