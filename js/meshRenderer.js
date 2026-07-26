// ==========================================================
// AESTHETIQ
// Mesh Renderer V2
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

  return indices.map(index =>
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

  const [s0,s1,s2]=source;
  const [t0,t1,t2]=target;

  const det =
    s0.x*(s1.y-s2.y)+
    s1.x*(s2.y-s0.y)+
    s2.x*(s0.y-s1.y);

  if (Math.abs(det) < 0.00001)
    return null;

  return {

    a:
      (
        t0.x*(s1.y-s2.y)+
        t1.x*(s2.y-s0.y)+
        t2.x*(s0.y-s1.y)
      )/det,

    b:
      (
        t0.y*(s1.y-s2.y)+
        t1.y*(s2.y-s0.y)+
        t2.y*(s0.y-s1.y)
      )/det,

    c:
      (
        t0.x*(s2.x-s1.x)+
        t1.x*(s0.x-s2.x)+
        t2.x*(s1.x-s0.x)
      )/det,

    d:
      (
        t0.y*(s2.x-s1.x)+
        t1.y*(s0.x-s2.x)+
        t2.y*(s1.x-s0.x)
      )/det,

    e:
      0,

    f:
      0

  };

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
