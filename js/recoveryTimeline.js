// =========================================================
// AESTHETIQ — RECOVERY / RESULT TIMELINE
// File: js/recoveryTimeline.js
// =========================================================
//
// Timeline stages are educational visualization states.
// They do not predict an individual's healing time or
// clinical outcome. Recovery varies by procedure, technique,
// anatomy, health, aftercare, and treating clinician.
// =========================================================

const FILLER_PROCEDURES = new Set([
  "lip-filler",
  "cheek-filler",
  "chin-filler",
  "jawline-filler",
  "under-eye-filler",
  "temple-filler"
]);

const NEUROMODULATOR_PROCEDURES = new Set([
  "forehead-neuromodulator",
  "glabella-neuromodulator",
  "crows-feet-neuromodulator",
  "lip-flip"
]);

const SKIN_PROCEDURES = new Set([
  "chemical-peel",
  "laser-resurfacing",
  "microneedling",
  "rf-microneedling",
  "ipl",
  "co2-laser"
]);

const SMILE_PROCEDURES = new Set([
  "veneers",
  "dental-bonding",
  "teeth-whitening",
  "gum-contouring",
  "smile-makeover"
]);

const SURGICAL_FACE_PROCEDURES = new Set([
  "rhinoplasty",
  "revision-rhinoplasty",
  "chin-implant",
  "cheek-implants",
  "buccal-fat-removal",
  "facelift",
  "mini-facelift",
  "brow-lift",
  "upper-blepharoplasty",
  "lower-blepharoplasty",
  "lip-lift"
]);

const VOLUME_PROCEDURES = new Set([
  "facial-fat-transfer"
]);

const BROW_PROCEDURES = new Set([
  "eyebrow-transplant"
]);

function stage(
  id,
  label,
  timing,
  resultProgress,
  note
) {
  return {
    id,
    label,
    timing,
    resultProgress,
    note
  };
}

