// ==========================================================
// AESTHETIQ
// Lip Shading Engine
// ==========================================================

export function applyLipShading(
  canvas,
  landmarks,
  intensity = "balanced"
) {

  if (!canvas || !landmarks) {
    return canvas;
  }

  const ctx = canvas.getContext("2d");

  const w = canvas.width;
  const h = canvas.height;

  const scale =
    intensity === "natural"
      ? 0.35
      : intensity === "balanced"
      ? 0.60
      : 0.90;

  function pt(index){
    return {
      x: landmarks[index].x * w,
      y: landmarks[index].y * h
    };
  }

  const upper = [
    61,185,40,39,37,
    0,267,269,270,409,291
  ].map(pt);

  const lower = [
    61,146,91,181,84,
    17,314,405,321,375,291
  ].map(pt);

  //----------------------------------------------------
  // Soft Highlight
  //----------------------------------------------------

  ctx.save();

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22 * scale;

  upper.forEach(p=>{

    const g =
      ctx.createRadialGradient(
        p.x,
        p.y,
        1,
        p.x,
        p.y,
        22
      );

    g.addColorStop(
      0,
      "rgba(255,255,255,.75)"
    );

    g.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(
      p.x,
      p.y,
      18,
      0,
      Math.PI*2
    );
    ctx.fill();

  });

  ctx.restore();

  //----------------------------------------------------
  // Lower Lip Shadow
  //----------------------------------------------------

  ctx.save();

  ctx.globalAlpha =
    0.18 * scale;

  ctx.fillStyle =
    "rgba(0,0,0,.28)";

  lower.forEach(p=>{

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y+5,
      16,
      7,
      0,
      0,
      Math.PI*2
    );

    ctx.fill();

  });

  ctx.restore();

  //----------------------------------------------------
  // Gloss
  //----------------------------------------------------

  ctx.save();

  ctx.globalCompositeOperation =
    "screen";

  ctx.globalAlpha =
    0.15 * scale;

  const gloss =
    pt(13);

  const grad =
    ctx.createRadialGradient(
      gloss.x,
      gloss.y,
      2,
      gloss.x,
      gloss.y,
      55
    );

  grad.addColorStop(
    0,
    "rgba(255,255,255,.95)"
  );

  grad.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle = grad;

  ctx.beginPath();

  ctx.ellipse(
    gloss.x,
    gloss.y,
    60,
    16,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  ctx.restore();

  return canvas;

}
