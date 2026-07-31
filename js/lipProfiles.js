// =========================================================
// AESTHETIQ — LIP FILLER PROFILES
// File: js/lipProfiles.js
// =========================================================

export const LIP_PROFILES = {
  natural: {
    id: "natural",
    name: "Natural Enhancement",

    cupidBow: 0.2,
    upperVolume: 0.3,
    lowerVolume: 0.35,
    border: 0.15,
    horizontalVolume: 0.18,
    centralTubercle: 0.18,
    cornerLift: 0.03
  },

  balanced: {
    id: "balanced",
    name: "Balanced Volume",

    cupidBow: 0.4,
    upperVolume: 0.55,
    lowerVolume: 0.6,
    border: 0.3,
    horizontalVolume: 0.34,
    centralTubercle: 0.36,
    cornerLift: 0.05
  },

  enhanced: {
    id: "enhanced",
    name: "Enhanced Volume",

    cupidBow: 0.65,
    upperVolume: 0.9,
    lowerVolume: 0.95,
    border: 0.45,
    horizontalVolume: 0.52,
    centralTubercle: 0.58,
    cornerLift: 0.08
  }
};

// ---------------------------------------------------------
// FUTURE LIP STYLES
// ---------------------------------------------------------

export const LIP_STYLE_PROFILES = {
  hydration: {
    id: "hydration",
    name: "Natural Hydration",

    upperVolume: 0.48,
    lowerVolume: 0.52,

    verticalLift: 0.55,
    horizontalVolume: 0.5,
    projection: 0.35,

    cupidBow: 0.95,
    centralTubercle: 0.55,
    borderDefinition: 0.72,
    cornerLift: 0.85
  },

  classic: {
    id: "classic",
    name: "Classic Volume",

    upperVolume: 1,
    lowerVolume: 1,

    verticalLift: 1,
    horizontalVolume: 1,
    projection: 1,

    cupidBow: 1,
    centralTubercle: 1,
    borderDefinition: 1,
    cornerLift: 1
  },

  russian: {
    id: "russian",
    name: "Russian Lips",

    upperVolume: 1.18,
    lowerVolume: 0.88,

    verticalLift: 1.32,
    horizontalVolume: 0.68,
    projection: 0.66,

    cupidBow: 1.38,
    centralTubercle: 1.18,
    borderDefinition: 1.2,
    cornerLift: 0.72
  },

  heart: {
    id: "heart",
    name: "Heart Lips",

    upperVolume: 1.16,
    lowerVolume: 0.92,

    verticalLift: 1.12,
    horizontalVolume: 0.78,
    projection: 0.92,

    cupidBow: 1.5,
    centralTubercle: 1.35,
    borderDefinition: 1.1,
    cornerLift: 0.8
  },

  pillow: {
    id: "pillow",
    name: "Pillow Lips",

    upperVolume: 1.12,
    lowerVolume: 1.22,

    verticalLift: 0.92,
    horizontalVolume: 1.08,
    projection: 1.18,

    cupidBow: 0.88,
    centralTubercle: 1.08,
    borderDefinition: 0.82,
    cornerLift: 0.8
  },

  keyhole: {
    id: "keyhole",
    name: "Keyhole Lips",

    upperVolume: 1.04,
    lowerVolume: 1.08,

    verticalLift: 1.02,
    horizontalVolume: 0.82,
    projection: 1.02,

    cupidBow: 1.18,
    centralTubercle: 1.28,
    borderDefinition: 1.02,
    cornerLift: 0.76,

    keyholeStrength: 1
  },

  glossy: {
    id: "glossy",
    name: "Glossy Contour",

    upperVolume: 1.02,
    lowerVolume: 1.08,

    verticalLift: 0.94,
    horizontalVolume: 1,
    projection: 1.06,

    cupidBow: 0.98,
    centralTubercle: 1.05,
    borderDefinition: 1.24,
    cornerLift: 0.92
  }
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

export function getLipIntensityProfile(level = "balanced") {
  return (
    LIP_PROFILES[level] ||
    LIP_PROFILES.balanced
  );
}

export function getLipStyleProfile(
  style = "classic"
) {
  const normalizedStyle =
    String(style || "classic")
      .trim()
      .toLowerCase();

  return (
    LIP_STYLE_PROFILES[
      normalizedStyle
    ] ||
    LIP_STYLE_PROFILES.classic
  );
}

export function combineLipProfiles(
  intensityLevel = "balanced",
  style = "classic"
) {
  const intensity =
    getLipIntensityProfile(
      intensityLevel
    );

  const styleProfile =
    getLipStyleProfile(style);

  return {
    cupidBow:
      intensity.cupidBow *
      styleProfile.cupidBow,

    upperVolume:
      intensity.upperVolume *
      styleProfile.upperVolume,

    lowerVolume:
      intensity.lowerVolume *
      styleProfile.lowerVolume,

    border:
      intensity.border *
      styleProfile.borderDefinition,

    horizontalVolume:
      intensity.horizontalVolume *
      styleProfile.horizontalVolume,

    centralTubercle:
      intensity.centralTubercle *
      styleProfile.centralTubercle,

    cornerLift:
      intensity.cornerLift *
      styleProfile.cornerLift,

    verticalLift:
      styleProfile.verticalLift,

    projection:
      styleProfile.projection
  };
}

export function getAvailableLipStyles() {
  return Object.values(
    LIP_STYLE_PROFILES
  );
}
