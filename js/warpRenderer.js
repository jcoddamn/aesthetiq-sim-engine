// =========================================================
// AESTHETIQ — FACE WARP RENDERER
// File: js/warpRenderer.js
// =========================================================

// ---------------------------------------------------------
// POINT HELPERS
// ---------------------------------------------------------

function isNormalizedPoint(point) {
  return (
    point &&
    Math.abs(point.x) <= 1.5 &&
    Math.abs(point.y) <= 1.5
  );
}

function toCanvasPoint(
  point,
  width,
  height
) {
  if (!point) {
    return null;
  }

  if (isNormalizedPoint(point)) {
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  return {
    x: point.x,
    y: point.y
  };
}

// ---------------------------------------------------------
// TRIANGLE HELPERS
// ---------------------------------------------------------

function getTessellationEdges() {
  const edges =
    globalThis.FACEMESH_TESSELATION ||
    globalThis.FaceMesh?.FACEMESH_TESSELATION;

  if (!Array.isArray(edges)) {
    console.warn(
      "[AesthetIQ] FACEMESH_TESSELATION was not found."
    );

    return [];
  }

  return edges;
}

function buildTrianglesFromEdges(edges) {
  const adjacency = new Map();

  function addNeighbor(a, b) {
    if (!adjacency.has(a)) {
      adjacency.set(a, new Set());
    }

    adjacency.get(a).add(b);
  }

  edges.forEach((edge) => {
    if (
      !Array.isArray(edge) ||
      edge.length < 2
    ) {
      return;
    }

    const [a, b] = edge;

    addNeighbor(a, b);
    addNeighbor(b, a);
  });

  const triangleKeys = new Set();
  const triangles = [];

  adjacency.forEach((neighbors, a) => {
    const neighborList =
      Array.from(neighbors);

    for (
      let i = 0;
      i < neighborList.length;
      i += 1
    ) {
      const b = neighborList[i];

      for (
        let j = i + 1;
        j < neighborList.length;
        j += 1
      ) {
        const c = neighborList[j];

        if (!adjacency.get(b)?.has(c)) {
          continue;
        }

        const triangle =
          [a, b, c].sort(
            (first, second) =>
              first - second
          );

        const key =
          triangle.join("-");

        if (triangleKeys.has(key)) {
          continue;
        }

        triangleKeys.add(key);
        triangles.push(triangle);
      }
    }
  });

  return triangles;
}

let cachedTriangles = null;

export function getFaceTriangles() {
  if (cachedTriangles) {
    return cachedTriangles;
  }

  cachedTriangles =
    buildTrianglesFromEdges(
      getTessellationEdges()
    );

  return cachedTriangles;
}

// ---------------------------------------------------------
// AFFINE TRANSFORM
// ---------------------------------------------------------

function getAffineTransform(
  sourceTriangle,
  targetTriangle
) {
  const [s0, s1, s2] =
    sourceTriangle;

  const [t0, t1, t2] =
    targetTriangle;

  const denominator =
    s0.x * (s1.y - s2.y) +
    s1.x * (s2.y - s0.y) +
    s2.x * (s0.y - s1.y);

  if (
    !Number.isFinite(denominator) ||
    Math.abs(denominator) < 0.00001
  ) {
    return null;
  }

  const a =
    (
      t0.x * (s1.y - s2.y) +
      t1.x * (s2.y - s0.y) +
      t2.x * (s0.y - s1.y)
    ) / denominator;

  const c =
    (
      t0.x * (s2.x - s1.x) +
      t1.x * (s0.x - s2.x) +
      t2.x * (s1.x - s0.x)
    ) / denominator;

  const e =
    (
      t0.x *
        (
          s1.x * s2.y -
          s2.x * s1.y
        ) +
      t1.x *
        (
          s2.x * s0.y -
          s0.x * s2.y
        ) +
      t2.x *
        (
          s0.x * s1.y -
          s1.x * s0.y
        )
    ) / denominator;

  const b =
    (
      t0.y * (s1.y - s2.y) +
      t1.y * (s2.y - s0.y) +
      t2.y * (s0.y - s1.y)
    ) / denominator;

  const d =
    (
      t0.y * (s2.x - s1.x) +
      t1.y * (s0.x - s2.x) +
      t2.y * (s1.x - s0.x)
    ) / denominator;

  const f =
    (
      t0.y *
        (
          s1.x * s2.y -
          s2.x * s1.y
        ) +
      t1.y *
        (
          s2.x * s0.y -
          s0.x * s2.y
        ) +
      t2.y *
        (
          s0.x * s1.y -
          s1.x * s0.y
        )
    ) / denominator;

  return {
    a,
    b,
    c,
    d,
    e,
    f
  };
}

// ---------------------------------------------------------
// TRIANGLE DRAWING
// ---------------------------------------------------------

function drawWarpedTriangle(
  context,
  sourceCanvas,
  sourceTriangle,
  targetTriangle
) {
  const transform =
    getAffineTransform(
      sourceTriangle,
      targetTriangle
    );

  if (!transform) {
    return;
  }

  context.save();

  context.beginPath();
  context.moveTo(
    targetTriangle[0].x,
    targetTriangle[0].y
  );

  context.lineTo(
    targetTriangle[1].x,
    targetTriangle[1].y
  );

  context.lineTo(
    targetTriangle[2].x,
    targetTriangle[2].y
  );

  context.closePath();
  context.clip();

  context.setTransform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  );

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  context.restore();
}

// ---------------------------------------------------------
// MAIN RENDERER
// ---------------------------------------------------------

export function renderWarp(
  sourceCanvas,
  originalLandmarks,
  warpedLandmarks
) {
  if (
    !sourceCanvas ||
    !Array.isArray(originalLandmarks) ||
    !Array.isArray(warpedLandmarks)
  ) {
    return sourceCanvas;
  }

  if (
    originalLandmarks.length < 468 ||
    warpedLandmarks.length < 468
  ) {
    console.warn(
      "[AesthetIQ] Not enough landmarks for face warp."
    );

    return sourceCanvas;
  }

  const outputCanvas =
    document.createElement("canvas");

  outputCanvas.width =
    sourceCanvas.width;

  outputCanvas.height =
    sourceCanvas.height;

  const context =
    outputCanvas.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  const triangles =
    getFaceTriangles();

  if (triangles.length === 0) {
    return outputCanvas;
  }

  triangles.forEach(
    ([first, second, third]) => {
      const sourceTriangle = [
        toCanvasPoint(
          originalLandmarks[first],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          originalLandmarks[second],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          originalLandmarks[third],
          outputCanvas.width,
          outputCanvas.height
        )
      ];

      const targetTriangle = [
        toCanvasPoint(
          warpedLandmarks[first],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          warpedLandmarks[second],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          warpedLandmarks[third],
          outputCanvas.width,
          outputCanvas.height
        )
      ];

      if (
        sourceTriangle.some(
          (point) => !point
        ) ||
        targetTriangle.some(
          (point) => !point
        )
      ) {
        return;
      }

      drawWarpedTriangle(
        context,
        sourceCanvas,
        sourceTriangle,
        targetTriangle
      );
    }
  );

  context.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  return outputCanvas;
}

export function clearWarpTriangleCache() {
  cachedTriangles = null;
}
