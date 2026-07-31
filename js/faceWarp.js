import {
  getLipIntensityProfile,
  getLipStyleProfile
} from "./lipProfiles.js";

import {
  applyLipSoftTissue
} from "./lipSoftTissue.js";

import {
  displaceLipSkin
} from "./lipSkinDisplacement.js";

import {
  applyLipBiomechanics
} from "./lipBiomechanics.js";

import {
  getLipProfile
} from "./lipAnatomy.js";

/*
=========================================================
 AesthetIQ Face Warp Engine
 Version 1
=========================================================
*/

export function getCenter(points) {
  let x = 0;
  let y = 0;

  points.forEach(point => {
    x += point.x;
    y += point.y;
  });

  return {
    x: x / points.length,
    y: y / points.length
  };
}

export function movePoint(point, center, amount) {
  return {
    x: center.x + (point.x - center.x) * amount,
    y: center.y + (point.y - center.y) * amount
  };
}

export function warpRegion(landmarks, indices, strength = 1.0) {
  const region = indices.map(index => landmarks[index]);

  const center = getCenter(region);

  const warped = {};

  indices.forEach(index => {
    warped[index] = movePoint(
      landmarks[index],
      center,
      strength
    );
  });

  return warped;
}

export function mergeWarp(original, warped) {
  const result = [...original];

  Object.keys(warped).forEach(index => {
    result[index] = warped[index];
  });

  return result;
}

// ==========================================================
// ANATOMICAL LIP WEIGHTS
// ==========================================================

const UPPER_LIP_WEIGHTS = {
  61: 0.15,
  185: 0.28,
  40: 0.55,
  39: 0.82,
  37: 1.00,
  0: 1.00,
  267: 1.00,
  269: 0.82,
  270: 0.55,
  409: 0.28,
  291: 0.15
};

const LOWER_LIP_WEIGHTS = {
  146: 0.18,
  91: 0.35,
  181: 0.65,
  84: 0.90,
  17: 1.00,
  314: 0.90,
  405: 0.65,
  321: 0.35,
  375: 0.18
};

/*
=========================================================
Lip Enlargement
=========================================================
*/
export function warpLipFiller(
  landmarks,
  level = "balanced",
  anatomyStrength = 1,
  tissueModel = null,
  lipStyle = "classic",
  lipProduct = "provider"
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    return landmarks;
  }

  const profile =
    getLipIntensityProfile(level) || {};

  const styleProfile =
  getLipStyleProfile(lipStyle) || {};

  const anatomy =
  getLipProfile(landmarks);

  const safeAnatomyStrength =
  Math.max(
    0.85,
    Math.min(
      1.18,
      Number(anatomyStrength) || 1
    )
  );

const elasticity =
  Math.max(
    0.7,
    Math.min(
      1.3,
      Number(tissueModel?.elasticity) || 1
    )
  );

const projectionResistance =
  Math.max(
    0.7,
    Math.min(
      1.3,
      Number(
        tissueModel?.projectionResistance
      ) || 1
    )
  );

const skinMobility =
  Math.max(
    0.7,
    Math.min(
      1.3,
      Number(tissueModel?.skinMobility) || 1
    )
  );

/*
 * More elasticity allows slightly more deformation.
 * More projection resistance reduces forward/fullness
 * response instead of increasing it.
 */
const tissueDeformationStrength =
  Math.max(
    0.8,
    Math.min(
      1.2,
      elasticity /
        projectionResistance
    )
  );
  
const baseLevelStrength =
  level === "natural"
    ? 0.4
    : level === "enhanced"
    ? 0.82
    : 0.6;

const levelStrength =
  baseLevelStrength *
  safeAnatomyStrength *
  tissueDeformationStrength;

 const baseUpperVolume =
  (
    Number.isFinite(profile.upperVolume)
      ? profile.upperVolume
      : 1
  ) *
  (
    Number.isFinite(styleProfile.upperVolume)
      ? styleProfile.upperVolume
      : 1
  );

