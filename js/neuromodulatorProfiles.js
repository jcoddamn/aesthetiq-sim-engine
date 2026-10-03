// =========================================================
// AESTHETIQ — NEUROMODULATOR PREVIEW PROFILES
// File: js/neuromodulatorProfiles.js
// =========================================================
//
// These are conservative educational preview parameters.
// They are NOT dose conversions, unit equivalence,
// injection guidance, duration guarantees, or predictions
// of an individual clinical result.
// =========================================================

export const NEUROMODULATOR_PRODUCTS = {
  botox: {
    id: "botox",
    name: "Botox Cosmetic",
    visual: {
      softening: 1,
      blend: 1,
      movementRetention: 1
    }
  },

  dysport: {
    id: "dysport",
    name: "Dysport",
    visual: {
      softening: 1,
      blend: 1.03,
      movementRetention: 1
    }
  },

  xeomin: {
    id: "xeomin",
    name: "Xeomin",
    visual: {
      softening: 0.99,
      blend: 0.99,
      movementRetention: 1.01
    }
  },

  jeuveau: {
    id: "jeuveau",
    name: "Jeuveau",
    visual: {
      softening: 1.01,
      blend: 1,
      movementRetention: 1
    }
  },

  daxxify: {
    id: "daxxify",
    name: "Daxxify",
    visual: {
      softening: 1.02,
      blend: 1,
      movementRetention: 0.99
    }
  }
};

export function getNeuromodulatorProduct(
  productId = "botox"
) {
  const normalized =
    String(productId || "botox")
      .trim()
      .toLowerCase();

  return (
    NEUROMODULATOR_PRODUCTS[
      normalized
    ] ||
    NEUROMODULATOR_PRODUCTS.botox
  );
}

export function getNeuromodulatorVisualProfile(
  productId = "botox"
) {
  const product =
    getNeuromodulatorProduct(
      productId
    );

  return {
    ...product.visual,
    productId: product.id
  };
}

export function getNeuromodulatorProducts() {
  return Object.values(
    NEUROMODULATOR_PRODUCTS
  );
}
