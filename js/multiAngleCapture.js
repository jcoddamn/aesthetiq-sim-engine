// =========================================================
// AESTHETIQ — MULTI-ANGLE CAPTURE
// File: js/multiAngleCapture.js
// =========================================================

import {
  estimateHeadPose,
  getPoseInstruction
} from "./headPose.js";

const REQUIRED_POSES = [
  "straight",
  "left",
  "right"
];

function cloneLandmarks(
  landmarks
) {
  return landmarks.map(
    (point) => ({
      ...point
    })
  );
}

function copyVideoFrame(
  videoElement
) {
  if (
    !videoElement ||
    !videoElement.videoWidth ||
    !videoElement.videoHeight
  ) {
    return null;
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    videoElement.videoWidth;

  canvas.height =
    videoElement.videoHeight;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    videoElement,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

export function createMultiAngleCapture(
  options = {}
) {
  const {
    stableFrameTarget = 12,
    minimumConfidence = 0.62,
    onUpdate,
    onPoseCaptured,
    onComplete
  } = options;

  let active = false;
  let currentPoseIndex = 0;
  let stableFrameCount = 0;
  let lastDetectedPose =
    "unknown";

  const captures = {
    straight: null,
    left: null,
    right: null
  };

  function getCurrentTargetPose() {
    return (
      REQUIRED_POSES[
        currentPoseIndex
      ] ||
      null
    );
  }

  function getProgress() {
    return {
      active,

      currentPose:
        getCurrentTargetPose(),

      currentPoseIndex,

      totalPoses:
        REQUIRED_POSES.length,

      stableFrameCount,

      stableFrameTarget,

      completedPoses:
        REQUIRED_POSES.filter(
          (pose) =>
            Boolean(
              captures[pose]
            )
        ),

      captures
    };
  }

  function emitUpdate(
    extra = {}
  ) {
    onUpdate?.({
      ...getProgress(),
      ...extra
    });
  }

  function reset() {
    active = false;
    currentPoseIndex = 0;
    stableFrameCount = 0;
    lastDetectedPose =
      "unknown";

    captures.straight = null;
    captures.left = null;
    captures.right = null;

    emitUpdate({
      status:
        "idle",

      instruction:
        "Ready for precision scan"
    });
  }

  function start() {
    active = true;
    currentPoseIndex = 0;
    stableFrameCount = 0;
    lastDetectedPose =
      "unknown";

    captures.straight = null;
    captures.left = null;
    captures.right = null;

    const targetPose =
      getCurrentTargetPose();

    emitUpdate({
      status:
        "scanning",

      instruction:
        getPoseInstruction(
          targetPose
        )
    });
  }

  function stop() {
    active = false;
    stableFrameCount = 0;

    emitUpdate({
      status:
        "stopped",

      instruction:
        "Precision scan stopped"
    });
  }

  function capturePose({
    targetPose,
    poseData,
    landmarks,
    videoElement
  }) {
    const imageCanvas =
      copyVideoFrame(
        videoElement
      );

    if (!imageCanvas) {
      emitUpdate({
        status:
          "capture-error",

        instruction:
          "Camera frame was not ready"
      });

      return;
    }

    captures[targetPose] = {
      pose:
        targetPose,

      imageCanvas,

      landmarks:
        cloneLandmarks(
          landmarks
        ),

      poseData:
        {
          ...poseData
        },

      capturedAt:
        Date.now()
    };

    onPoseCaptured?.({
      pose:
        targetPose,

      capture:
        captures[targetPose],

      progress:
        getProgress()
    });

    currentPoseIndex += 1;
    stableFrameCount = 0;
    lastDetectedPose =
      "unknown";

    const nextPose =
      getCurrentTargetPose();

    if (!nextPose) {
      active = false;

      emitUpdate({
        status:
          "complete",

        instruction:
          "Precision scan complete"
      });

      onComplete?.({
        ...captures
      });

      return;
    }

    emitUpdate({
      status:
        "pose-captured",

      capturedPose:
        targetPose,

      instruction:
        getPoseInstruction(
          nextPose
        )
    });
  }

  function processFrame({
    landmarks,
    videoElement
  }) {
    if (!active) {
      return getProgress();
    }

    if (
      !Array.isArray(
        landmarks
      ) ||
      landmarks.length < 468
    ) {
      stableFrameCount = 0;

      emitUpdate({
        status:
          "no-face",

        instruction:
          "Center your face in the guide"
      });

      return getProgress();
    }

    const poseData =
      estimateHeadPose(
        landmarks
      );

    const targetPose =
      getCurrentTargetPose();

    if (
      !poseData.valid ||
      !targetPose
    ) {
      stableFrameCount = 0;

      emitUpdate({
        status:
          "invalid-pose",

        detectedPose:
          poseData.pose,

        instruction:
          getPoseInstruction(
            targetPose
          )
      });

      return getProgress();
    }

    const poseMatches =
      poseData.pose ===
      targetPose;

    const confidenceGood =
      poseData.confidence >=
      minimumConfidence;

    if (
      poseMatches &&
      confidenceGood
    ) {
      if (
        lastDetectedPose ===
        targetPose
      ) {
        stableFrameCount += 1;
      } else {
        stableFrameCount = 1;
      }

      lastDetectedPose =
        targetPose;

      emitUpdate({
        status:
          "holding",

        detectedPose:
          poseData.pose,

        poseData,

        instruction:
          "Hold still…"
      });

      if (
        stableFrameCount >=
        stableFrameTarget
      ) {
        capturePose({
          targetPose,
          poseData,
          landmarks,
          videoElement
        });
      }

      return getProgress();
    }

    stableFrameCount = 0;
    lastDetectedPose =
      poseData.pose;

    emitUpdate({
      status:
        "positioning",

      detectedPose:
        poseData.pose,

      poseData,

      instruction:
        getPoseInstruction(
          targetPose
        )
    });

    return getProgress();
  }

  function getCapture(
    pose
  ) {
    return (
      captures[pose] ||
      null
    );
  }

  function getCaptures() {
    return {
      ...captures
    };
  }

  return {
    start,
    stop,
    reset,
    processFrame,
    getProgress,
    getCapture,
    getCaptures,

    isActive() {
      return active;
    },

    isComplete() {
      return REQUIRED_POSES.every(
        (pose) =>
          Boolean(
            captures[pose]
          )
      );
    }
  };
}