const TIMELINES = {
  filler: [
    stage(
      "immediate",
      "Immediate",
      "Same day",
      0.78,
      "Early appearance may include temporary swelling or tenderness that this preview does not attempt to reproduce."
    ),
    stage(
      "early",
      "Early Recovery",
      "First several days",
      0.88,
      "Early swelling and tissue response can affect appearance while the area begins to settle."
    ),
    stage(
      "settling",
      "Settling",
      "About 2–4 weeks",
      0.96,
      "The preview moves closer to the intended settled contour as early tissue changes resolve."
    ),
    stage(
      "final",
      "Settled Preview",
      "After settling",
      1,
      "Educational preview of the selected product, goal, and intensity after early settling."
    )
  ],

  neuromodulator: [
    stage(
      "immediate",
      "Immediate",
      "Same day",
      0.05,
      "Neuromodulator effects are not expected to appear fully immediately after treatment."
    ),
    stage(
      "early",
      "Early Effect",
      "First several days",
      0.5,
      "Visible muscle relaxation generally develops gradually rather than all at once."
    ),
    stage(
      "settling",
      "Settling",
      "About 1–2 weeks",
      0.88,
      "The educational preview approaches the selected line-softening intensity."
    ),
    stage(
      "final",
      "Established Preview",
      "After onset",
      1,
      "Educational representation of the selected preview intensity after the effect has developed."
    )
  ],

  surgery: [
    stage(
      "immediate",
      "Immediate",
      "Early postoperative period",
      0.42,
      "Swelling, bruising, dressings, and other early postoperative changes are not fully simulated."
    ),
    stage(
      "early",
      "Early Recovery",
      "First few weeks",
      0.62,
      "The intended contour may become easier to see as early swelling and bruising improve."
    ),
    stage(
      "settling",
      "Settling",
      "Following months",
      0.86,
      "The preview moves toward the intended longer-term contour as tissues continue to settle."
    ),
    stage(
      "final",
      "Long-Term Preview",
      "After maturation",
      1,
      "Educational preview of the intended longer-term contour, not a prediction of surgical outcome."
    )
  ],

  skin: [
    stage(
      "immediate",
      "Immediate",
      "Same day",
      0.35,
      "Redness, peeling, crusting, swelling, or irritation can vary by treatment and are not fully reproduced."
    ),
    stage(
      "early",
      "Early Recovery",
      "First days to weeks",
      0.58,
      "Early healing may temporarily change tone and texture before improvement becomes easier to evaluate."
    ),
    stage(
      "settling",
      "Developing Result",
      "Following weeks",
      0.82,
      "The educational preview gradually approaches the selected skin result."
    ),
    stage(
      "final",
      "Later Preview",
      "After recovery",
      1,
      "Educational representation of the selected skin-treatment result after recovery."
    )
  ],

  volume: [
    stage(
      "immediate",
      "Immediate",
      "Early recovery",
      0.55,
      "Early swelling can obscure contour and is not fully simulated."
    ),
    stage(
      "early",
      "Early Recovery",
      "First few weeks",
      0.7,
      "Volume and contour can change during early healing."
    ),
    stage(
      "settling",
      "Settling",
      "Following months",
      0.88,
      "The preview moves toward a more settled-looking contour."
    ),
    stage(
      "final",
      "Long-Term Preview",
      "After settling",
      1,
      "Educational longer-term preview; retained volume and healing vary by individual."
    )
  ],

  smile: [
    stage(
      "immediate",
      "Initial Preview",
      "Initial appearance",
      0.82,
      "An initial educational appearance before the final preview."
    ),
    stage(
      "early",
      "Adjustment",
      "Early period",
      0.92,
      "Represents an early transition toward the selected smile result."
    ),
    stage(
      "settling",
      "Settling",
      "After adjustment",
      0.98,
      "The preview approaches the intended finished appearance."
    ),
    stage(
      "final",
      "Final Preview",
      "Finished appearance",
      1,
      "Educational representation of the selected smile result."
    )
  ],

  brow: [
    stage(
      "immediate",
      "Immediate",
      "Early recovery",
      0.2,
      "Transplanted-hair procedures have a healing and growth process that cannot be represented as an instant final result."
    ),
    stage(
      "early",
      "Early Recovery",
      "First weeks",
      0.3,
      "Early healing does not represent mature density or growth."
    ),
    stage(
      "settling",
      "Growth Phase",
      "Following months",
      0.7,
      "The educational preview begins moving toward the intended mature appearance."
    ),
    stage(
      "final",
      "Mature Preview",
      "Later growth",
      1,
      "Educational mature-result preview; actual growth and density vary."
    )
  ],

  generic: [
    stage(
      "immediate",
      "Immediate",
      "Initial stage",
      0.55,
      "Early appearance may differ from the intended final result."
    ),
    stage(
      "early",
      "Early Recovery",
      "Early healing",
      0.7,
      "Educational early-recovery stage."
    ),
    stage(
      "settling",
      "Settling",
      "As recovery progresses",
      0.88,
      "Educational settling-stage preview."
    ),
    stage(
      "final",
      "Final Preview",
      "After settling",
      1,
      "Educational final-stage preview."
    )
  ]
};

export function getRecoveryTimelineType(
  procedureId
) {
  if (
    FILLER_PROCEDURES.has(procedureId)
  ) {
    return "filler";
  }

  if (
    NEUROMODULATOR_PROCEDURES.has(
      procedureId
    )
  ) {
    return "neuromodulator";
  }

  if (
    SURGICAL_FACE_PROCEDURES.has(
      procedureId
    )
  ) {
    return "surgery";
  }

  if (
    SKIN_PROCEDURES.has(procedureId)
  ) {
    return "skin";
  }

  if (
    VOLUME_PROCEDURES.has(procedureId)
  ) {
    return "volume";
  }

  if (
    SMILE_PROCEDURES.has(procedureId)
  ) {
    return "smile";
  }

  if (
    BROW_PROCEDURES.has(procedureId)
  ) {
    return "brow";
  }

  return "generic";
}

export function getRecoveryTimeline(
  procedureId
) {
  const type =
    getRecoveryTimelineType(
      procedureId
    );

  return TIMELINES[type].map(
    item => ({ ...item })
  );
}

export function getRecoveryStage(
  procedureId,
  stageId = "final"
) {
  const timeline =
    getRecoveryTimeline(
      procedureId
    );

  return (
    timeline.find(
      item => item.id === stageId
    ) ||
    timeline[
      timeline.length - 1
    ]
  );
}
