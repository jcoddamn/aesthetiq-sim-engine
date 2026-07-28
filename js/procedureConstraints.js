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

      const lipSizeFactor =
        clamp(
          0.03 / lipHeight,
          0.82,
          1.15
        );

      return {
        ...base,

        strengthMultiplier:
          clamp(
            levelStrength *
              lipSizeFactor *
              elasticity /
              projectionResistance,
            0.7,
            1.2
          ),

        maxHorizontalChange:
          0.018,

        maxVerticalChange:
          0.022,

        maxProjectionChange:
          0.02
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
