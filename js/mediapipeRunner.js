let mediaStream = null;
let rafId = null;
let faceMesh = null;
let imageFaceMesh = null;
let running = false;

export async function startFaceTracking(videoElement, onLandmarks, onStatus) {
  if (!videoElement) {
    console.error('Camera video element not found');
    return;
  }

  if (typeof window.FaceMesh === 'undefined') {
    console.error('FaceMesh is not loaded. Check your script tag in index.html');
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
    onStatus?.('Camera permission denied');
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

  return new Promise(
    async (resolve, reject) => {
      let resolved = false;

      imageFaceMesh.onResults(
        (results) => {
          if (resolved) {
            return;
          }

          resolved = true;

          if (
            results.multiFaceLandmarks &&
            results.multiFaceLandmarks
              .length > 0
          ) {
            resolve(
              results.multiFaceLandmarks[0]
            );

            return;
          }

          resolve(null);
        }
      );

      try {
        await imageFaceMesh.send({
          image: imageSource
        });
      } catch (error) {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      }
    }
  );
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
