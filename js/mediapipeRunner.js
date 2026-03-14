export function startFaceTracking(videoElement, onLandmarks) {
  if (!videoElement) {
    console.error('startFaceTracking: videoElement not found');
    return;
  }

  if (typeof FaceMesh === 'undefined') {
    console.error('FaceMesh is not loaded. Check your script tags in index.html');
    return;
  }

  if (typeof Camera === 'undefined') {
    console.error('Camera is not loaded. Check your script tags in index.html');
    return;
  }

  const faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
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
      results.multiFaceLandmarks.length > 0 &&
      typeof onLandmarks === 'function'
    ) {
      onLandmarks(results.multiFaceLandmarks[0], results);
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      try {
        await faceMesh.send({ image: videoElement });
      } catch (error) {
        console.error('FaceMesh processing failed:', error);
      }
    },
    width: 640,
    height: 480
  });

  camera.start();
}
