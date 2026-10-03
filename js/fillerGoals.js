// =========================================================
// AESTHETIQ — FILLER VISUAL GOALS
// File: js/fillerGoals.js
// =========================================================
//
// These profiles control educational preview emphasis only.
// They are not injection plans, dosing guidance, placement
// instructions, or predictions of clinical outcomes.
// =========================================================

export const FILLER_GOALS = {
  "cheek-filler": [
    {
      id: "balanced",
      name: "Balanced Cheek",
      detail:
        "Evenly emphasize cheek fullness and contour.",
      visual: {
        volume: 1,
        projection: 1,
        lift: 1,
        definition: 1
      }
    },
    {
      id: "soft-volume",
      name: "Soft Volume",
      detail:
        "Emphasize gentle fullness with softer contour change.",
      visual: {
        volume: 1.1,
        projection: 0.94,
        lift: 0.94,
        definition: 0.94
      }
    },
    {
      id: "contour",
      name: "Cheek Contour",
      detail:
        "Emphasize cheek definition with controlled fullness.",
      visual: {
        volume: 0.96,
        projection: 1.06,
        lift: 1.02,
        definition: 1.1
      }
    },
    {
      id: "lifted-look",
      name: "Lifted Look",
      detail:
        "Emphasize a slightly higher-looking cheek contour.",
      visual: {
        volume: 0.98,
        projection: 1.02,
        lift: 1.12,
        definition: 1.04
      }
    }
  ],

  "chin-filler": [
    {
      id: "balanced",
      name: "Balanced Chin",
      detail:
        "Balance chin size, contour and lower-face proportion.",
      visual: {
        volume: 1,
        projection: 1,
        length: 1,
        definition: 1
      }
    },
    {
      id: "projection",
      name: "Projection Emphasis",
      detail:
        "Emphasize a more projected-looking chin profile.",
      visual: {
        volume: 1,
        projection: 1.12,
        length: 0.94,
        definition: 1.04
      }
    },
    {
      id: "length",
      name: "Length Emphasis",
      detail:
        "Emphasize slightly greater vertical chin length.",
      visual: {
        volume: 0.98,
        projection: 0.96,
        length: 1.14,
        definition: 1.02
      }
    },
    {
      id: "definition",
      name: "Definition Emphasis",
      detail:
        "Emphasize a cleaner chin outline with restrained size change.",
      visual: {
        volume: 0.94,
        projection: 1.02,
        length: 1,
        definition: 1.12
      }
    }
  ],

  "jawline-filler": [
    {
      id: "balanced",
      name: "Balanced Jawline",
      detail:
        "Evenly emphasize jawline definition and lower-face balance.",
      visual: {
        definition: 1,
        angle: 1,
        chinTransition: 1
      }
    },
    {
      id: "jaw-angle",
      name: "Jaw-Angle Emphasis",
      detail:
        "Emphasize definition toward the outer jaw angles.",
      visual: {
        definition: 1.08,
        angle: 1.14,
        chinTransition: 0.9
      }
    },
    {
      id: "full-jaw",
      name: "Full Jaw Definition",
      detail:
        "Carry definition more evenly from the jaw angles toward the chin.",
      visual: {
        definition: 1.08,
        angle: 1.02,
        chinTransition: 1.12
      }
    },
    {
      id: "subtle-definition",
      name: "Subtle Definition",
      detail:
        "Use a softer lower-face contour change.",
      visual: {
        definition: 0.9,
        angle: 0.94,
        chinTransition: 0.96
      }
    }
  ],

  "under-eye-filler": [
    {
      id: "balanced",
      name: "Balanced Under-Eye",
      detail:
        "Balance hollow softening and the lid-cheek transition.",
      visual: {
        volume: 1,
        blend: 1,
        softness: 1
      }
    },
    {
      id: "hollow-softening",
      name: "Hollow Softening",
      detail:
        "Emphasize reduction in the appearance of under-eye hollowing.",
      visual: {
        volume: 1.08,
        blend: 0.98,
        softness: 1
      }
    },
    {
      id: "lid-cheek-blend",
      name: "Lid-Cheek Blend",
      detail:
        "Emphasize a smoother-looking transition into the upper cheek.",
      visual: {
        volume: 0.96,
        blend: 1.12,
        softness: 1.04
      }
    }
  ],

  "temple-filler": [
    {
      id: "balanced",
      name: "Balanced Temple",
      detail:
        "Use a balanced restoration preview.",
      visual: {
        volume: 1,
        blend: 1,
        definition: 1
      }
    },
    {
      id: "soft-restoration",
      name: "Soft Restoration",
      detail:
        "Emphasize gentle fullness and smooth blending.",
      visual: {
        volume: 1.06,
        blend: 1.1,
        definition: 0.94
      }
    },
    {
      id: "contour-balance",
      name: "Contour Balance",
      detail:
        "Emphasize the transition between the temple and cheek contour.",
      visual: {
        volume: 0.98,
        blend: 1.04,
        definition: 1.08
      }
    }
  ]
};

export function getFillerGoalsForProcedure(
  procedureId
) {
  return FILLER_GOALS[procedureId] || [];
}

export function getFillerGoal(
  procedureId,
  goalId = "balanced"
) {
  const goals =
    getFillerGoalsForProcedure(
      procedureId
    );

  return (
    goals.find(
      goal => goal.id === goalId
    ) ||
    goals.find(
      goal => goal.id === "balanced"
    ) || {
      id: "balanced",
      name: "Balanced",
      detail: "Balanced educational preview.",
      visual: {}
    }
  );
}

export function getFillerGoalVisualProfile(
  procedureId,
  goalId = "balanced"
) {
  return {
    ...getFillerGoal(
      procedureId,
      goalId
    ).visual
  };
}
