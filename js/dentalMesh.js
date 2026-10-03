// =========================================================
// AESTHETIQ — ADAPTIVE DENTAL MESH
// File: js/dentalMesh.js
// =========================================================
//
// MediaPipe FaceMesh does not provide individual tooth
// landmarks. This module builds conservative, estimated
// visible-tooth zones inside the detected mouth opening.
//
// These zones are rendering guides only. They are not dental
// measurements, tooth identification, diagnosis, or a
// prediction of a clinical result.
// =========================================================

const LEFT_INNER_CORNER = 78;
const RIGHT_INNER_CORNER = 308;
const UPPER_INNER_CENTER = 13;
const LOWER_INNER_CENTER = 14;

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function pointToCanvas(
  landmark,
  width,
  height,
  mirrorX = false
) {
  if (!landmark) {
    return null;
  }

  return {
    x:
      (
        mirrorX
          ? 1 - landmark.x
          : landmark.x
      ) * width,
    y: landmark.y * height
  };
}

function weightedBoundaries(
  left,
  right,
  weights
) {
  const total =
    weights.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  let cursor = left;

  return weights.map(
    (weight, index) => {
      const width =
        (right - left) *
        (weight / total);

      const start = cursor;
      const end =
        index ===
        weights.length - 1
          ? right
          : cursor + width;

      cursor = end;

      return {
        start,
        end
      };
    }
  );
}

function curveY(
  x,
  left,
  right,
  centerY,
  edgeDrop
) {
  const half =
    Math.max(
      1,
      (right - left) / 2
    );

  const center =
    (left + right) / 2;

  const normalized =
    clamp(
      Math.abs(x - center) /
        half,
      0,
      1
    );

  return (
    centerY +
    edgeDrop *
      normalized *
      normalized
  );
}

function createToothBand({
  left,
  right,
  topCenterY,
  bottomCenterY,
  edgeTopDrop,
  edgeBottomDrop,
  weights,
  row
}) {
  const boundaries =
    weightedBoundaries(
      left,
      right,
      weights
    );

  return boundaries.map(
    (boundary, index) => {
      const inset =
        Math.max(
          0.35,
          (
            boundary.end -
            boundary.start
          ) * 0.025
        );

      const x1 =
        boundary.start + inset;

      const x2 =
        boundary.end - inset;

      const top1 =
        curveY(
          x1,
          left,
          right,
          topCenterY,
          edgeTopDrop
        );

      const top2 =
        curveY(
          x2,
          left,
          right,
          topCenterY,
          edgeTopDrop
        );

      const bottom1 =
        curveY(
          x1,
          left,
          right,
          bottomCenterY,
          edgeBottomDrop
        );

      const bottom2 =
        curveY(
          x2,
          left,
          right,
          bottomCenterY,
          edgeBottomDrop
        );

      return {
        id:
          `${row}-${index + 1}`,
        row,
        index,
        polygon: [
          {
            x: x1,
            y: top1
          },
          {
            x: x2,
            y: top2
          },
          {
            x: x2,
            y: bottom2
          },
          {
            x: x1,
            y: bottom1
          }
        ],
        center: {
          x: (x1 + x2) / 2,
          y:
            (
              top1 +
              top2 +
              bottom1 +
              bottom2
            ) / 4
        }
      };
    }
  );
}

