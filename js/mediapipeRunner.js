let mediaStream = null;
let rafId = null;
let faceMesh = null;
let imageFaceMesh = null;
let running = false;
let imageAnalysisPending = false;

export async function startFaceTracking(videoElement, onLandmarks, onStatus) {
  if (!videoElement) {
    console.error('Camera video element not found');
    return;
  }

  if (typeof window.FaceMesh === 'undefined') {
    onStatus?.('Face tracking could not load. Check your connection and reload the page.');
    return;
  }

  if (running) return;

  onStatus?.('Requesting camera…');

  faceMesh = new window.FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

 faceMesh.onResults((results) => {

  if (
    results.multiFaceLandmarks &&
    results.multiFaceLandmarks.length > 0
  ) {

    const landmarks =
      results.multiFaceLandmarks[0];

    console.log("Landmarks:", landmarks.length);

    onLandmarks?.(landmarks, results);

  } else {

    onStatus?.("Searching for face…");

  }

}); 

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    videoElement.srcObject = mediaStream;
    await videoElement.play();

    running = true;
    onStatus?.('Camera ready');

    const loop = async () => {
      if (!running) return;

      if (videoElement.readyState >= 2) {
        try {
          await faceMesh.send({ image: videoElement });
        } catch (error) {
          console.error('FaceMesh processing failed:', error);
          onStatus?.('Tracking error');
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  } catch (error) {
    console.error('Camera start failed:', error);
    onStatus?.(error?.name === 'NotFoundError' ? 'No camera found. Use Upload Photo to create a preview.' : error?.name === 'NotAllowedError' ? 'Camera access is blocked. Allow camera access or use Upload Photo.' : 'Camera could not start. Use Upload Photo or try again.');
  }
}

export async function detectFaceLandmarksFromImage(
  imageSource
) {
  if (!imageSource) {
    throw new Error(
      "An image source is required."
    );
  }

  if (
    typeof window.FaceMesh ===
    "undefined"
  ) {
    throw new Error(
      "FaceMesh is not loaded."
    );
  }

  if (!imageFaceMesh) {
    imageFaceMesh =
      new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

    imageFaceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      staticImageMode: true,
      minDetectionConfidence: 0.6
    });
  }

  if (imageAnalysisPending) throw new Error("A photo is already being analyzed. Please wait.");
  imageAnalysisPending = true;
  const detector = imageFaceMesh;
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, landmarks) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      imageAnalysisPending = false;
      if (error) {
        if (imageFaceMesh === detector) imageFaceMesh = null;
        Promise.resolve().then(() => detector.close()).catch(() => {});
        reject(error);
      } else resolve(landmarks);
    };
    const timer = setTimeout(() => finish(new Error("Face analysis timed out. Check your connection and try a clear front-facing photo.")), 20000);
    detector.onResults(results => finish(null, results.multiFaceLandmarks?.[0] || null));
    Promise.resolve().then(() => detector.send({image:imageSource})).catch(error => finish(error));
  });
}

// Research utilities call this after a temporary image pair so the detector
// does not retain its last result callback or image-processing resources.
export async function releaseImageFaceLandmarker() {
  const detector = imageFaceMesh;
  imageFaceMesh = null;
  if (detector) await detector.close();
}

export function stopFaceTracking(videoElement) {
  running = false;

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (videoElement) {
    videoElement.pause();
    videoElement.srcObject = null;
  }

  if (faceMesh) {
    faceMesh.close();
    faceMesh = null;
  }
}
