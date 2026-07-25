// =========================================================
// AESTHETIQ — MEDIAPIPE FACIAL MASK DEFINITIONS
// File: js/mediapipeMasks.js
//
// Supports MediaPipe Face Mesh / Face Landmarker landmarks.
// Core facial geometry uses landmark indices 0–467.
// =========================================================

// ---------------------------------------------------------
// FACE OUTLINE
// ---------------------------------------------------------

const FACE_OVAL = [
  10,
  338,
  297,
  332,
  284,
  251,
  389,
  356,
  454,
  323,
  361,
  288,
  397,
  365,
  379,
  378,
  400,
  377,
  152,
  148,
  176,
  149,
  150,
  136,
  172,
  58,
  132,
  93,
  234,
  127,
  162,
  21,
  54,
  103,
  67,
  109
];

// ---------------------------------------------------------
// FOREHEAD AND BROWS
// ---------------------------------------------------------

const FOREHEAD = [
  10,
  338,
  297,
  332,
  284,
  251,
  389,
  70,
  63,
  105,
  66,
  107,
  9,
  336,
  296,
  334,
  293,
  300,
  368,
  127,
  162,
  21,
  54,
  103,
  67,
  109
];

const GLABELLA = [
  107,
  66,
  105,
  9,
  334,
  296,
  336,
  285,
  417,
  168,
  193,
  55
];

const LEFT_BROW = [
  70,
  63,
  105,
  66,
  107,
  55,
  65,
  52,
  53,
  46
];

const RIGHT_BROW = [
  336,
  296,
  334,
  293,
  300,
  276,
  283,
  282,
  295,
  285
];

// ---------------------------------------------------------
// EYES
// ---------------------------------------------------------

const LEFT_EYE = [
  33,
  7,
  163,
  144,
  145,
  153,
  154,
  155,
  133,
  173,
  157,
  158,
  159,
  160,
  161,
  246
];

const RIGHT_EYE = [
  362,
  382,
  381,
  380,
  374,
  373,
  390,
  249,
  263,
  466,
  388,
  387,
  386,
  385,
  384,
  398
];

const LEFT_UPPER_EYELID = [
  33,
  246,
  161,
  160,
  159,
  158,
  157,
  173,
  133,
  155,
  154,
  153,
  145,
  144,
  163,
  7
];

const RIGHT_UPPER_EYELID = [
  362,
  398,
  384,
  385,
  386,
  387,
  388,
  466,
  263,
  249,
  390,
  373,
  374,
  380,
  381,
  382
];

const LEFT_UNDER_EYE = [
  33,
  133,
  155,
  154,
  153,
  145,
  144,
  163,
  7,
  130,
  25,
  110,
  24,
  23,
  22,
  26,
  112,
  243
];

const RIGHT_UNDER_EYE = [
  362,
  398,
  384,
  385,
  386,
  387,
  388,
  263,
  359,
  255,
  339,
  254,
  253,
  252,
  256,
  341,
  463
];

const LEFT_CROWS_FEET = [
  33,
  130,
  226,
  113,
  225,
  224,
  223,
  222,
  221,
  189,
  244,
  245,
  246,
  161,
  160
];

const RIGHT_CROWS_FEET = [
  263,
  359,
  446,
  342,
  445,
  444,
  443,
  442,
  441,
  413,
  464,
  465,
  466,
  388,
  387
];

// ---------------------------------------------------------
// NOSE
// ---------------------------------------------------------

const NOSE_FULL = [
  168,
  6,
  197,
  195,
  5,
  4,
  1,
  19,
  94,
  2,
  164,
  0,
  37,
  39,
  40,
  185,
  61,
  146,
  91,
  181,
  84,
  17,
  314,
  405,
  321,
  375,
  291,
  409,
  270,
  269,
  267
];

const NOSE_BRIDGE = [
  168,
  6,
  197,
  195,
  5,
  4,
  1,
  19,
  94,
  2,
  98,
  97,
  2,
  326,
  327
];

const NOSE_TIP = [
  4,
  1,
  19,
  94,
  2,
  164,
  0,
  37,
  39,
  40,
  267,
  269,
  270
];

const LEFT_NOSTRIL = [
  98,
  97,
  2,
  49,
  48,
  64,
  102,
  129
];

const RIGHT_NOSTRIL = [
  327,
  326,
  2,
  279,
  278,
  294,
  331,
  358
];

const NASAL_BASE = [
  129,
  102,
  64,
  48,
  49,
  2,
  279,
  278,
  294,
  331,
  358,
  327,
  326,
  97,
  98
];

// ---------------------------------------------------------
// LIPS AND MOUTH
// ---------------------------------------------------------