export function buildDentalMesh(
  landmarks,
  width,
  height,
  mirrorX = false
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468 ||
    !width ||
    !height
  ) {
    return null;
  }

  const left =
    pointToCanvas(
      landmarks[
        LEFT_INNER_CORNER
      ],
      width,
      height,
      mirrorX
    );

  const right =
    pointToCanvas(
      landmarks[
        RIGHT_INNER_CORNER
      ],
      width,
      height,
      mirrorX
    );

  const upperCenter =
    pointToCanvas(
      landmarks[
        UPPER_INNER_CENTER
      ],
      width,
      height,
      mirrorX
    );

  const lowerCenter =
    pointToCanvas(
      landmarks[
        LOWER_INNER_CENTER
      ],
      width,
      height,
      mirrorX
    );

  if (
    !left ||
    !right ||
    !upperCenter ||
    !lowerCenter
  ) {
    return null;
  }

  const mouthLeft =
    Math.min(left.x, right.x);

  const mouthRight =
    Math.max(left.x, right.x);

  const mouthWidth =
    mouthRight - mouthLeft;

  const opening =
    Math.abs(
      lowerCenter.y -
      upperCenter.y
    );

  if (
    mouthWidth < 4 ||
    opening < 2
  ) {
    return {
      valid: false,
      confidence: 0,
      reason:
        "Smile opening is too small for a stable dental mesh.",
      upperTeeth: [],
      lowerTeeth: [],
      allTeeth: []
    };
  }

  const centerY =
    (
      upperCenter.y +
      lowerCenter.y
    ) / 2;

  const upperHeight =
    opening * 0.58;

  const lowerHeight =
    opening * 0.42;

  const horizontalInset =
    mouthWidth * 0.045;

  const dentalLeft =
    mouthLeft + horizontalInset;

  const dentalRight =
    mouthRight - horizontalInset;

  // Ten estimated upper visible-tooth zones:
  // posterior -> canine -> lateral -> central -> central ...
  const upperWeights = [
    0.72,
    0.82,
    0.92,
    1,
    1.12,
    1.12,
    1,
    0.92,
    0.82,
    0.72
  ];

  // Eight conservative lower visible-tooth zones.
  const lowerWeights = [
    0.82,
    0.92,
    1,
    1.05,
    1.05,
    1,
    0.92,
    0.82
  ];

  const upperTeeth =
    createToothBand({
      left: dentalLeft,
      right: dentalRight,
      topCenterY:
        centerY -
        upperHeight * 0.56,
      bottomCenterY:
        centerY +
        upperHeight * 0.32,
      edgeTopDrop:
        opening * 0.16,
      edgeBottomDrop:
        opening * 0.08,
      weights: upperWeights,
      row: "upper"
    });

  const lowerInset =
    mouthWidth * 0.09;

  const lowerTeeth =
    createToothBand({
      left:
        mouthLeft +
        lowerInset,
      right:
        mouthRight -
        lowerInset,
      topCenterY:
        centerY -
        lowerHeight * 0.18,
      bottomCenterY:
        centerY +
        lowerHeight * 0.58,
      edgeTopDrop:
        opening * 0.05,
      edgeBottomDrop:
        opening * 0.12,
      weights: lowerWeights,
      row: "lower"
    });

  const opennessRatio =
    opening /
    Math.max(1, mouthWidth);

  const confidence =
    clamp(
      (opennessRatio - 0.035) /
        0.14,
      0,
      1
    );

  return {
    valid: confidence >= 0.18,
    confidence,
    mouthBounds: {
      left: mouthLeft,
      right: mouthRight,
      top:
        Math.min(
          upperCenter.y,
          lowerCenter.y
        ),
      bottom:
        Math.max(
          upperCenter.y,
          lowerCenter.y
        ),
      width: mouthWidth,
      opening
    },
    upperTeeth,
    lowerTeeth,
    allTeeth: [
      ...upperTeeth,
      ...lowerTeeth
    ]
  };
}

function drawPolygon(
  context,
  polygon
) {
  if (
    !Array.isArray(polygon) ||
    polygon.length < 3
  ) {
    return;
  }

  context.beginPath();
  context.moveTo(
    polygon[0].x,
    polygon[0].y
  );

  for (
    let index = 1;
    index < polygon.length;
    index += 1
  ) {
    context.lineTo(
      polygon[index].x,
      polygon[index].y
    );
  }

  context.closePath();
  context.fill();
}