const baseLowerVolume =
  (
    Number.isFinite(profile.lowerVolume)
      ? profile.lowerVolume
      : 1
  ) *
  (
    Number.isFinite(styleProfile.lowerVolume)
      ? styleProfile.lowerVolume
      : 1
  ); 

const fullness =
  Number.isFinite(anatomy.fullness)
    ? anatomy.fullness
    : 0.18;

const thinLipBoost =
  Math.max(
    0,
    Math.min(
      0.22,
      (0.18 - fullness) * 1.4
    )
  );

const naturallyFullReduction =
  Math.max(
    0,
    Math.min(
      0.2,
      (fullness - 0.24) * 1.2
    )
  );

const upperVolume =
  baseUpperVolume *
  (
    1 +
    thinLipBoost -
    naturallyFullReduction
  );

const lowerVolume =
  baseLowerVolume *
  (
    1 +
    thinLipBoost * 0.8 -
    naturallyFullReduction
  );

  const horizontalVolume =
  (
    Number.isFinite(profile.horizontalVolume)
      ? profile.horizontalVolume
      : 1
  ) *
  (
    Number.isFinite(styleProfile.horizontalVolume)
      ? styleProfile.horizontalVolume
      : 1
  );

 const baseCupidBowStrength =
  (
    Number.isFinite(profile.cupidBow)
      ? profile.cupidBow
      : 1
  ) *
  (
    Number.isFinite(styleProfile.cupidBow)
      ? styleProfile.cupidBow
      : 1
  ); 

const cupidStrength =
  Number.isFinite(anatomy.cupidStrength)
    ? anatomy.cupidStrength
    : 0.5;

const cupidBowStrength =
  baseCupidBowStrength *
  (
    1.15 -
    cupidStrength * 0.3
  );

  const borderStrength =
  (
    Number.isFinite(profile.border)
      ? profile.border
      : 1
  ) *
  (
    Number.isFinite(styleProfile.borderDefinition)
      ? styleProfile.borderDefinition
      : 1
  );

  const tubercleStrength =
  (
    Number.isFinite(profile.centralTubercle)
      ? profile.centralTubercle
      : 1
  ) *
  (
    Number.isFinite(styleProfile.centralTubercle)
      ? styleProfile.centralTubercle
      : 1
  );

  const cornerLift =
  (
    Number.isFinite(profile.cornerLift)
      ? profile.cornerLift
      : 1
  ) *
  (
    Number.isFinite(styleProfile.cornerLift)
      ? styleProfile.cornerLift
      : 1
  );

  const verticalLift =
  Number.isFinite(styleProfile.verticalLift)
    ? styleProfile.verticalLift
    : 1;

