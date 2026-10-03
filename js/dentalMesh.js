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
