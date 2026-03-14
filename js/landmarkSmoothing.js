export function createLandmarkSmoother(alpha = 0.7) {
  let previous = null;

  return function smooth(landmarks) {
    if (!landmarks || !landmarks.length) return landmarks;

    if (!previous) {
      previous = landmarks.map((pt) => ({ ...pt }));
      return previous.map((pt) => ({ ...pt }));
    }

    const smoothed = landmarks.map((pt, index) => {
      const prev = previous[index] || pt;

      return {
        x: prev.x * alpha + pt.x * (1 - alpha),
        y: prev.y * alpha + pt.y * (1 - alpha),
        z: (prev.z || 0) * alpha + (pt.z || 0) * (1 - alpha)
      };
    });

    previous = smoothed.map((pt) => ({ ...pt }));
    return smoothed;
  };
}
