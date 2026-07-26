// ==========================================================
// AESTHETIQ
// Mesh Renderer V2
// ==========================================================

export class MeshRenderer {

  constructor() {
    this.triangles = [];
  }

  setTriangles(triangles) {
    this.triangles = triangles;
  }

  render(
    sourceCanvas,
    originalLandmarks,
    warpedLandmarks
  ) {

    const output =
      document.createElement("canvas");

    output.width = sourceCanvas.width;
    output.height = sourceCanvas.height;

    const ctx =
      output.getContext("2d");

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

    return output;

  }

  drawTriangle(
    ctx,
    sourceCanvas,
    triangle,
    original,
    warped
  ) {

    // We'll build this next.

  }

}
