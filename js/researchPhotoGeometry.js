// Research-only photo coordinates. Keep simulator deformation units unchanged.
// FaceMesh x/y are normalized by different image axes. Convert to square-pixel
// coordinates before computing cross-axis ratios, then remove in-plane roll.
export function standardizePhotoLandmarks(landmarks, imageSize) {
  if (!Number.isFinite(imageSize?.width) || !Number.isFinite(imageSize?.height) ||
      imageSize.width <= 0 || imageSize.height <= 0) {
    throw Error("Image width and height are required for photographic measurements.");
  }
  if (!Array.isArray(landmarks) || landmarks.length < 468 ||
      !landmarks.slice(0, 468).every(p => Number.isFinite(p?.x) && Number.isFinite(p?.y))) {
    throw Error("Complete finite facial landmarks are required.");
  }
  if (![33,263,61,291].every(i => landmarks[i].x >= 0 && landmarks[i].x <= 1 &&
      landmarks[i].y >= 0 && landmarks[i].y <= 1)) {
    throw Error("Eye and mouth reference points must be visible inside the image; cropped faces cannot supply a full-face comparison.");
  }
  const aspect = imageSize.width / imageSize.height;
  const left = landmarks[33], right = landmarks[263];
  const dx = (right.x - left.x) * aspect, dy = right.y - left.y;
  if (Math.hypot(dx, dy) < 1e-6) throw Error("Eye reference points are degenerate.");
  const roll = Math.atan2(dy, dx), cos = Math.cos(roll), sin = Math.sin(roll);
  const cx = (left.x + right.x) * aspect / 2, cy = (left.y + right.y) / 2;
  const points = landmarks.map(p => {
    const x = p.x * aspect - cx, y = p.y - cy;
    return {...p, x: x * cos + y * sin, y: -x * sin + y * cos};
  });
  return {points, roll};
}
