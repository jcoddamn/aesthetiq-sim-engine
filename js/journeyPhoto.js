import { preparePreviewSource } from "./previewInput.js";
import { estimateHeadPose } from "./headPose.js";

const MODEL_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";
let scriptPromise = null;
let detector = null;
let pendingDetection = null;
let detectorEpoch = 0;

function loadFaceMesh() {
  if (window.FaceMesh) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const finish = (error) => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) {
        script.remove();
        scriptPromise = null;
        reject(error);
      } else resolve();
    };
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "The face tool took too long to load. Check your connection and try again.",
          ),
        ),
      25000,
    );
    script.src = `${MODEL_ROOT}face_mesh.js`;
    script.crossOrigin = "anonymous";
    script.onload = () =>
      finish(
        window.FaceMesh
          ? null
          : new Error(
              "The face tool could not start. Reload the page and try again.",
            ),
      );
    script.onerror = () =>
      finish(
        new Error(
          "The face tool could not load. Check your connection and try again.",
        ),
      );
    document.head.append(script);
  });
  return scriptPromise;
}

export async function loadJourneyPhoto(file) {
  if (!file) throw new Error("Choose a photo first.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a photo under 20 MB. A smaller JPEG works well.");
  if (
    !/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) &&
    !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "")
  ) {
    throw new Error("Choose a JPEG, PNG or WebP photo.");
  }
  const url = URL.createObjectURL(file);
  const photo = new Image();
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error("This photo took too long to open. Try a smaller JPEG."),
          ),
        15000,
      );
      photo.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      photo.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            "This browser could not open that photo. Try a JPEG or PNG version.",
          ),
        );
      };
      photo.src = url;
    });
    if (Math.min(photo.naturalWidth, photo.naturalHeight) < 300) {
      throw new Error(
        "This photo is too small. Use a clear photo at least 300 pixels on each side.",
      );
    }
    return preparePreviewSource(photo);
  } finally {
    photo.onload = photo.onerror = null;
    URL.revokeObjectURL(url);
    photo.src = "";
  }
}

export function inspectJourneyLandmarks(
  canvas,
  landmarks,
  procedure = "lip-filler",
) {
  const fail = (reason) => ({ valid: false, reason, warnings: [] });
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468 ||
    !landmarks
      .slice(0, 468)
      .every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
  ) {
    return fail(
      "The face is not clear enough. Try a straight-on photo with even lighting.",
    );
  }
  const edgePoints = [10, 152, 234, 454].map((id) => landmarks[id]);
  if (
    edgePoints.some(
      (p) => p.x < 0.015 || p.x > 0.985 || p.y < 0.015 || p.y > 0.985,
    )
  ) {
    return fail(
      "Keep your whole face in the frame, including the forehead and chin.",
    );
  }
  const faceWidth =
    Math.abs(landmarks[454].x - landmarks[234].x) * canvas.width;
  if (faceWidth < 150)
    return fail(
      "Your face is too small in this photo. Move a little closer and retake it.",
    );
  const pose = estimateHeadPose(landmarks);
  const roll = Math.atan2(
    (landmarks[263].y - landmarks[33].y) * canvas.height,
    (landmarks[263].x - landmarks[33].x) * canvas.width,
  );
  if (
    !pose.valid ||
    Math.abs(pose.yaw) > 0.28 ||
    Math.abs(pose.pitch) > 0.22 ||
    Math.abs(roll) > 0.22
  ) {
    return fail(
      "Look straight at the camera with your head level, then take another photo.",
    );
  }
  const warnings = [];
  if (procedure === "lip-filler") {
    const lipWidth = Math.hypot(
      (landmarks[291].x - landmarks[61].x) * canvas.width,
      (landmarks[291].y - landmarks[61].y) * canvas.height,
    );
    const opening = Math.abs(landmarks[14].y - landmarks[13].y) * canvas.height;
    if (lipWidth < 45)
      return fail("Move closer so the outline of both lips is clear.");
    if (opening / lipWidth > 0.18)
      return fail(
        "Relax your mouth and bring your lips lightly together, then retake the photo.",
      );
    if (opening / lipWidth > 0.08)
      warnings.push(
        "A photo with your lips lightly closed will give a clearer shape comparison.",
      );
  }
  return { valid: true, reason: null, warnings };
}

export async function detectJourneyFace(canvas, procedure) {
  const ticket = detectorEpoch;
  if (pendingDetection)
    throw new Error("Wait for the current photo to finish checking.");
  await loadFaceMesh();
  if (ticket !== detectorEpoch) throw new Error("Photo check cancelled.");
  if (pendingDetection)
    throw new Error("Wait for the current photo to finish checking.");
  if (!detector) {
    detector = new window.FaceMesh({
      locateFile: (file) => `${MODEL_ROOT}${file}`,
    });
    detector.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
  }
  const activeDetector = detector;
  let settle;
  const result = new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(
      () =>
        settle(
          new Error(
            "The face check took too long. Try a smaller photo or reload the page.",
          ),
        ),
      25000,
    );
    settle = (error, results) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      pendingDetection = null;
      error ? reject(error) : resolve(results);
    };
    pendingDetection = settle;
    activeDetector.onResults((results) => settle(null, results));
  });
  Promise.resolve()
    .then(() => activeDetector.send({ image: canvas }))
    .catch(() => {
      settle(
        new Error(
          "The face check could not finish. Reload the page or try another browser.",
        ),
      );
    });
  let results;
  try {
    results = await result;
  } catch (error) {
    await releaseJourneyDetector();
    throw error;
  }
  const faces = results?.multiFaceLandmarks || [];
  if (!faces.length)
    throw new Error(
      "No face was found. Use a clear, straight-on photo without a filter.",
    );
  if (faces.length > 1)
    throw new Error("Use a photo with only one face in the frame.");
  // Keep the mesh with this photo. A later capture must not move an earlier preview.
  const landmarks = faces[0].map((p) => ({
    x: p.x,
    y: p.y,
    z: Number.isFinite(p.z) ? p.z : 0,
  }));
  const quality = inspectJourneyLandmarks(canvas, landmarks, procedure);
  if (!quality.valid) throw new Error(quality.reason);
  return { canvas, landmarks, warnings: quality.warnings };
}

export async function releaseJourneyDetector() {
  detectorEpoch++;
  if (pendingDetection) pendingDetection(new Error("Photo check cancelled."));
  const previous = detector;
  detector = null;
  if (previous) {
    try {
      await previous.close();
    } catch {
      /* Closing a cancelled check can reject. */
    }
  }
}
