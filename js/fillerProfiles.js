// =========================================================
// AESTHETIQ — FILLER PRODUCT PROFILES
// File: js/fillerProfiles.js
// =========================================================
//
// Product eligibility follows current U.S. manufacturer
// treatment-area information.
//
// The visual multipliers below are AesthetIQ preview
// parameters. They are intentionally conservative and are
// NOT clinical equivalence claims, dosing guidance, or a
// prediction of an individual patient's result.
// =========================================================

export const FILLER_PRODUCTS = {
  provider: {
    id: "provider",
    brand: "Provider selected",
    name: "Provider Will Decide",
    procedures: [
      "lip-filler",
      "cheek-filler",
      "chin-filler",
      "jawline-filler",
      "under-eye-filler",
      "temple-filler"
    ],
    visual: {
      volume: 1,
      projection: 1,
      spread: 1,
      definition: 1,
      flexibility: 1
    }
  },

  "juvederm-ultra": {
    id: "juvederm-ultra",
    brand: "Juvéderm",
    name: "Juvéderm Ultra XC",
    procedures: ["lip-filler"],
    visual: {
      volume: 1.08,
      projection: 1.06,
      spread: 1.03,
      definition: 1,
      flexibility: 0.98
    }
  },

  volbella: {
    id: "volbella",
    brand: "Juvéderm",
    name: "Juvéderm Volbella XC",
    procedures: [
      "lip-filler",
      "under-eye-filler"
    ],
    visual: {
      volume: 0.88,
      projection: 0.86,
      spread: 0.94,
      definition: 1.03,
      flexibility: 1.08
    }
  },

  voluma: {
    id: "voluma",
    brand: "Juvéderm",
    name: "Juvéderm Voluma XC",
    procedures: [
      "cheek-filler",
      "chin-filler",
      "temple-filler"
    ],
    visual: {
      volume: 1.06,
      projection: 1.1,
      spread: 0.94,
      definition: 1.05,
      flexibility: 0.94
    }
  },

  volux: {
    id: "volux",
    brand: "Juvéderm",
    name: "Juvéderm Volux XC",
    procedures: ["jawline-filler"],
    visual: {
      volume: 1.02,
      projection: 1.12,
      spread: 0.9,
      definition: 1.12,
      flexibility: 0.9
    }
  },

  "restylane-kysse": {
    id: "restylane-kysse",
    brand: "Restylane",
    name: "Restylane Kysse",
    procedures: ["lip-filler"],
    visual: {
      volume: 0.98,
      projection: 0.95,
      spread: 0.98,
      definition: 1.03,
      flexibility: 1.12
    }
  },

  "restylane-silk": {
    id: "restylane-silk",
    brand: "Restylane",
    name: "Restylane Silk",
    procedures: ["lip-filler"],
    visual: {
      volume: 0.86,
      projection: 0.84,
      spread: 0.92,
      definition: 1.08,
      flexibility: 1.04
    }
  },

  "restylane-lyft": {
    id: "restylane-lyft",
    brand: "Restylane",
    name: "Restylane Lyft",
    procedures: [
      "cheek-filler",
      "chin-filler"
    ],
    visual: {
      volume: 1.05,
      projection: 1.09,
      spread: 0.93,
      definition: 1.07,
      flexibility: 0.93
    }
  },

  "restylane-contour": {
    id: "restylane-contour",
    brand: "Restylane",
    name: "Restylane Contour",
    procedures: [
      "cheek-filler",
      "temple-filler"
    ],
    visual: {
      volume: 1.02,
      projection: 1.02,
      spread: 1,
      definition: 1.03,
      flexibility: 1.06
    }
  },

  "restylane-defyne": {
    id: "restylane-defyne",
    brand: "Restylane",
    name: "Restylane Defyne",
    procedures: ["chin-filler"],
    visual: {
      volume: 1,
      projection: 1.06,
      spread: 0.95,
      definition: 1.06,
      flexibility: 1.04
    }
  },

  "restylane-eyelight": {
    id: "restylane-eyelight",
    brand: "Restylane",
    name: "Restylane Eyelight",
    procedures: ["under-eye-filler"],
    visual: {
      volume: 0.9,
      projection: 0.86,
      spread: 1.04,
      definition: 0.96,
      flexibility: 1.08
    }
  },

  "belotero-balance": {
    id: "belotero-balance",
    brand: "Belotero",
    name: "Belotero Balance (+)",
    procedures: ["under-eye-filler"],
    visual: {
      volume: 0.88,
      projection: 0.84,
      spread: 1.06,
      definition: 0.95,
      flexibility: 1.1
    }
  },

  "belotero-volume": {
    id: "belotero-volume",
    brand: "Belotero",
    name: "Belotero Volume (+)",
    procedures: ["cheek-filler"],
    visual: {
      volume: 1.04,
      projection: 1.05,
      spread: 0.98,
      definition: 1.02,
      flexibility: 1
    }
  },

  "belotero-intense": {
    id: "belotero-intense",
    brand: "Belotero",
    name: "Belotero Intense (+)",
    procedures: ["lip-filler"],
    visual: {
      volume: 0.96,
      projection: 0.92,
      spread: 1,
      definition: 1.03,
      flexibility: 1.07
    }
  },

  "revanesse-lips": {
    id: "revanesse-lips",
    brand: "Revanesse",
    name: "Revanesse Lips+",
    procedures: ["lip-filler"],
    visual: {
      volume: 0.98,
      projection: 0.95,
      spread: 1,
      definition: 1,
      flexibility: 1.05
    }
  }
};

const LEGACY_FILLER_ALIASES = {
  kysse: "restylane-kysse",
  silk: "restylane-silk",
  belotero: "belotero-intense",
  revanesse: "revanesse-lips",

  // Older AesthetIQ lip choices that do not map to a
  // current U.S. lip-augmentation indication are kept
  // neutral instead of assigning an unsupported profile.
  rha2: "provider",
  rha3: "provider"
};

export function normalizeFillerProductId(
  productId = "provider"
) {
  const normalized =
    String(productId || "provider")
      .trim()
      .toLowerCase();

  return (
    LEGACY_FILLER_ALIASES[normalized] ||
    normalized
  );
}

export function getFillerProduct(
  productId = "provider"
) {
  const normalized =
    normalizeFillerProductId(productId);

  return (
    FILLER_PRODUCTS[normalized] ||
    FILLER_PRODUCTS.provider
  );
}

export function getFillerVisualProfile(
  productId = "provider",
  procedureId = ""
) {
  const product =
    getFillerProduct(productId);

  if (
    procedureId &&
    product.id !== "provider" &&
    !product.procedures.includes(
      procedureId
    )
  ) {
    return {
      ...FILLER_PRODUCTS.provider.visual,
      productId: "provider",
      requestedProductId:
        product.id,
      supportedForProcedure: false
    };
  }

  return {
    ...product.visual,
    productId: product.id,
    requestedProductId:
      product.id,
    supportedForProcedure: true
  };
}

export function getFillerProductsForProcedure(
  procedureId
) {
  return Object.values(
    FILLER_PRODUCTS
  ).filter(
    (product) =>
      product.id === "provider" ||
      product.procedures.includes(
        procedureId
      )
  );
}
