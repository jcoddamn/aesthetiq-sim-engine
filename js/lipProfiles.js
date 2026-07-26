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
  "natural-enhancement": {
    id: "natural-enhancement",
    name: "Natural Enhancement",

    cupidBow: 0.22,
    upperVolume: 0.32,
    lowerVolume: 0.38,
    border: 0.16,
    horizontalVolume: 0.18,
    centralTubercle: 0.2,
    cornerLift: 0.03
  },

  "classic-volume": {
    id: "classic-volume",
    name: "Classic Volume",

    cupidBow: 0.42,
    upperVolume: 0.58,
    lowerVolume: 0.64,
    border: 0.3,
    horizontalVolume: 0.36,
    centralTubercle: 0.38,
    cornerLift: 0.05
  },

  "defined-border": {
    id: "defined-border",
    name: "Defined Border",

    cupidBow: 0.48,
    upperVolume: 0.42,
    lowerVolume: 0.46,
    border: 0.62,
    horizontalVolume: 0.2,
    centralTubercle: 0.28,
    cornerLift: 0.04
  },

  "heart-shape": {
    id: "heart-shape",
    name: "Heart Shape",

    cupidBow: 0.78,
    upperVolume: 0.66,
    lowerVolume: 0.56,
    border: 0.34,
    horizontalVolume: 0.26,
    centralTubercle: 0.58,
    cornerLift: 0.1
  },

  "russian-style": {
    id: "russian-style",
    name: "Russian Style",

    cupidBow: 0.95,
    upperVolume: 0.78,
    lowerVolume: 0.34,
    border: 0.58,
    horizontalVolume: 0.14,
    centralTubercle: 0.7,
    cornerLift: 0.02
  },

  hydration: {
    id: "hydration",
    name: "Hydration",

    cupidBow: 0.12,
    upperVolume: 0.18,
    lowerVolume: 0.22,
    border: 0.12,
    horizontalVolume: 0.08,
    centralTubercle: 0.12,
    cornerLift: 0.02
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
  style = "classic-volume"
) {
  return (
    LIP_STYLE_PROFILES[style] ||
    LIP_STYLE_PROFILES["classic-volume"]
  );
}

export function combineLipProfiles(
  intensityLevel = "balanced",
  style = "classic-volume"
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
      styleProfile.border,

    horizontalVolume:
      intensity.horizontalVolume *
      styleProfile.horizontalVolume,

    centralTubercle:
      intensity.centralTubercle *
      styleProfile.centralTubercle,

    cornerLift:
      intensity.cornerLift *
      styleProfile.cornerLift
  };
}

export function getAvailableLipStyles() {
  return Object.values(
    LIP_STYLE_PROFILES
  );
}