const OUTER_LIPS = [
  61,
  146,
  91,
  181,
  84,
  17,
  314,
  405,
  321,
  375,
  291,
  409,
  270,
  269,
  267,
  0,
  37,
  39,
  40,
  185
];

const INNER_LIPS = [
  78,
  95,
  88,
  178,
  87,
  14,
  317,
  402,
  318,
  324,
  308,
  415,
  310,
  311,
  312,
  13,
  82,
  81,
  80,
  191
];

const UPPER_LIP = [
  61,
  185,
  40,
  39,
  37,
  0,
  267,
  269,
  270,
  409,
  291,
  308,
  415,
  310,
  311,
  312,
  13,
  82,
  81,
  80,
  191,
  78
];

const LOWER_LIP = [
  61,
  146,
  91,
  181,
  84,
  17,
  314,
  405,
  321,
  375,
  291,
  308,
  324,
  318,
  402,
  317,
  14,
  87,
  178,
  88,
  95,
  78
];

const PHILTRUM = [
  164,
  0,
  37,
  39,
  40,
  185,
  61,
  78,
  191,
  80,
  81,
  82,
  13,
  312,
  311,
  310,
  415,
  308,
  291,
  409,
  270,
  269,
  267
];

const CUPIDS_BOW = [
  185,
  40,
  39,
  37,
  0,
  267,
  269,
  270,
  409,
  415,
  310,
  311,
  312,
  13,
  82,
  81,
  80,
  191
];

const MOUTH_INTERIOR = INNER_LIPS;

// ---------------------------------------------------------
// CHEEKS
// ---------------------------------------------------------

const LEFT_CHEEK = [
  116,
  117,
  118,
  119,
  100,
  36,
  205,
  50,
  187,
  123,
  147,
  213,
  192,
  214,
  212,
  216,
  206,
  203,
  129,
  209,
  49,
  48,
  64,
  98
];

const RIGHT_CHEEK = [
  345,
  346,
  347,
  348,
  329,
  266,
  425,
  280,
  411,
  352,
  376,
  433,
  416,
  434,
  432,
  436,
  426,
  423,
  358,
  429,
  279,
  278,
  294,
  327
];

const LEFT_BUCCAL_AREA = [
  123,
  147,
  187,
  205,
  206,
  216,
  212,
  214,
  192,
  213,
  177,
  132,
  58,
  172,
  136
];

const RIGHT_BUCCAL_AREA = [
  352,
  376,
  411,
  425,
  426,
  436,
  432,
  434,
  416,
  433,
  401,
  361,
  288,
  397,
  365
];

// ---------------------------------------------------------
// TEMPLES
// ---------------------------------------------------------

const LEFT_TEMPLE = [
  21,
  54,
  103,
  67,
  109,
  108,
  69,
  104,
  68,
  71,
  139,
  127,
  234,
  93,
  132,
  58,
  172,
  136,
  150,
  149,
  176
];

const RIGHT_TEMPLE = [
  251,
  284,
  332,
  297,
  338,
  337,
  299,
  333,
  298,
  301,
  368,
  356,
  454,
  323,
  361,
  288,
  397,
  365,
  379,
  378,
  400
];

// ---------------------------------------------------------
// JAWLINE AND CHIN
// ---------------------------------------------------------

const LEFT_JAWLINE = [
  234,
  93,
  132,
  58,
  172,
  136,
  150,
  149,
  176,
  148,
  152,
  377,
  400,
  378,
  379,
  365
];

const RIGHT_JAWLINE = [
  454,
  323,
  361,
  288,
  397,
  365,
  379,
  378,
  400,
  377,
  152,
  148,
  176,
  149,
  150,
  136
];

const LOWER_FACE = [
  234,
  93,
  132,
  58,
  172,
  136,
  150,
  149,
  176,
  148,
  152,
  377,
  400,
  378,
  379,
  365,
  397,
  288,
  361,
  323,
  454,
  356,
  389,
  251,
  284,
  332,
  297,
  338,
  10,
  109,
  67,
  103,
  54,
  21,
  162,
  127
];

const CHIN = [
  18,
  83,
  182,
  106,
  43,
  57,
  186,
  92,
  165,
  167,
  164,
  393,
  391,
  322,
  410,
  287,
  273,
  335,
  406,
  313,
  421,
  200,
  201,
  208,
  171,
  175,
  396,
  369,
  395,
  394
];

const SUBMENTAL = [
  172,
  136,
  150,
  149,
  176,
  148,
  152,
  377,
  400,
  378,
  379,
  365,
  397,
  288,
  401,
  435,
  367,
  364,
  394,
  395,
  369,
  396,
  175,
  171,
  140,
  170,
  169,
  135,
  138,
  215,
  177
];

