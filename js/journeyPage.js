import {
  loadJourneyPhoto,
  detectJourneyFace,
  releaseJourneyDetector,
} from "./journeyPhoto.js";
import { preparePreviewSource } from "./previewInput.js";
import {
  runProcedureSimulationFromLandmarks,
  setMaskDebugEnabled,
} from "./simulationPipeline.js?v=48";
import { renderGlabellaPreview } from "./glabellaSimulation2D.js?v=2";
import { compareExpressionCaptures } from "./expressionCapture.js";
import {
  getProcedureJourney,
  getRecoveryStage,
  getRecoveryStageAtDay,
} from "./recoveryTimeline.js?v=3";
import { renderRecoveryIllustration } from "./recoveryIllustration2D.js?v=2";
import { createComparisonCanvas } from "./comparisonExport.js?v=2";

const LEVELS = ["natural", "balanced", "enhanced"];
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export function getJourneySelection(search = "") {
  const params = new URLSearchParams(search);
  const procedure = params.get("procedure") || "lip-filler";
  const isLip = procedure === "lip-filler";
  const style = params.get("style") || "classic";
  const product = isLip
    ? params.get("product") || "provider"
    : params.get("neuromodulator") || params.get("product") || "botox";
  const option = params.get("option") || (isLip ? "hyaluronic-acid" : "botox");
  const context = { productId: product, optionId: option };
  const journey =
    isLip && style !== "classic"
      ? null
      : getProcedureJourney(procedure, context);
  const intensity = LEVELS.includes(params.get("intensity"))
    ? params.get("intensity")
    : "balanced";
  const stage = journey
    ? params.has("day")
      ? getRecoveryStageAtDay(procedure, params.get("day"), context)
      : getRecoveryStage(procedure, params.get("stage") || "immediate", context)
    : null;
  return {
    procedure,
    isLip,
    style,
    product,
    option,
    context,
    journey,
    intensity,
    stage,
    showRecovery: params.get("recovery") !== "0",
    showBruising: params.get("bruising") === "1",
  };
}

export function getJourneyCrop(capture, procedure, mode = "face") {
  const { canvas, landmarks } = capture;
  if (mode !== "detail")
    return { x: 0, y: 0, width: canvas.width, height: canvas.height };
  let centerX, centerY, width;
  if (procedure === "lip-filler") {
    centerX = ((landmarks[61].x + landmarks[291].x) * canvas.width) / 2;
    centerY = ((landmarks[0].y + landmarks[17].y) * canvas.height) / 2;
    width = Math.abs(landmarks[291].x - landmarks[61].x) * canvas.width * 2.2;
  } else {
    centerX = ((landmarks[33].x + landmarks[263].x) * canvas.width) / 2;
    centerY = ((landmarks[9].y + landmarks[168].y) * canvas.height) / 2;
    width = Math.abs(landmarks[263].x - landmarks[33].x) * canvas.width * 1.3;
  }
  width = Math.max(80, Math.min(canvas.width, canvas.height * 1.3, width));
  const height = width / 1.3;
  return {
    x: Math.max(0, Math.min(canvas.width - width, centerX - width / 2)),
    y: Math.max(0, Math.min(canvas.height - height, centerY - height / 2)),
    width,
    height,
  };
}

export function comparisonDescription(
  selection,
  { stage, intensity, expression, showRecovery, showBruising, crop },
) {
  const treatment = selection.isLip
    ? "Classic HA lip filler"
    : "BOTOX Cosmetic · frown lines";
  const expressionLabel = selection.isLip
    ? "Relaxed lips"
    : expression === "neutral"
      ? "At rest"
      : "Frowning";
  const time =
    stage.id === "before"
      ? "Before treatment"
      : `Day ${stage.day} · ${stage.label}`;
  const recovery =
    stage.id === "before"
      ? ""
      : showRecovery
        ? ` · Recovery example${showBruising ? " + possible bruising" : ""}`
        : " · Recovery example hidden";
  return `${treatment} · ${titleCase(intensity)} · ${expressionLabel} · ${time}${recovery}${crop === "detail" ? " · Close-up" : ""} · Visual example; results vary.`;
}

