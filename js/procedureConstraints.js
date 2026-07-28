// =========================================================
// AESTHETIQ
// PROCEDURE CONSTRAINTS
// =========================================================

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

export function getProcedureConstraints({
  procedure,
  level,
  anatomyProfile = {},
  tissueModel = {}
}) {
  const measurements =
    anatomyProfile.measurements || {};

  const symmetry =
    anatomyProfile.symmetry || {};

  const elasticity =
    Number(tissueModel.elasticity) || 1;

  const projectionResistance =
    Number(
      tissueModel.projectionResistance
    ) || 1;

  const skinMobility =
    Number(tissueModel.skinMobility) || 1;

  const levelStrength =
    level === "natural"
      ? 0.72
      : level === "enhanced"
      ? 1.15
      : 1;

  const base = {
    strengthMultiplier:
      levelStrength,

    maxHorizontalChange:
      0.04,

    maxVerticalChange:
      0.04,

    maxProjectionChange:
      0.04,

    preserveSymmetry:
      true
  };

  switch (procedure) {
    case "lip-filler": {
  const lipHeight =
    Number(measurements.lipHeight) ||
    0.03;

  const mouthWidth =
    Number(measurements.mouthWidth) ||
    0.12;

  const lipProjection =
    Number(
      measurements.lipProjection
    ) || 0.055;

  /*
   * Smaller/thinner lips can tolerate a little more
   * relative visual expansion.
   *
   * Naturally fuller/projected lips receive tighter
   * limits so Enhanced does not become exaggerated.
   */
  const lipSizeFactor =
    clamp(
      0.03 / lipHeight,
      0.82,
      1.15
    );

  const widthFactor =
    clamp(
      mouthWidth / 0.12,
      0.9,
      1.1
    );

  const projectionFactor =
    clamp(
      0.055 / lipProjection,
      0.85,
      1.12
    );

  const tissueFactor =
    clamp(
      elasticity /
        projectionResistance,
      0.85,
      1.15
    );

  const anatomyFactor =
    clamp(
      lipSizeFactor *
        projectionFactor *
        tissueFactor,
      0.8,
      1.18
    );

  const verticalBase =
    level === "natural"
      ? 0.013
      : level === "enhanced"
      ? 0.022
      : 0.017;

  const horizontalBase =
    level === "natural"
      ? 0.010
      : level === "enhanced"
      ? 0.018
      : 0.014;

  const projectionBase =
    level === "natural"
      ? 0.011
      : level === "enhanced"
      ? 0.020
      : 0.015;

  return {
    ...base,

    strengthMultiplier:
      clamp(
        levelStrength *
          anatomyFactor,
        0.68,
        1.2
      ),

    maxHorizontalChange:
      clamp(
        horizontalBase *
          anatomyFactor *
          widthFactor,
        0.008,
        0.021
      ),

    maxVerticalChange:
      clamp(
        verticalBase *
          anatomyFactor,
        0.010,
        0.024
      ),

    maxProjectionChange:
      clamp(
        projectionBase *
          anatomyFactor,
        0.009,
        0.022
      )
  };
}

    case "chin-filler":
    case "chin-implant": {
      const chinProjection =
        Number(
          measurements.chinProjection
        ) || 0.08;

      const projectionFactor =
        clamp(
          0.08 / chinProjection,
          0.8,
          1.18
        );

      return {
        ...base,

        strengthMultiplier:
          clamp(
            levelStrength *
              projectionFactor /
              projectionResistance,
            0.75,
            1.2
          ),

        maxHorizontalChange:
          0.025,

        maxVerticalChange:
          0.025,

        maxProjectionChange:
          0.03
      };
    }

    case "jawline-filler":
      return {
        ...base,

        strengthMultiplier:
          clamp(
            levelStrength *
              skinMobility,
            0.75,
            1.18
          ),

        maxHorizontalChange:
          0.035,

        maxVerticalChange:
          0.018
      };

    case "cheek-filler":
    case "cheek-implants":
      return {
        ...base,

        strengthMultiplier:
          clamp(
            levelStrength *
              elasticity,
            0.75,
            1.18
          ),

        maxHorizontalChange:
          0.028,

        maxVerticalChange:
          0.025,

        maxProjectionChange:
          0.028
      };

    default:
      return base;
  }
}
