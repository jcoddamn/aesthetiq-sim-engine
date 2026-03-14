import { FaceMesh } from "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";

let stream = null;
let animationFrameId = null;
let faceMeshInstance = null;
let isRunning = false;

export async function startFaceTracking(videoElement, onLandmarks) {
  if (!videoElement) {
    throw new Error("startFaceTracking: videoElement is required");
  }

  if (isRunning) {
    return;
  }

  faceMeshInstance = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMeshInstance.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  faceMeshInstance.onResults((results) => {
    if (
      results.multiFaceLandmarks &&
      results.multiFaceLandmarks.length > 0 &&
      typeof onLandmarks === "function"
    ) {
      onLandmarks(results.multiFaceLandmarks[0], results);
    }
  });

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    videoElement.srcObject = stream;
    videoElement.setAttribute("autoplay", "");
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("muted", "");

    await videoElement.play();

    isRunning = true;
    processVideoFrame(videoElement);
  } catch (error) {
    console.error("Camera start failed:", error);
    throw error;
  }
}

async function processVideoFrame(videoElement) {
  if (!isRunning || !faceMeshInstance) return;

  if (videoElement.readyState >= 2) {
    try {
      await faceMeshInstance.send({ image: videoElement });
    } catch (error) {
      console.error("FaceMesh processing failed:", error);
    }
  }

  animationFrameId = requestAnimationFrame(() => processVideoFrame(videoElement));
}

export function stopFaceTracking(videoElement) {
  isRunning = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (videoElement) {
    videoElement.pause();
    videoElement.srcObject = null;
  }

  if (faceMeshInstance) {
    faceMeshInstance.close();
    faceMeshInstance = null;
  }
}