export function initJourneyPage(root = document) {
  const app = root.getElementById("journeyApp");
  if (!app) return;
  const $ = (id) => root.getElementById(id);
  const all = (selector) => [...app.querySelectorAll(selector)];
  const selection = getJourneySelection(window.location.search);
  const { journey, procedure, isLip, context } = selection;
  const state = {
    captures: { neutral: null, frown: null },
    results: {},
    intensity: selection.intensity,
    expression: isLip ? "neutral" : "frown",
    stage: selection.stage,
    crop: "face",
    showRecovery: selection.showRecovery,
    showBruising: selection.showBruising,
    busy: null,
    epoch: 0,
    uploadSlot: "neutral",
    cameraSlot: "neutral",
    cameraEpoch: 0,
    stream: null,
    frameRequest: null,
    pairWarnings: [],
    current: null,
    viewVersion: 0,
    saving: false,
  };

  function status(id, message, kind = "") {
    const element = $(id);
    element.textContent = message;
    element.classList.toggle("is-error", kind === "error");
    element.classList.toggle("is-success", kind === "success");
  }

  function list(parent, items) {
    const fragment = root.createDocumentFragment();
    for (const text of items) {
      const item = root.createElement("li");
      item.textContent = text;
      fragment.append(item);
    }
    parent.replaceChildren(fragment);
  }

  function updateCaptureControls() {
    const ready = state.captures.neutral && (isLip || state.captures.frown);
    $("generateJourney").disabled =
      !journey || !!state.busy || !ready || !$("journeyConsent").checked;
    $("generateJourney").textContent =
      state.busy === "generate"
        ? "Building your preview…"
        : "Create my preview →";
    $("clearJourney").hidden =
      !state.busy && !state.captures.neutral && !state.captures.frown;
    all("[data-upload], [data-camera]").forEach((button) => {
      const slot = button.dataset.upload || button.dataset.camera;
      button.disabled =
        !journey ||
        !!state.busy ||
        (slot === "frown" && !state.captures.neutral);
    });
    $("journeyConsent").disabled = !!state.busy;
    app.setAttribute("aria-busy", String(!!state.busy));
  }

  function freeCanvas(canvas) {
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }

  function discardResults() {
    state.viewVersion++;
    if (state.frameRequest !== null) cancelAnimationFrame(state.frameRequest);
    state.frameRequest = null;
    for (const bundle of Object.values(state.results)) {
      for (const level of LEVELS) {
        const canvas = bundle[level]?.canvas;
        if (
          !Object.values(state.captures).some(
            (capture) => capture?.canvas === canvas,
          )
        )
          freeCanvas(canvas);
      }
    }
    state.results = {};
    freeCanvas(state.current?.canvas);
    state.current = null;
    freeCanvas($("journeyOriginal"));
    freeCanvas($("journeyPreview"));
    $("journeyResults").hidden = true;
    $("journeyEmpty").hidden = false;
    status("renderStatus", "");
  }

  function removeCapture(slot) {
    freeCanvas(state.captures[slot]?.canvas);
    state.captures[slot] = null;
    const thumbnail = $(`${slot}Thumbnail`);
    freeCanvas(thumbnail);
    thumbnail.hidden = true;
    app.querySelector(`[data-slot="${slot}"]`).classList.remove("has-photo");
    $(`${slot}Badge`).textContent = "Photo needed";
  }

  function drawCrop(target, source, crop) {
    const scale = Math.min(1, 1200 / Math.max(crop.width, crop.height));
    target.width = Math.max(1, Math.round(crop.width * scale));
    target.height = Math.max(1, Math.round(crop.height * scale));
    const ctx = target.getContext("2d");
    if (!ctx)
      throw new Error("The preview could not draw. Try reloading the page.");
    ctx.drawImage(
      source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      target.width,
      target.height,
    );
  }

  async function acceptPhoto(slot, readPhoto) {
    const ticket = ++state.epoch;
    state.busy = "photo";
    discardResults();
    removeCapture(slot);
    // A new relaxed photo starts a new pair.
    if (slot === "neutral") removeCapture("frown");
    state.pairWarnings = [];
    updateCaptureControls();
    status("captureStatus", "Opening your photo…");
    let canvas;
    try {
      canvas = await readPhoto();
      if (ticket !== state.epoch) {
        freeCanvas(canvas);
        return;
      }
      status(
        "captureStatus",
        "Checking face position… The first photo may take a moment.",
      );
      const capture = await detectJourneyFace(canvas, procedure);
      if (ticket !== state.epoch) {
        freeCanvas(canvas);
        return;
      }
      const thumbnail = $(`${slot}Thumbnail`);
      drawCrop(thumbnail, canvas, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
      state.captures[slot] = capture;
      thumbnail.hidden = false;
      app.querySelector(`[data-slot="${slot}"]`).classList.add("has-photo");
      $(`${slot}Badge`).textContent = "Photo ready";
      const next =
        !isLip && slot === "neutral"
          ? "Relaxed photo ready. Keep the same light and head position, then add a separate frown photo."
          : "Photo ready. Check the consent box, then create your preview.";
      status("captureStatus", [next, ...capture.warnings].join(" "), "success");
    } catch (error) {
      if (ticket !== state.epoch) {
        freeCanvas(canvas);
        return;
      }
      freeCanvas(canvas);
      status(
        "captureStatus",
        error.message || "This photo could not open. Please try another.",
        "error",
      );
    } finally {
      if (ticket === state.epoch) {
        state.busy = null;
        updateCaptureControls();
      }
    }
  }

  function stopCamera() {
    state.cameraEpoch++;
    state.stream?.getTracks().forEach((track) => track.stop());
    state.stream = null;
    const video = $("journeyCamera");
    video.pause();
    video.srcObject = null;
    $("takeJourneyPhoto").disabled = true;
    if ($("journeyCameraDialog").open) $("journeyCameraDialog").close();
    if (state.busy === "camera") {
      state.busy = null;
      updateCaptureControls();
    }
  }

  async function openCamera(slot) {
    if (!navigator.mediaDevices?.getUserMedia) {
      status(
        "captureStatus",
        "The camera is not available here. Choose a photo from your device.",
        "error",
      );
      return;
    }
    state.cameraSlot = slot;
    state.busy = "camera";
    updateCaptureControls();
    const ticket = ++state.cameraEpoch;
    $("cameraDialogHeading").textContent =
      slot === "frown" ? "Take a frown photo" : "Take a relaxed-face photo";
    $("cameraDialogStatus").textContent =
      slot === "frown"
        ? "Keep your head still. Bring your eyebrows together and down without squinting hard."
        : "Look straight ahead with your head level. Keep your lips relaxed and lightly closed.";
    $("journeyCameraDialog").showModal();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1200 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      if (ticket !== state.cameraEpoch) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      state.stream = stream;
      const video = $("journeyCamera");
      video.srcObject = stream;
      await video.play();
      if (ticket !== state.cameraEpoch) return;
      $("takeJourneyPhoto").disabled = false;
    } catch (error) {
      if (ticket !== state.cameraEpoch) return;
      stopCamera();
      status(
        "captureStatus",
        error.name === "NotAllowedError"
          ? "Camera access was not allowed. You can choose a photo instead, or allow camera access in your browser settings."
          : "The camera could not open. Close other camera apps, or choose a photo from your device.",
        "error",
      );
    }
  }

  async function generate() {
    if ($("generateJourney").disabled) return;
    const ticket = ++state.epoch;
    state.busy = "generate";
    discardResults();
    updateCaptureControls();
    status(
      "captureStatus",
      isLip
        ? "Building the lip shape and recovery views…"
        : "Checking your expressions and building the frown-line views…",
    );
    await releaseJourneyDetector();
    await nextFrame();
    if (ticket !== state.epoch) return;
    try {
      if (!isLip) {
        const pair = compareExpressionCaptures(
          state.captures.neutral,
          state.captures.frown,
        );
        if (!pair.valid) throw new Error(pair.reason);
        state.pairWarnings = pair.warnings;
      }
      for (const expression of isLip ? ["neutral"] : ["neutral", "frown"]) {
        const capture = state.captures[expression];
        const bundle = {};
        if (isLip) {
          const result = runProcedureSimulationFromLandmarks({
            procedure,
            imageSource: capture.canvas,
            landmarks: capture.landmarks,
            procedureOption: selection.option,
            lipStyle: "classic",
            fillerProduct: selection.product,
            fillerGoal: "balanced",
          });
          for (const level of LEVELS) {
            bundle[level] = {
              canvas: result[`${level}Canvas`],
              quality: result.quality[level],
              landmarks: result.landmarksByLevel[level],
            };
          }
          freeCanvas(result.maskCanvas);
          freeCanvas(result.debugCanvas);
        } else {
          for (const level of LEVELS) {
            bundle[level] = {
              ...renderGlabellaPreview(capture.canvas, capture.landmarks, {
                level,
                expression,
              }),
              landmarks: capture.landmarks,
            };
            await nextFrame();
            if (ticket !== state.epoch) {
              for (const item of Object.values(bundle)) freeCanvas(item.canvas);
              return;
            }
          }
        }
        state.results[expression] = bundle;
        const selected = bundle[state.intensity];
        if (!selected?.canvas || selected.quality?.valid === false) {
          throw new Error(
            selected?.quality?.reason ||
              "The face alignment did not produce a clear preview. Try a new photo.",
          );
        }
      }
      if (ticket !== state.epoch) return;
      $("journeyResults").hidden = false;
      $("journeyEmpty").hidden = true;
      render();
      status(
        "captureStatus",
        "Your preview is ready. Move through the days or jump to the settled view.",
        "success",
      );
      if (window.matchMedia("(max-width: 700px)").matches) {
        $("previewHeading").scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }
    } catch (error) {
      if (ticket !== state.epoch) return;
      discardResults();
      status(
        "captureStatus",
        error.message || "The preview could not finish. Try a new photo.",
        "error",
      );
    } finally {
      if (ticket === state.epoch) {
        state.busy = null;
        updateCaptureControls();
      }
    }
  }

  function updateTimeline() {
    const stage = state.stage;
    $("timelineHeading").textContent = stage.label;
    $("journeyPhase").textContent =
      stage.id === "before"
        ? "Your starting photo"
        : stage.phase === "wearing-off"
          ? "Return of movement · example"
          : isLip
            ? "Recovery and settling · example"
            : "Onset and effect · example";
    $("journeyDay").textContent =
      stage.id === "before" ? "Before" : `Day ${stage.day}`;
    $("journeyDaySlider").value = stage.day;
    $("journeyDaySlider").setAttribute(
      "aria-valuetext",
      stage.id === "before"
        ? "Before treatment"
        : `Day ${stage.day}, ${stage.label}`,
    );
    $("journeyStageNote").textContent = stage.note;
    $("journeyCare").textContent = stage.care;
    $("journeyContact").textContent = stage.contactWarning || "";
    $("journeyContact").hidden = !stage.contactWarning;
    $("showJourneyRecovery").checked = state.showRecovery;
    $("showJourneyBruising").checked = state.showBruising;
    $("showJourneyRecovery").disabled = stage.id === "before";
    $("showJourneyBruising").disabled =
      stage.id === "before" || !state.showRecovery;
    all("[data-stage]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.stage === stage.id),
      ),
    );
    all("[data-intensity]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.intensity === state.intensity),
      );
      button.disabled =
        state.results[state.expression]?.[button.dataset.intensity]?.quality
          ?.valid === false;
    });
    all("[data-expression]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.expression === state.expression),
      ),
    );
    all("[data-crop]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.crop === state.crop),
      ),
    );
  }

  function render() {
    const capture = state.captures[state.expression];
    const result = state.results[state.expression]?.[state.intensity];
    if (!capture || !result) return;
    freeCanvas(state.current?.canvas);
    state.current = null;
    if (result.quality?.valid === false)
      throw new Error(
        result.quality.reason ||
          "Choose a different preview strength or retake the photo.",
      );
    const canvas = renderRecoveryIllustration(
      capture.canvas,
      result.canvas,
      state.stage,
      procedure,
      {
        sourceLandmarks: capture.landmarks,
        resultLandmarks: result.landmarks,
        showRecovery: state.showRecovery,
        showBruising: state.showBruising,
      },
    );
    if (canvas === capture.canvas || canvas === result.canvas) {
      throw new Error(
        "The browser could not draw this view. Clear the photos and try a smaller image.",
      );
    }
    const crop = getJourneyCrop(capture, procedure, state.crop);
    drawCrop($("journeyOriginal"), capture.canvas, crop);
    drawCrop($("journeyPreview"), canvas, crop);
    state.current = {
      canvas,
      expression: state.expression,
      intensity: state.intensity,
      stage: state.stage.id,
    };
    updateTimeline();
    const expressionLabel = isLip
      ? "Relaxed lips"
      : state.expression === "neutral"
        ? "At rest"
        : "Frowning";
    $("originalCaption").textContent = `${expressionLabel} · Original photo`;
    $("previewCaption").textContent =
      `${expressionLabel} · ${state.stage.id === "before" ? "Before treatment" : `Day ${state.stage.day}`} · ${titleCase(state.intensity)}`;
    $("journeyOriginal").setAttribute(
      "aria-label",
      `${expressionLabel}, original photo`,
    );
    $("journeyPreview").setAttribute(
      "aria-label",
      `${expressionLabel}, simulated ${state.stage.label.toLowerCase()}`,
    );
    const warnings = [
      ...state.pairWarnings,
      ...(capture.warnings || []),
      ...(result.quality?.warnings || []),
    ];
    if (
      !isLip &&
      state.stage.effectProgress === 0 &&
      state.stage.id !== "before"
    ) {
      warnings.unshift(
        "Same-day frown lines remain. The BOTOX effect develops over the following days.",
      );
    }
    if (!isLip && state.expression === "neutral")
      warnings.unshift(
        "Resting creases may remain. Switch to Frowning to compare the expression lines.",
      );
    status("renderStatus", [...new Set(warnings)].join(" "));
    $("saveJourneyComparison").disabled = state.saving;
  }

  function scheduleRender() {
    state.viewVersion++;
    $("saveJourneyComparison").disabled = true;
    if (state.frameRequest !== null) cancelAnimationFrame(state.frameRequest);
    state.frameRequest = requestAnimationFrame(() => {
      state.frameRequest = null;
      try {
        render();
      } catch (error) {
        freeCanvas(state.current?.canvas);
        state.current = null;
        const preview = $("journeyPreview");
        preview
          .getContext("2d")
          ?.clearRect(0, 0, preview.width, preview.height);
        $("previewCaption").textContent =
          "This view is unavailable. Try another stage or photo.";
        status(
          "renderStatus",
          error.message || "This view could not draw. Try another stage.",
          "error",
        );
        $("saveJourneyComparison").disabled = true;
      }
    });
  }

  async function saveComparison() {
    if (!state.current || $("saveJourneyComparison").disabled) return;
    const ticket = state.epoch,
      version = state.viewVersion;
    const filename = `AesthetIQ-${isLip ? "lip-filler" : "frown-lines"}-${state.expression}-${state.stage.id === "before" ? "before" : `day-${state.stage.day}`}.png`;
    state.saving = true;
    $("saveJourneyComparison").disabled = true;
    let output;
    try {
      // Export the same expression, crop and day that are on screen.
      output = createComparisonCanvas(
        $("journeyOriginal"),
        $("journeyPreview"),
        comparisonDescription(selection, state),
        { minPanelWidth: 600, wrapLabel: true },
      );
      const blob = await new Promise((resolve, reject) =>
        output.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("The image could not be saved. Try again.")),
          "image/png",
        ),
      );
      if (ticket !== state.epoch || version !== state.viewVersion) return;
      const url = URL.createObjectURL(blob);
      const link = root.createElement("a");
      link.href = url;
      link.download = filename;
      root.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status(
        "renderStatus",
        "Comparison saved with the treatment, stage and simulation label.",
        "success",
      );
    } catch (error) {
      if (ticket === state.epoch && version === state.viewVersion) {
        status(
          "renderStatus",
          error.message || "The comparison could not be saved. Try again.",
          "error",
        );
      }
    } finally {
      freeCanvas(output);
      state.saving = false;
      $("saveJourneyComparison").disabled =
        !state.current || state.frameRequest !== null;
    }
  }

  function clear() {
    state.epoch++;
    stopCamera();
    void releaseJourneyDetector();
    discardResults();
    removeCapture("neutral");
    removeCapture("frown");
    state.busy = null;
    state.pairWarnings = [];
    state.stage = selection.stage;
    state.intensity = selection.intensity;
    state.expression = isLip ? "neutral" : "frown";
    state.crop = "face";
    state.showRecovery = true;
    state.showBruising = false;
    $("journeyPhotoInput").value = "";
    $("journeyConsent").checked = false;
    status(
      "captureStatus",
      "Photos cleared. Add a new photo whenever you’re ready.",
    );
    updateCaptureControls();
  }

  if (!journey) {
    status(
      "captureStatus",
      "This guided timeline covers Classic HA lip filler and BOTOX Cosmetic frown lines. Choose either treatment above to begin.",
      "error",
    );
    $("journeyScope").textContent =
      "Choose one of the two treatments above to open its complete timeline.";
    $("journeyProcedureLink").href = "procedures.html";
    $("journeyProcedureLink").textContent = "Browse all procedures →";
    updateCaptureControls();
    return;
  }

  setMaskDebugEnabled(false);
  root.title = `${isLip ? "Lip filler" : "Frown lines"} timeline — AesthetIQ`;
  all("[data-journey]")
    .find((link) => link.dataset.journey === procedure)
    ?.setAttribute("aria-current", "page");
  app.querySelector(".capture-slots").classList.toggle("is-single", isLip);
  app.querySelector('[data-slot="frown"]').hidden = isLip;
  $("expressionControls").hidden = isLip;
  $("captureHeading").textContent = isLip
    ? "Add your photo"
    : "Add both expressions";
  $("captureInstructions").textContent = isLip
    ? "Look straight ahead with relaxed, lightly closed lips. Use even lighting and no filter."
    : "Take a relaxed photo, then a separate frown photo. Keep the same lighting, camera distance and head position.";
  $("emptyInstructions").textContent = isLip
    ? "Add a photo to compare the original with each stage of your preview."
    : "Add both expressions to compare frown lines as the effect develops, then wears off.";
  $("journeyScope").textContent =
    `${journey.scopeLabel}. ${journey.evidenceBasis}`;
  $("journeyEligibility").textContent = journey.safetyInfo.eligibility;
  list($("journeyLimits"), journey.limits);
  for (const [heading, items] of [
    ["Common temporary reactions", journey.safetyInfo.common],
    ["Contact the treating clinician", journey.safetyInfo.contactClinician],
    ["Get help right away", journey.safetyInfo.urgent],
  ]) {
    const h3 = root.createElement("h3"),
      ul = root.createElement("ul");
    h3.textContent = heading;
    list(ul, items);
    $("journeySafety").append(h3, ul);
  }
  for (const source of journey.sources) {
    const item = root.createElement("li"),
      link = root.createElement("a"),
      description = root.createElement("p");
    link.textContent = `${source.publisher}: ${source.title}`;
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    description.textContent = source.summary;
    item.append(link, description);
    $("journeySources").append(item);
  }
  $("journeyProcedureLink").href = `procedure.html?id=${procedure}`;
  const lastDay = journey.stages.at(-1).day;
  $("journeyDaySlider").max = lastDay;
  $("timelineEnd").textContent = isLip
    ? `Day ${lastDay}`
    : `Day ${lastDay} · about 4 months`;
  $("jumpToSettled").textContent = isLip
    ? "See the settled result →"
    : "See the full-effect example →";
  for (const stage of journey.stages) {
    const button = root.createElement("button");
    button.type = "button";
    button.dataset.stage = stage.id;
    button.textContent =
      stage.id === "before"
        ? "Before"
        : stage.day === 0
          ? "Immediately after"
          : `Day ${stage.day}`;
    button.setAttribute(
      "aria-label",
      stage.id === "before"
        ? "Before treatment"
        : `Day ${stage.day}: ${stage.label}`,
    );
    button.setAttribute("aria-pressed", String(stage.id === state.stage.id));
    button.addEventListener("click", () => {
      state.stage = getRecoveryStage(procedure, stage.id, context);
      scheduleRender();
    });
    $("journeyCheckpoints").append(button);
  }

  all("[data-upload]").forEach((button) =>
    button.addEventListener("click", () => {
      state.uploadSlot = button.dataset.upload;
      $("journeyPhotoInput").value = "";
      $("journeyPhotoInput").click();
    }),
  );
  $("journeyPhotoInput").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) void acceptPhoto(state.uploadSlot, () => loadJourneyPhoto(file));
  });
  all("[data-camera]").forEach((button) =>
    button.addEventListener(
      "click",
      () => void openCamera(button.dataset.camera),
    ),
  );
  $("closeJourneyCamera").addEventListener("click", stopCamera);
  $("journeyCameraDialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    stopCamera();
  });
  $("takeJourneyPhoto").addEventListener("click", () => {
    const slot = state.cameraSlot;
    try {
      const canvas = preparePreviewSource($("journeyCamera"));
      stopCamera();
      void acceptPhoto(slot, () => Promise.resolve(canvas));
    } catch {
      $("cameraDialogStatus").textContent =
        "The camera is still opening. Wait a moment and try again.";
    }
  });
  $("journeyConsent").addEventListener("change", updateCaptureControls);
  $("generateJourney").addEventListener("click", () => void generate());
  $("clearJourney").addEventListener("click", clear);
  for (const [attribute, key] of [
    ["intensity", "intensity"],
    ["expression", "expression"],
    ["crop", "crop"],
  ]) {
    all(`[data-${attribute}]`).forEach((button) =>
      button.addEventListener("click", () => {
        state[key] = button.dataset[attribute];
        scheduleRender();
      }),
    );
  }
  $("journeyDaySlider").addEventListener("input", (event) => {
    state.stage = getRecoveryStageAtDay(
      procedure,
      Number(event.target.value),
      context,
    );
    scheduleRender();
  });
  $("showJourneyRecovery").addEventListener("change", (event) => {
    state.showRecovery = event.target.checked;
    scheduleRender();
  });
  $("showJourneyBruising").addEventListener("change", (event) => {
    state.showBruising = event.target.checked;
    scheduleRender();
  });
  $("jumpToSettled").addEventListener("click", () => {
    state.stage = getRecoveryStage(procedure, "final", context);
    scheduleRender();
  });
  $("saveJourneyComparison").addEventListener(
    "click",
    () => void saveComparison(),
  );
  window.addEventListener("pagehide", clear);
  updateCaptureControls();
  return { clear };
}

if (typeof document !== "undefined") initJourneyPage();
