// Smooth added movement without flattening the person's starting lip shape.
export function smoothLowerLipDisplacement(original, warped) {
  const result = warped.map(point => ({ ...point }));
  for (const [center, left, right, retained] of [[17, 84, 314, .4], [14, 87, 317, .5]]) {
    if (![center, left, right].every(id =>
      Number.isFinite(original[id]?.y) && Number.isFinite(warped[id]?.y))) continue;
    const centerMove = warped[center].y - original[center].y;
    const sideMove = ((warped[left].y - original[left].y) +
      (warped[right].y - original[right].y)) / 2;
    result[center].y = original[center].y + centerMove * retained + sideMove * (1 - retained);
  }
  return result;
}
