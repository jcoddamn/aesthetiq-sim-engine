// ==========================================================
// AESTHETIQ
// Lip Soft Tissue Simulation
// ==========================================================

export function applyLipSoftTissue(
  original,
  warped,
  strength = 0.4
) {

  const result = warped.map(p => ({ ...p }));

  const lipPoints = [
    61,146,91,181,84,17,314,405,321,375,291,
    185,40,39,37,0,267,269,270,409,
    78,95,88,178,87,14,317,402,318,324,308,
    191,80,81,82,13,312,311,310,415
  ];

  const surrounding = [
    164,167,165,92,186,
    57,43,106,182,83,
    18,313,406,335,273,
    287,410,322,391,393,
    205,50,187,207,206,
    203,129,202,214,
    425,280,411,427,426,
    423,358,422,434,
    200,199,175,152,
    428,421,418,208,201,194
  ];

  surrounding.forEach(index => {

    const point = original[index];

    if (!point) return;

    let totalX = 0;
    let totalY = 0;
    let weight = 0;

    lipPoints.forEach(lp => {

      const o = original[lp];
      const w = warped[lp];

      if (!o || !w) return;

      const dx = w.x - o.x;
      const dy = w.y - o.y;

      const dist =
        Math.hypot(
          point.x - o.x,
          point.y - o.y
        );

      const influence =
        Math.max(
          0,
          1 - dist / 0.18
        );

      totalX += dx * influence;
      totalY += dy * influence;

      weight += influence;

    });

    if (weight === 0) return;

    result[index] = {

      ...point,

      x:
        point.x +
        (totalX / weight) *
        strength,

      y:
        point.y +
        (totalY / weight) *
        strength

    };

  });

  return result;

}