export function createDentalMeshMask(
  dentalMesh,
  baseMaskCanvas,
  {
    upperOnly = false
  } = {}
) {
  if (
    !dentalMesh?.valid ||
    !baseMaskCanvas
  ) {
    return baseMaskCanvas || null;
  }

  const canvas =
    document.createElement("canvas");

  canvas.width =
    baseMaskCanvas.width;

  canvas.height =
    baseMaskCanvas.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return baseMaskCanvas;
  }

  context.fillStyle = "#fff";

  const zones =
    upperOnly
      ? dentalMesh.upperTeeth
      : dentalMesh.allTeeth;

  zones.forEach(zone => {
    drawPolygon(
      context,
      zone.polygon
    );
  });

  // Never allow estimated dental zones to escape the
  // existing FaceMesh mouth/teeth safety mask.
  context.globalCompositeOperation =
    "destination-in";

  context.drawImage(
    baseMaskCanvas,
    0,
    0
  );

  context.globalCompositeOperation =
    "source-over";

  return canvas;
}


// ---------------------------------------------------------
// TOOTH-BY-TOOTH VISUAL GEOMETRY
// ---------------------------------------------------------

function getDentalIntensity(
  level = "balanced"
) {
  switch (
    String(level).toLowerCase()
  ) {
    case "natural":
      return 0.68;

    case "enhanced":
      return 1.18;

    default:
      return 1;
  }
}

function getDentalGeometryProfile(
  procedure,
  goal = ""
) {
  const normalizedGoal =
    String(goal || "")
      .trim()
      .toLowerCase();

  const profiles = {
    veneers: {
      default: {
        width: 1.018,
        height: 1.025,
        verticalShift: -0.002,
        centralEmphasis: 1
      },
      "length-refinement": {
        width: 1.01,
        height: 1.045,
        verticalShift: -0.004,
        centralEmphasis: 1.08
      },
      "width-refinement": {
        width: 1.035,
        height: 1.018,
        verticalShift: -0.001,
        centralEmphasis: 1
      },
      "symmetry-refinement": {
        width: 1.022,
        height: 1.028,
        verticalShift: -0.002,
        centralEmphasis: 1.1
      }
    },

    "dental-bonding": {
      default: {
        width: 1.01,
        height: 1.014,
        verticalShift: -0.001,
        centralEmphasis: 1
      },
      "edge-refinement": {
        width: 1.006,
        height: 1.025,
        verticalShift: -0.002,
        centralEmphasis: 1.08
      },
      "spacing-refinement": {
        width: 1.025,
        height: 1.01,
        verticalShift: 0,
        centralEmphasis: 1.08
      },
      "symmetry-refinement": {
        width: 1.015,
        height: 1.018,
        verticalShift: -0.001,
        centralEmphasis: 1.1
      }
    },

    "smile-makeover": {
      default: {
        width: 1.02,
        height: 1.03,
        verticalShift: -0.002,
        centralEmphasis: 1.05
      },
      "balanced-smile": {
        width: 1.02,
        height: 1.03,
        verticalShift: -0.002,
        centralEmphasis: 1.05
      },
      "symmetry-refinement": {
        width: 1.025,
        height: 1.032,
        verticalShift: -0.002,
        centralEmphasis: 1.12
      },
      "broader-smile": {
        width: 1.035,
        height: 1.02,
        verticalShift: -0.001,
        centralEmphasis: 0.96
      }
    }
  };

  const procedureProfiles =
    profiles[procedure];

  if (!procedureProfiles) {
    return null;
  }

  return (
    procedureProfiles[
      normalizedGoal
    ] ||
    procedureProfiles.default
  );
}

function polygonBounds(
  polygon
) {
  const xs =
    polygon.map(point => point.x);

  const ys =
    polygon.map(point => point.y);

  const left =
    Math.min(...xs);

  const right =
    Math.max(...xs);

  const top =
    Math.min(...ys);

  const bottom =
    Math.max(...ys);

  return {
    left,
    right,
    top,
    bottom,
    width:
      Math.max(
        1,
        right - left
      ),
    height:
      Math.max(
        1,
        bottom - top
      )
  };
}