const styleProjection =
  Number.isFinite(styleProfile.projection)
    ? styleProfile.projection
    : 1;

  const result =
    landmarks.map((landmark) => ({
      ...landmark
    }));

  // Outer vermilion borders
  const upperOuter = [
    61, 185, 40, 39, 37,
    0, 267, 269, 270, 409, 291
  ];

  const lowerOuter = [
    61, 146, 91, 181, 84,
    17, 314, 405, 321, 375, 291
  ];

  // Inner wet-line contours
  const upperInner = [
    78, 191, 80, 81, 82,
    13, 312, 311, 310, 415, 308
  ];

  const lowerInner = [
    78, 95, 88, 178, 87,
    14, 317, 402, 318, 324, 308
  ];

  const upperCenterPoints = [
    39, 37, 0, 267, 269,
    81, 82, 13, 312, 311
  ];

  const lowerCenterPoints = [
    181, 84, 17, 314, 405,
    178, 87, 14, 317, 402
  ];

  const cupidBow = [
    37, 0, 267
  ];

  const mouthCorners = [
    61, 291
  ];

  const leftCorner =
    landmarks[61];

  const rightCorner =
    landmarks[291];

  const upperCenter =
    landmarks[13];

  const lowerCenter =
    landmarks[14];

  if (
    !leftCorner ||
    !rightCorner ||
    !upperCenter ||
    !lowerCenter
  ) {
    return result;
  }

  const centerX =
    (
      leftCorner.x +
      rightCorner.x
    ) / 2;

  const centerY =
    (
      upperCenter.y +
      lowerCenter.y
    ) / 2;

  const halfMouthWidth =
    Math.max(
      0.0001,
      Math.abs(
        rightCorner.x -
        leftCorner.x
      ) / 2
    );

  function moveGroup(
  indices,
  verticalDirection,
  verticalAmount,
  horizontalAmount,
  centerBoost = 0
) {
  indices.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const normalizedDistance =
      Math.min(
        1,
        Math.abs(
          point.x -
          centerX
        ) / halfMouthWidth
      );

    /*
     * Center points receive the most fullness.
     * Corners receive almost none.
     */
    const centerWeight =
      Math.pow(
        1 -
        normalizedDistance,
        1.35
      );

    const edgeWeight =
      Math.pow(
        normalizedDistance,
        1.8
      );

    const sideDirection =
      point.x < centerX
        ? -1
        : 1;

    /*
     * Vertical movement builds lip height.
     * It is strongest near the center and tapers
     * toward the corners.
     */
    const anatomicalWeight =
  UPPER_LIP_WEIGHTS[index] ??
  LOWER_LIP_WEIGHTS[index] ??
  0.5;

const verticalWeight =
  (
    0.12 +
    centerWeight *
    (
      0.88 +
      centerBoost
    )
  ) *
  anatomicalWeight;

    /*
     * Horizontal movement adds rounded projection,
     * but avoids stretching the mouth corners.
     */
    const horizontalWeight =
  centerWeight *
  (
    1 -
    edgeWeight
  ) *
  anatomicalWeight;

    result[index] = {
      ...point,

      x:
        point.x +
        sideDirection *
        horizontalAmount *
        horizontalWeight,

      y:
        point.y +
        verticalDirection *
        verticalAmount *
        verticalWeight
    };
  });
}

 // Upper outer lip
moveGroup(
  upperOuter,
  -1,
  0.009 *
    upperVolume *
    verticalLift *
    levelStrength,
  0.0032 *
    horizontalVolume *
    levelStrength,
  0.2
);

// Upper inner lip
moveGroup(
  upperInner,
  -1,
  0.0024 *
    upperVolume *
    verticalLift *
    levelStrength,
  0.0012 *
    horizontalVolume *
    levelStrength,
  0.08
);

// Lower outer lip
moveGroup(
  lowerOuter,
  1,
  0.0105 *
    lowerVolume *
    verticalLift *
    levelStrength,
  0.0035 *
    horizontalVolume *
    levelStrength,
  0.24
);

// Lower inner lip
moveGroup(
  lowerInner,
  1,
  0.0028 *
    lowerVolume *
    levelStrength,
  0.0014 *
    horizontalVolume *
    levelStrength,
  0.1
);

  // Add rounded central projection.
  upperCenterPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const distanceFromCenter =
      Math.abs(
        point.x -
        centerX
      ) / halfMouthWidth;

    const centerInfluence =
      Math.max(
        0,
        1 -
        distanceFromCenter
      );

    result[index] = {
      ...point,
      y:
        point.y -
        0.0018 *
        upperVolume *
        levelStrength *
        centerInfluence
    };
  });

  lowerCenterPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const distanceFromCenter =
      Math.abs(
        point.x -
        centerX
      ) / halfMouthWidth;

    const centerInfluence =
      Math.max(
        0,
        1 -
        distanceFromCenter
      );

    result[index] = {
      ...point,
      y:
        point.y +
        0.0022 *
        lowerVolume *
        levelStrength *
        centerInfluence
    };
  });

  // Preserve and sharpen Cupid's bow.
  cupidBow.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const centerInfluence =
      index === 0
        ? 1
        : 0.62;

    result[index] = {
      ...point,
      y:
        point.y -
        0.0028 *
        cupidBowStrength *
        levelStrength *
        centerInfluence
    };
  });

  // Slightly define the outer vermilion border.
  upperOuter.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.0012 *
        borderStrength *
        levelStrength
    };
  });

  lowerOuter.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y +
        0.0014 *
        borderStrength *
        levelStrength
    };
  });

  // Central tubercle fullness.
  [0, 13].forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.0024 *
        tubercleStrength *
        levelStrength
    };
  });

  const lowerTubercle =
    result[14];

  if (lowerTubercle) {
    result[14] = {
      ...lowerTubercle,
      y:
        lowerTubercle.y +
        0.0028 *
        tubercleStrength *
        levelStrength
    };
  }

  // =========================================================
