// =======================================================
// AESTHETIQ
// Procedure Landmark Transforms
// =======================================================

function cloneLandmarks(points) {
  return points.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z
  }));
}

function movePoint(point, dx, dy) {
  point.x += dx;
  point.y += dy;
}

export function transformLipFillers(
  landmarks,
  intensity = 0.5
) {
  const points = cloneLandmarks(landmarks);

  // Upper lip
  const upperLip = [
    13,
    312,
    311,
    310,
    415
  ];

  // Lower lip
  const lowerLip = [
    14,
    87,
    178,
    88,
    95
  ];

  upperLip.forEach(index => {
    movePoint(
      points[index],
      0,
      -0.004 * intensity
    );
  });

  lowerLip.forEach(index => {
    movePoint(
      points[index],
      0,
      0.004 * intensity
    );
  });

  return points;
}
