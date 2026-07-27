// ==========================================================
// AESTHETIQ
// Lip Skin Displacement
// ==========================================================

export function displaceLipSkin(
  original,
  warped,
  strength = 0.35
) {
  const result = warped.map(p => ({ ...p }));

  // Philtrum
  const upperSkin = [
    6,
    197,
    195,
    5,
    4
  ];

  // Lower chin transition
  const lowerSkin = [
    18,
    175,
    152,
    200
  ];

  // Nasolabial support
  const sideSkin = [
    205,
    50,
    280,
    425
  ];

  function blend(indices) {
    indices.forEach(index => {
      if (!original[index] || !warped[index]) return;

      result[index].x =
        original[index].x +
        (warped[index].x - original[index].x) *
        strength;

      result[index].y =
        original[index].y +
        (warped[index].y - original[index].y) *
        strength;
    });
  }

  blend(upperSkin);
  blend(lowerSkin);
  blend(sideSkin);

  return result;
}
