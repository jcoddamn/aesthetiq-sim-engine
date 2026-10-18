// Save the same pair the user is comparing.
export function createComparisonCanvas(
  original,
  result,
  label,
  { minPanelWidth = 0, wrapLabel = false } = {},
) {
  if (
    !original ||
    !result ||
    original.width !== result.width ||
    original.height !== result.height
  ) {
    throw new Error("Comparison requires matching capture dimensions.");
  }
  const canvas = document.createElement("canvas"),
    gap = 16;
  const panelWidth = Math.max(original.width, minPanelWidth);
  const panelHeight = Math.round(
    (original.height * panelWidth) / original.width,
  );
  canvas.width = panelWidth * 2 + gap;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Comparison could not be drawn.");
  const lines = [];
  if (wrapLabel) {
    ctx.font = "18px sans-serif";
    let line = "";
    for (const word of String(label).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > canvas.width - 48) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  const header = wrapLabel ? 92 + lines.length * 25 : 76;
  canvas.height = panelHeight + header;
  ctx.fillStyle = wrapLabel ? "#f8f7f4" : "#13121c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = wrapLabel ? "#33243f" : "#ffffff";
  if (wrapLabel) {
    ctx.font = "600 23px sans-serif";
    ctx.fillText("AesthetIQ · Treatment preview", 24, 34);
    ctx.font = "18px sans-serif";
    lines.forEach((line, index) => ctx.fillText(line, 24, 64 + index * 25));
    ctx.font = "600 18px sans-serif";
    ctx.fillText("Original", 24, header - 15);
    ctx.fillText("Simulation", panelWidth + gap + 24, header - 15);
  } else {
    ctx.font = "18px sans-serif";
    ctx.fillText("Original", 12, 26);
    ctx.fillText("Simulation", panelWidth + gap + 12, 26);
    ctx.font = "13px sans-serif";
    ctx.fillText(label, 12, 52, canvas.width - 24);
  }
  ctx.drawImage(original, 0, header, panelWidth, panelHeight);
  ctx.drawImage(result, panelWidth + gap, header, panelWidth, panelHeight);
  return canvas;
}