// KEYHOLE LIP STYLE
// =========================================================
//
// Preserve a small central separation between the upper
// and lower inner lip while keeping fullness around it.
// The effect remains subtle so it does not create an
// artificial-looking gap.
//

if (lipStyle === "keyhole") {
  const upperInnerCenter =
    result[13];

  const lowerInnerCenter =
    result[14];

  if (
    upperInnerCenter &&
    lowerInnerCenter
  ) {
    const keyholeStrength =
      level === "natural"
        ? 0.00035
        : level === "enhanced"
        ? 0.0008
        : 0.00055;

    result[13] = {
      ...upperInnerCenter,

      y:
        upperInnerCenter.y -
        keyholeStrength *
        safeAnatomyStrength
    };

    result[14] = {
      ...lowerInnerCenter,

      y:
        lowerInnerCenter.y +
        keyholeStrength *
        safeAnatomyStrength
    };
  }

  // Add fullness immediately beside the center rather
  // than stretching the entire mouth opening.
  const upperKeyholeSides = [
    82,
    312
  ];

  const lowerKeyholeSides = [
    87,
    317
  ];

  upperKeyholeSides.forEach(index => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,

      y:
        point.y -
        0.00065 *
        levelStrength
    };
  });

  lowerKeyholeSides.forEach(index => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,

      y:
        point.y +
        0.00065 *
        levelStrength
    };
  });
}

  // Keep the corners controlled instead of widening them too much.
  mouthCorners.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const originalPoint =
      landmarks[index];

    result[index] = {
      ...point,

      x:
        originalPoint.x +
        (
          point.x -
          originalPoint.x
        ) * 0.45,

      y:
        point.y -
        0.0015 *
        cornerLift *
        levelStrength
    };
  });

 /*
=========================================================
Lip Projection / Depth
=========================================================

MediaPipe z represents landmark depth.

We add controlled projection primarily to the central
vermilion while allowing the effect to taper toward
the mouth corners.

The constraint layer in simulationPipeline.js provides
the final safety limit.
*/

const projectionStrength =
  level === "natural"
    ? 0.0018
    : level === "enhanced"
    ? 0.0048
    : 0.0032;

const projectionAmount =
  projectionStrength *
  styleProjection *
  safeAnatomyStrength *
  tissueDeformationStrength;

const projectionPoints = [
  // Upper lip
  185, 40, 39, 37,
  0,
  267, 269, 270, 409,

  // Upper inner lip
  191, 80, 81, 82,
  13,
  312, 311, 310, 415,

  // Lower lip
  146, 91, 181, 84,
  17,
  314, 405, 321, 375,

  // Lower inner lip
  95, 88, 178, 87,
  14,
  317, 402, 318, 324
];

projectionPoints.forEach((index) => {
  const point =
    result[index];

  if (!point) {
    return;
  }

  const normalizedDistance =
    Math.min(
      1,
      Math.abs(
        point.x - centerX
      ) / halfMouthWidth
    );

  /*
   * Projection is strongest in the central lip
   * and fades toward the corners.
   */
  const centerInfluence =
    Math.pow(
      1 - normalizedDistance,
      1.5
    );

  const originalZ =
    Number(point.z) || 0;

  result[index] = {
    ...point,

    z:
      originalZ -
      projectionAmount *
      centerInfluence
  };
}); 

  const tissueStrength =
    level === "natural"
      ? 0.07
      : level === "enhanced"
      ? 0.2
      : 0.13;

  const softTissue =
  applyLipSoftTissue(
    landmarks,
    result,
    tissueStrength *
      safeAnatomyStrength *
      skinMobility
  );

