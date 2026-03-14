import { FaceMesh } from "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
import { Camera } from "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

export function startFaceTracking(videoElement, onLandmarks) {

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

    if (!results.multiFaceLandmarks) return;

    const landmarks = results.multiFaceLandmarks[0];

    if (onLandmarks) {
      onLandmarks(landmarks);
    }

  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });

  camera.start();
}