function scaledPolygon(
  polygon,
  center,
  scaleX,
  scaleY,
  shiftY = 0
) {
  return polygon.map(point => ({
    x:
      center.x +
      (point.x - center.x) *
        scaleX,
    y:
      center.y +
      (point.y - center.y) *
        scaleY +
      shiftY
  }));
}

function clipPolygon(
  context,
  polygon
) {
  if (
    !Array.isArray(polygon) ||
    polygon.length < 3
  ) {
    return false;
  }

  context.beginPath();
  context.moveTo(
    polygon[0].x,
    polygon[0].y
  );

  for (
    let index = 1;
    index < polygon.length;
    index += 1
  ) {
    context.lineTo(
      polygon[index].x,
      polygon[index].y
    );
  }

  context.closePath();
  context.clip();

  return true;
}

export function renderDentalGeometry(
  sourceCanvas,
  dentalMesh,
  baseMaskCanvas,
  level = "balanced",
  procedure = "veneers",
  goal = ""
) {
  if (
    !sourceCanvas ||
    !dentalMesh?.valid ||
    !baseMaskCanvas
  ) {
    return sourceCanvas;
  }

  const profile =
    getDentalGeometryProfile(
      procedure,
      goal
    );

  if (!profile) {
    return sourceCanvas;
  }

  const canvas =
    document.createElement("canvas");

  canvas.width =
    sourceCanvas.width;

  canvas.height =
    sourceCanvas.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  const intensity =
    getDentalIntensity(level);

  const confidence =
    clamp(
      Number(
        dentalMesh.confidence
      ) || 0,
      0,
      1
    );

  // Geometry is intentionally small. Low-confidence smiles
  // automatically receive less tooth-shape manipulation.
  const confidenceScale =
    0.35 +
    confidence * 0.65;

  const upperTeeth =
    dentalMesh.upperTeeth || [];

  const count =
    upperTeeth.length;

  upperTeeth.forEach(
    (zone, index) => {
      if (!zone?.polygon) {
        return;
      }

      const distanceFromCenter =
        Math.abs(
          index -
          (count - 1) / 2
        ) /
        Math.max(
          1,
          count / 2
        );

      const centralWeight =
        1 +
        (
          profile.centralEmphasis -
          1
        ) *
          (1 - distanceFromCenter);

      const scaleX =
        1 +
        (
          profile.width - 1
        ) *
          intensity *
          confidenceScale *
          centralWeight;

      const scaleY =
        1 +
        (
          profile.height - 1
        ) *
          intensity *
          confidenceScale *
          centralWeight;

      const mouthOpening =
        dentalMesh
          .mouthBounds
          ?.opening || 1;

      const shiftY =
        profile.verticalShift *
        mouthOpening *
        intensity *
        confidenceScale *
        centralWeight;

      const sourceBounds =
        polygonBounds(
          zone.polygon
        );

      const targetPolygon =
        scaledPolygon(
          zone.polygon,
          zone.center,
          scaleX,
          scaleY,
          shiftY
        );

      const targetBounds =
        polygonBounds(
          targetPolygon
        );

      const layer =
        document.createElement(
          "canvas"
        );

      layer.width =
        canvas.width;

      layer.height =
        canvas.height;

      const layerContext =
        layer.getContext("2d");

      if (!layerContext) {
        return;
      }

      layerContext.save();

      if (
        !clipPolygon(
          layerContext,
          targetPolygon
        )
      ) {
        layerContext.restore();
        return;
      }

      layerContext.drawImage(
        sourceCanvas,
        sourceBounds.left,
        sourceBounds.top,
        sourceBounds.width,
        sourceBounds.height,
        targetBounds.left,
        targetBounds.top,
        targetBounds.width,
        targetBounds.height
      );

      layerContext.restore();

      // The original mouth/teeth mask remains the hard
      // safety boundary for every estimated tooth transform.
      layerContext.globalCompositeOperation =
        "destination-in";

      layerContext.drawImage(
        baseMaskCanvas,
        0,
        0
      );

      layerContext.globalCompositeOperation =
        "source-over";

      context.drawImage(
        layer,
        0,
        0
      );
    }
  );

  return canvas;
}
