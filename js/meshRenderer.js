// ==========================================================
// AESTHETIQ
// Mesh Renderer V2
// File: js/meshRenderer.js
// ==========================================================

export class MeshRenderer {
  constructor() {
    this.triangles = [];
  }

  toCanvasPoint(
    point,
    width,
    height
  ) {
    if (!point) {
      return null;
    }

    if (
      Math.abs(point.x) <= 1.5 &&
      Math.abs(point.y) <= 1.5
    ) {
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

  triangleToCanvas(
    indices,
    landmarks,
    width,
    height
  ) {
    if (
      !Array.isArray(indices) ||
      !Array.isArray(landmarks)
    ) {
      return [];
    }

    return indices.map((index) =>
      this.toCanvasPoint(
        landmarks[index],
        width,
        height
      )
    );
  }

  getAffineTransform(
    source,
    target
  ) {
    const [s0, s1, s2] = source;
    const [t0, t1, t2] = target;

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

    const b =
      (
        t0.y * (s1.y - s2.y) +
        t1.y * (s2.y - s0.y) +
        t2.y * (s0.y - s1.y)
      ) / denominator;

    const c =
      (
        t0.x * (s2.x - s1.x) +
        t1.x * (s0.x - s2.x) +
        t2.x * (s1.x - s0.x)
      ) / denominator;

    const d =
      (
        t0.y * (s2.x - s1.x) +
        t1.y * (s0.x - s2.x) +
        t2.y * (s1.x - s0.x)
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

  setTriangles(triangles) {
    this.triangles =
      Array.isArray(triangles)
        ? triangles
        : [];
  }

  render(
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

    const output =
      document.createElement("canvas");

    output.width =
      sourceCanvas.width;

    output.height =
      sourceCanvas.height;

    const ctx =
      output.getContext("2d");

    if (!ctx) {
      return sourceCanvas;
    }

    ctx.drawImage(
      sourceCanvas,
      0,
      0
    );

    for (const triangle of this.triangles) {
      this.drawTriangle(
        ctx,
        sourceCanvas,
        triangle,
        originalLandmarks,
        warpedLandmarks
      );
    }

    ctx.setTransform(
      1,
      0,
      0,
      1,
      0,
      0
    );

    return output;
  }

  drawTriangle(
    ctx,
    sourceCanvas,
    triangle,
    original,
    warped
  ) {
    if (
      !Array.isArray(triangle) ||
      triangle.length < 3
    ) {
      return;
    }

    const sourceTriangle =
      this.triangleToCanvas(
        triangle,
        original,
        sourceCanvas.width,
        sourceCanvas.height
      );

    const targetTriangle =
      this.triangleToCanvas(
        triangle,
        warped,
        sourceCanvas.width,
        sourceCanvas.height
      );

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

    const transform =
      this.getAffineTransform(
        sourceTriangle,
        targetTriangle
      );

    if (!transform) {
      return;
    }

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
      targetTriangle[0].x,
      targetTriangle[0].y
    );

    ctx.lineTo(
      targetTriangle[1].x,
      targetTriangle[1].y
    );

    ctx.lineTo(
      targetTriangle[2].x,
      targetTriangle[2].y
    );

    ctx.closePath();
    ctx.clip();

    ctx.setTransform(
      transform.a,
      transform.b,
      transform.c,
      transform.d,
      transform.e,
      transform.f
    );

    ctx.drawImage(
      sourceCanvas,
      0,
      0
    );

    ctx.restore();
  }
}
