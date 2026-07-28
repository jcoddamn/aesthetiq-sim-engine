import {
  buildFaceMeasurements
} from "./faceMeasurements.js";

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

  const symmetryFactor =
    1;

  return {

    measurements,

    anatomyStrength:
      lipFactor,

    projectionStrength:
      projectionFactor,

    chinStrength:
      chinFactor,

    symmetryStrength:
      symmetryFactor

  };

}