const philtrumLength =
  Number.isFinite(anatomy.philtrumLength)
    ? anatomy.philtrumLength
    : 0.04;

const philtrumStrength =
  Math.max(
    0.82,
    Math.min(
      1.18,
      1 +
      (
        philtrumLength -
        0.04
      ) * 3
    )
  );

const combinedAnatomyStrength =
  Math.max(
    0.82,
    Math.min(
      1.18,
      safeAnatomyStrength *
        philtrumStrength
    )
  );

const biomechanicalResult =
  applyLipBiomechanics(
    landmarks,
    softTissue,
    level,
    combinedAnatomyStrength
  );

const skinStrength =
  level === "natural"
    ? 0.2
    : level === "enhanced"
    ? 0.48
    : 0.33;

return displaceLipSkin(
  landmarks,
  biomechanicalResult,
  skinStrength *
    safeAnatomyStrength *
    skinMobility
);
}

/*
=========================================================
Chin Projection
=========================================================
*/

export function warpChin(
  landmarks,
  intensity = "balanced"
){

  const amount =
    intensity === "natural"
      ? 1.03
      : intensity === "balanced"
      ? 1.08
      : 1.15;

  const chin = [
    152,
    148,
    176,
    149,
    150,
    136,
    172
  ];

  const warped =
    warpRegion(
      landmarks,
      chin,
      amount
    );

  return mergeWarp(
    landmarks,
    warped
  );
}

/*
=========================================================
Jawline Definition
=========================================================
*/

export function warpJawline(
  landmarks,
  intensity = "balanced"
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    return landmarks;
  }

  const strength =
    intensity === "natural"
      ? 0.012
      : intensity === "balanced"
      ? 0.022
      : 0.035;

  const result = landmarks.map(
    (landmark) => ({
      ...landmark
    })
  );

  /*
   * MediaPipe face-outline points running from the
   * left jaw toward the chin and back up the right jaw.
   */
  const leftJaw = [
    234,
    93,
    132,
    58,
    172,
    136,
    150,
    149,
    176,
    148
  ];

  const rightJaw = [
    454,
    323,
    361,
    288,
    397,
    365,
    379,
    378,
    400,
    377
  ];

  /*
   * Points near the lower chin are moved less than the
   * outer jaw so the face does not look unnaturally wide.
   */
  const leftWeights = [
    1,
    0.95,
    0.9,
    0.82,
    0.72,
    0.62,
    0.48,
    0.35,
    0.2,
    0.08
  ];

  const rightWeights = [
    1,
    0.95,
    0.9,
    0.82,
    0.72,
    0.62,
    0.48,
    0.35,
    0.2,
    0.08
  ];

  leftJaw.forEach((index, position) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      x:
        landmark.x -
        strength * leftWeights[position]
    };
  });

  rightJaw.forEach((index, position) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      x:
        landmark.x +
        strength * rightWeights[position]
    };
  });

  /*
   * Slightly lower the central chin to create a cleaner
   * jaw-to-chin transition.
   */
  const chinVerticalStrength =
    intensity === "natural"
      ? 0.003
      : intensity === "balanced"
      ? 0.006
      : 0.009;

  const chinPoints = [
    152,
    148,
    176,
    377,
    400
  ];

  chinPoints.forEach((index) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      y:
        landmark.y +
        chinVerticalStrength
    };
  });

  return result;
}

/*
=========================================================
Cheek Volume
=========================================================
*/

export function warpCheeks(
  landmarks,
  intensity="balanced"
){

  const amount =
    intensity === "natural"
      ? 1.04
      : intensity === "balanced"
      ? 1.09
      : 1.16;

  const leftCheek=[
    234,93,132,58
  ];

  const rightCheek=[
    454,323,361,288
  ];

  const left=
    warpRegion(
      landmarks,
      leftCheek,
      amount
    );

  const right=
    warpRegion(
      landmarks,
      rightCheek,
      amount
    );

  return mergeWarp(
    mergeWarp(
      landmarks,
      left
    ),
    right
  );
}