// ---------------------------------------------------------
// SMILE / DENTAL APPROXIMATIONS
// ---------------------------------------------------------

const TEETH_AREA = [
  78,
  191,
  80,
  81,
  82,
  13,
  312,
  311,
  310,
  415,
  308,
  324,
  318,
  402,
  317,
  14,
  87,
  178,
  88,
  95
];

const UPPER_TEETH_AREA = [
  78,
  191,
  80,
  81,
  82,
  13,
  312,
  311,
  310,
  415,
  308,
  324,
  318,
  402,
  317,
  14,
  87,
  178,
  88,
  95
];

const GUM_AREA = [
  61,
  185,
  40,
  39,
  37,
  0,
  267,
  269,
  270,
  409,
  291,
  308,
  415,
  310,
  311,
  312,
  13,
  82,
  81,
  80,
  191,
  78
];

// ---------------------------------------------------------
// MASTER MASK REGISTRY
// ---------------------------------------------------------

export const MEDIAPIPE_MASKS = {
  faceOval: FACE_OVAL,
  fullFace: FACE_OVAL,

  forehead: FOREHEAD,
  glabella: GLABELLA,

  leftBrow: LEFT_BROW,
  rightBrow: RIGHT_BROW,
  brows: [LEFT_BROW, RIGHT_BROW],

  leftEye: LEFT_EYE,
  rightEye: RIGHT_EYE,
  eyes: [LEFT_EYE, RIGHT_EYE],

  leftUpperEyelid: LEFT_UPPER_EYELID,
  rightUpperEyelid: RIGHT_UPPER_EYELID,
  upperEyelids: [
    LEFT_UPPER_EYELID,
    RIGHT_UPPER_EYELID
  ],

  leftUnderEye: LEFT_UNDER_EYE,
  rightUnderEye: RIGHT_UNDER_EYE,
  underEyes: [
    LEFT_UNDER_EYE,
    RIGHT_UNDER_EYE
  ],

  leftCrowsFeet: LEFT_CROWS_FEET,
  rightCrowsFeet: RIGHT_CROWS_FEET,
  crowsFeet: [
    LEFT_CROWS_FEET,
    RIGHT_CROWS_FEET
  ],

  nose: NOSE_FULL,
  noseBridge: NOSE_BRIDGE,
  noseTip: NOSE_TIP,
  leftNostril: LEFT_NOSTRIL,
  rightNostril: RIGHT_NOSTRIL,
  nostrils: [
    LEFT_NOSTRIL,
    RIGHT_NOSTRIL
  ],
  nasalBase: NASAL_BASE,

  outerLips: OUTER_LIPS,
  innerLips: INNER_LIPS,
  upperLip: UPPER_LIP,
  lowerLip: LOWER_LIP,
  lips: [UPPER_LIP, LOWER_LIP],
  philtrum: PHILTRUM,
  cupidsBow: CUPIDS_BOW,
  mouthInterior: MOUTH_INTERIOR,

  leftCheek: LEFT_CHEEK,
  rightCheek: RIGHT_CHEEK,
  cheeks: [
    LEFT_CHEEK,
    RIGHT_CHEEK
  ],

  leftBuccalArea: LEFT_BUCCAL_AREA,
  rightBuccalArea: RIGHT_BUCCAL_AREA,
  buccalAreas: [
    LEFT_BUCCAL_AREA,
    RIGHT_BUCCAL_AREA
  ],

  leftTemple: LEFT_TEMPLE,
  rightTemple: RIGHT_TEMPLE,
  temples: [
    LEFT_TEMPLE,
    RIGHT_TEMPLE
  ],

  leftJawline: LEFT_JAWLINE,
  rightJawline: RIGHT_JAWLINE,
  jawline: [
    LEFT_JAWLINE,
    RIGHT_JAWLINE
  ],

  chin: CHIN,
  lowerFace: LOWER_FACE,
  submental: SUBMENTAL,

  teeth: TEETH_AREA,
  upperTeeth: UPPER_TEETH_AREA,
  gums: GUM_AREA
};

// ---------------------------------------------------------
// REGIONS NOT DIRECTLY SUPPORTED BY FACE LANDMARKS
// ---------------------------------------------------------

export const EXTERNAL_MASK_REGIONS = {
  hairline: {
    supported: false,
    reason:
      "The visible hairline is not reliably represented by the facial landmark mesh."
  },

  neck: {
    supported: false,
    reason:
      "The face landmark model does not provide a complete neck boundary."
  },

  scalp: {
    supported: false,
    reason:
      "Scalp geometry requires segmentation or a separate head model."
  }
};

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

