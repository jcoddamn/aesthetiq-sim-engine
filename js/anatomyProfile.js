import {
  buildFaceMeasurements
} from "./faceMeasurements.js";

import {
  calculateFacialSymmetry
} from "./facialSymmetry.js";

// =========================================================
// AESTHETIQ ANATOMY PROFILE
// =========================================================

export function buildAnatomyProfile(
  captures
) {

  const measurements =
    buildFaceMeasurements(
      captures
    );

  const symmetry =
    calculateFacialSymmetry(
      captures.straight.landmarks
    );

  const lipFactor =
    Math.min(
      1.2,
      Math.max(
        0.85,
        measurements.lipHeight / 0.03
      )
    );

  const projectionFactor =
    Math.min(
      1.2,
      Math.max(
        0.85,
        measurements.lipProjection / 0.055
      )
    );

  const chinFactor =
    Math.min(
      1.2,
      Math.max(
        0.85,
        measurements.chinProjection / 0.08
      )
    );

  return {

    measurements,

    symmetry,

    anatomyStrength:
      lipFactor,

    projectionStrength:
      projectionFactor,

    chinStrength:
      chinFactor,

    symmetryStrength:
      symmetry.symmetryScore

  };

}
