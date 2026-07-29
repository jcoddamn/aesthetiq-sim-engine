// ==========================================================
// AESTHETIQ
// LIP FILLER STYLE PROFILES
// File: js/lipStyleProfiles.js
// ==========================================================

const LIP_STYLE_PROFILES = {
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
    cornerLift: 1,

    description:
      "Balanced upper- and lower-lip fullness with moderate projection."
  },

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
    cornerLift: 0.85,

    description:
      "A subtle result focused on hydration, softness and minimal enlargement."
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
    cornerLift: 0.72,

    description:
      "More vertical height and Cupid’s-bow definition with controlled projection."
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
    cornerLift: 0.8,

    description:
      "Central upper-lip fullness with a more pronounced Cupid’s bow."
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
    cornerLift: 0.8,

    description:
      "Soft, rounded volume with fuller central projection."
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

    keyholeStrength: 1,

    description:
      "Central fullness designed to preserve a subtle opening between the lips."
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
    cornerLift: 0.92,

    description:
      "Smooth, symmetrical contour with moderate fullness and stronger border definition."
  }
};

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

export function getLipStyleOptions() {
  return Object.values(
    LIP_STYLE_PROFILES
  ).map((profile) => ({
    id: profile.id,
    name: profile.name,
    description:
      profile.description
  }));
}