export function getMaskDefinition(maskName) {
  return MEDIAPIPE_MASKS[maskName] || null;
}

export function hasMaskDefinition(maskName) {
  return Object.prototype.hasOwnProperty.call(
    MEDIAPIPE_MASKS,
    maskName
  );
}

export function getAvailableMaskNames() {
  return Object.keys(MEDIAPIPE_MASKS);
}

export function isCompoundMask(maskDefinition) {
  return (
    Array.isArray(maskDefinition) &&
    Array.isArray(maskDefinition[0])
  );
}

export function validateLandmarks(landmarks) {
  return (
    Array.isArray(landmarks) &&
    landmarks.length >= 468
  );
}

export function landmarkToCanvasPoint(
  landmark,
  canvasWidth,
  canvasHeight,
  mirrorX = false
) {
  if (!landmark) {
    return null;
  }

  const normalizedX = mirrorX
    ? 1 - landmark.x
    : landmark.x;

  return {
    x: normalizedX * canvasWidth,
    y: landmark.y * canvasHeight,
    z: landmark.z || 0
  };
}

export function indicesToPolygon(
  landmarkIndices,
  landmarks,
  canvasWidth,
  canvasHeight,
  mirrorX = false
) {
  if (!validateLandmarks(landmarks)) {
    return [];
  }

  if (!Array.isArray(landmarkIndices)) {
    return [];
  }

  return landmarkIndices
    .map((index) => {
      const landmark = landmarks[index];

      return landmarkToCanvasPoint(
        landmark,
        canvasWidth,
        canvasHeight,
        mirrorX
      );
    })
    .filter(Boolean);
}

export function getMaskPolygons(
  maskName,
  landmarks,
  canvasWidth,
  canvasHeight,
  mirrorX = false
) {
  const definition = getMaskDefinition(maskName);

  if (!definition) {
    console.warn(
      `[AesthetIQ] Unknown mask: ${maskName}`
    );

    return [];
  }

  if (!validateLandmarks(landmarks)) {
    console.warn(
      "[AesthetIQ] Invalid MediaPipe landmarks."
    );

    return [];
  }

  if (isCompoundMask(definition)) {
    return definition.map((indices) =>
      indicesToPolygon(
        indices,
        landmarks,
        canvasWidth,
        canvasHeight,
        mirrorX
      )
    );
  }

  return [
    indicesToPolygon(
      definition,
      landmarks,
      canvasWidth,
      canvasHeight,
      mirrorX
    )
  ];
}

export function tracePolygon(
  context,
  polygon,
  closePath = true
) {
  if (
    !context ||
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

  if (closePath) {
    context.closePath();
  }

  return true;
}

export function drawMaskDebug(
  context,
  maskName,
  landmarks,
  canvasWidth,
  canvasHeight,
  options = {}
) {
  const {
    mirrorX = false,
    fillStyle = "rgba(88, 190, 255, 0.22)",
    strokeStyle = "rgba(255, 255, 255, 0.9)",
    lineWidth = 1.5,
    drawPoints = false
  } = options;

  const polygons = getMaskPolygons(
    maskName,
    landmarks,
    canvasWidth,
    canvasHeight,
    mirrorX
  );

  polygons.forEach((polygon) => {
    const traced = tracePolygon(
      context,
      polygon
    );

    if (!traced) {
      return;
    }

    context.fillStyle = fillStyle;
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;

    context.fill();
    context.stroke();

    if (drawPoints) {
      polygon.forEach((point) => {
        context.beginPath();
        context.arc(
          point.x,
          point.y,
          2.5,
          0,
          Math.PI * 2
        );

        context.fillStyle = strokeStyle;
        context.fill();
      });
    }
  });

  return polygons;
}

export function createMaskCanvas(
  maskName,
  landmarks,
  canvasWidth,
  canvasHeight,
  options = {}
) {
  const {
    mirrorX = false,
    featherBlur = 8
  } = options;

  const maskCanvas =
    document.createElement("canvas");

  maskCanvas.width = canvasWidth;
  maskCanvas.height = canvasHeight;

  const maskContext =
    maskCanvas.getContext("2d");

  const polygons = getMaskPolygons(
    maskName,
    landmarks,
    canvasWidth,
    canvasHeight,
    mirrorX
  );

  maskContext.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  maskContext.save();

  if (featherBlur > 0) {
    maskContext.filter =
      `blur(${featherBlur}px)`;
  }

  maskContext.fillStyle =
    "rgba(255, 255, 255, 1)";

  polygons.forEach((polygon) => {
    if (
      tracePolygon(
        maskContext,
        polygon
      )
    ) {
      maskContext.fill();
    }
  });

  maskContext.restore();

  return maskCanvas;
}
