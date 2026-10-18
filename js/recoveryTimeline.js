// Keep swelling separate so the lips do not lose their shape as they heal.
// The timelines show examples. They do not predict a person's recovery.

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

const SOURCES = {
  "ruiz-lip-photos": {
    id: "ruiz-lip-photos",
    title: "Published HA lip photo examples",
    publisher: "Ruiz et al., Journal of Clinical Medicine (2024)",
    url: "https://doi.org/10.3390/jcm13195705",
    summary: "Selected Genefill examples guide contour review, not size targets. The retrieved figure captions and embedded stage labels disagree; exact stage fitting is excluded."
  },
  "rodriguez-botox-onset": {
    id: "rodriguez-botox-onset",
    title: "BOTOX early-onset comparison",
    publisher: "Rodriguez-Chavez et al., Journal of Cosmetic Dermatology (2024)",
    url: "https://doi.org/10.1111/jocd.16454",
    summary: "The onabotulinum arm reports a smaller early change at day 3 and a stronger response at day 7. Several upper-face areas were treated. Scores are not image-softening percentages."
  },
  "onabotulinum-expression-photos": {
    id: "onabotulinum-expression-photos",
    title: "Onabotulinum expression photo examples",
    publisher: "Toxins (2026)",
    url: "https://doi.org/10.3390/toxins18030145",
    summary: "Rest and frown pairs show varied crease direction and response. Combined glabellar and eye-area treatment makes these unsuitable for isolated glabellar size or timing targets."
  },
  "aad-fillers": {
    id: "aad-fillers",
    title: "Fillers: FAQs",
    publisher: "American Academy of Dermatology",
    url: "https://www.aad.org/public/cosmetic/wrinkles/fillers-faqs",
    summary: "HA fillers add volume immediately. Common temporary injection reactions often clear within 7–14 days or sooner."
  },
  "cleveland-lip-fillers": {
    id: "cleveland-lip-fillers",
    title: "Lip Fillers: What to Expect",
    publisher: "Cleveland Clinic",
    url: "https://my.clevelandclinic.org/health/treatments/22133-lip-fillers",
    summary: "Describes variable early swelling and a follow-up visit around two weeks."
  },
  "fda-kysse-patient": {
    id: "fda-kysse-patient",
    title: "Restylane Kysse patient information",
    publisher: "FDA / Galderma",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140029S021D.pdf",
    summary: "The study allowed a four-week touch-up. The leaflet explains side effects and when to contact the treating clinician."
  },
  "galderma-kysse-ifu": {
    id: "galderma-kysse-ifu",
    title: "Restylane Kysse prescribing information",
    publisher: "Galderma",
    url: "https://www.galderma.com/us/sites/default/files/2023-05/Restylane_Kysse_eIFU_USA.pdf",
    summary: "Clinical studies tracked early reactions across several time windows and found that response varied between people and products."
  },
  "botox-faq": {
    id: "botox-faq",
    title: "BOTOX Cosmetic frequently asked questions",
    publisher: "AbbVie",
    url: "https://www.botoxcosmetic.com/how-it-works/frequently-asked-questions",
    summary: "For frown lines, results may start in 1–2 days, develop fully by 30 days, and last up to four months."
  },
  "botox-prescribing": {
    id: "botox-prescribing",
    title: "BOTOX Cosmetic prescribing information",
    publisher: "AbbVie",
    url: "https://www.rxabbvie.com/pdf/botox-cosmetic_pi.pdf",
    summary: "Describes delayed onset, a roughly 3–4 month glabellar effect, and assessments at maximum frown."
  },
  "aad-neuromodulator": {
    id: "aad-neuromodulator",
    title: "Botulinum toxin therapy: FAQs",
    publisher: "American Academy of Dermatology",
    url: "https://www.aad.org/public/cosmetic/wrinkles/botulinum-toxin-faqs",
    summary: "Explains targeted muscle relaxation, possible temporary injection reactions, and the need for a qualified clinician."
  }
};

function journeyStage({
  id, label, timing, day, phase, effectProgress,
  swelling = 0, redness = 0, bruising = 0,
  note, care, contactWarning = "", sourceIds = []
}) {
  return {
    id, label, timing, day, phase,
    resultProgress: effectProgress,
    effectProgress, swelling, redness, bruising,
    note, care, contactWarning, sourceIds
  };
}

const COEFFICIENT_NOTE =
  "Effect, swelling, redness and bruising values are drawing settings from 0 to 1. Moving between checkpoints interpolates the picture, not a clinical recovery percentage. These values are not measured healing rates, probabilities or dose estimates. Bruising is an optional example and is off by default.";

const JOURNEYS = {
  "lip-filler": {
    id: "ha-lip-filler",
    procedureId: "lip-filler",
    title: "HA lip filler",
    scopeLabel: "Classic HA lip filler recovery example",
    stageLabel: "Recovery and settling",
    defaultStageId: "final",
    bruisingDefault: false,
    evidenceBasis: "The recovery windows draw on AAD, Cleveland Clinic and Restylane Kysse labeling. Published HA photos inform contour review. These references do not establish an exact outcome or identical behavior across fillers.",
    coefficientNote: COEFFICIENT_NOTE,
    sources: ["aad-fillers", "cleveland-lip-fillers", "fda-kysse-patient", "galderma-kysse-ifu", "ruiz-lip-photos"].map(id => SOURCES[id]),
    safetyInfo: {
      eligibility: "The Kysse reference labeling is for adults 22 and older. A clinician must check whether treatment is suitable.",
      common: [
        "Swelling, tenderness, redness and sometimes bruising can follow injections.",
        "These often improve within one to two weeks. Their amount and timing vary."
      ],
      contactClinician: [
        "Contact the treating clinician if injection-site reactions last beyond 14 days.",
        "Get advice for spreading redness, fever, drainage, increasing pain, recurring sores, or new symptoms weeks later."
      ],
      urgent: [
        "Get emergency help for vision changes or stroke symptoms such as face drooping, weakness or trouble speaking.",
        "Contact the treating clinician immediately for white or unusually pale skin or unusual pain during or shortly after treatment."
      ]
    },
    limits: [
      "This shows a possible shape change on your photo. Product, technique and personal response can change the outcome.",
      "It does not measure tissue volume, plan injections or recommend a product.",
      "Day 28 is a settled-result example, not a deadline for healing. Persistent symptoms need clinical advice.",
      "Recovery effects are separate from the selected lip shape. The settled view keeps the original color and texture.",
      "Later filler fading and repeat treatment are outside this 28-day example."
    ],
    stages: [
      journeyStage({
        id: "before", label: "Before", timing: "Before treatment", day: 0,
        phase: "baseline", effectProgress: 0,
        note: "Your starting photo, with no treatment or recovery changes.",
        care: "Use a clear photo with relaxed, closed lips. A photo cannot determine whether treatment is suitable.",
        sourceIds: ["cleveland-lip-fillers"]
      }),
      journeyStage({
        id: "immediate", label: "Immediately after", timing: "Same day", day: 0,
        phase: "recovery", effectProgress: 1, swelling: 0.32, redness: 0.36, bruising: 0.1,
        note: "HA filler adds volume right away. Swelling or injection marks may make the lips look fuller or less even than the settled view.",
        care: "Follow the treating clinician's aftercare instructions. This picture cannot show tenderness or assess symptoms.",
        contactWarning: "Unusual pain, white skin or vision changes need immediate medical attention.",
        sourceIds: ["aad-fillers", "fda-kysse-patient"]
      }),
      journeyStage({
        id: "early", label: "Days 1–3", timing: "Early recovery", day: 2,
        phase: "recovery", effectProgress: 1, swelling: 0.5, redness: 0.18, bruising: 0.4,
        note: "This example shows more swelling early on. The amount and timing vary, and not everyone bruises.",
        care: "Early appearance is not a reliable guide to the settled contour. Follow your clinician's advice.",
        contactWarning: "Get prompt advice for worsening pain, spreading redness or other concerning changes.",
        sourceIds: ["cleveland-lip-fillers", "galderma-kysse-ifu"]
      }),
      journeyStage({
        id: "developing", label: "Days 4–7", timing: "First week", day: 7,
        phase: "recovery", effectProgress: 1, swelling: 0.19, redness: 0.08, bruising: 0.22,
        note: "Early reactions are easing in this example. The selected lip shape stays present while the added swelling decreases.",
        care: "Recovery varies. The image should not be used to decide whether a real symptom is normal.",
        contactWarning: "Increasing pain, drainage, fever or spreading redness needs clinical advice.",
        sourceIds: ["aad-fillers", "fda-kysse-patient", "galderma-kysse-ifu"]
      }),
      journeyStage({
        id: "settling", label: "Around 2 weeks", timing: "About day 14", day: 14,
        phase: "settling", effectProgress: 1, swelling: 0.03, bruising: 0.02,
        note: "Early swelling and bruising have largely eased in this example. Many people have a clearer view of the contour around this time.",
        care: "A follow-up around two weeks can help the clinician review healing and the result.",
        contactWarning: "If injection-site reactions continue beyond 14 days, contact the treating clinician.",
        sourceIds: ["aad-fillers", "cleveland-lip-fillers", "fda-kysse-patient"]
      }),
      journeyStage({
        id: "final", label: "Settled example", timing: "Around 4 weeks", day: 28,
        phase: "settled", effectProgress: 1,
        note: "The selected contour without added swelling, redness or bruising. This is an example of a settled result, not a promise of your outcome.",
        care: "Review remaining concerns with the clinician. Any touch-up is a separate treatment and assessment.",
        contactWarning: "Persistent or new swelling, pain or lumps needs advice; do not assume it is still settling.",
        sourceIds: ["fda-kysse-patient", "galderma-kysse-ifu"]
      })
    ]
  },
  "glabella-neuromodulator": {
    id: "botox-frown-lines",
    procedureId: "glabella-neuromodulator",
    title: "BOTOX Cosmetic frown lines",
    scopeLabel: "BOTOX Cosmetic for lines between the eyebrows",
    stageLabel: "Onset and return of movement",
    defaultStageId: "final",
    bruisingDefault: false,
    evidenceBasis: "Timing comes from BOTOX Cosmetic labeling and an onabotulinum onset study. Published expression photos inform local crease rendering. These are visual examples, not measured predictions of your response.",
    coefficientNote: COEFFICIENT_NOTE,
    sources: ["botox-faq", "botox-prescribing", "aad-neuromodulator", "rodriguez-botox-onset", "onabotulinum-expression-photos"].map(id => SOURCES[id]),
    safetyInfo: {
      eligibility: "BOTOX Cosmetic frown-line labeling is for adults 18 and older. A clinician must assess the face, muscle activity and medical history.",
      common: [
        "Temporary redness, swelling, soreness or bruising can follow injections.",
        "The wrinkle-relaxing effect develops over days. It is not an instant change."
      ],
      contactClinician: [
        "Contact the treating clinician about a drooping eyelid or brow, unexpected weakness, or other symptoms that concern you.",
        "Use a clinical review, not the preview slider, to decide whether or when to repeat treatment."
      ],
      urgent: [
        "Get medical help right away for trouble breathing, swallowing or speaking. These symptoms can occur hours to weeks after injection."
      ]
    },
    limits: [
      "Compare a neutral face with a matched frown. A neutral selfie alone cannot show the effect on expression lines.",
      "The preview illustrates reduced frown creasing. It does not measure muscle strength, choose injection sites or recommend a dose.",
      "Static creases may remain. This is not an all-over skin-smoothing treatment.",
      "Day 30 shows a full-effect example. The later views illustrate a possible return of movement, not an exact wear-off date.",
      "Clinical responder rates are group results. They are not the percentage change in your face and are not used as drawing settings."
    ],
    stages: [
      journeyStage({
        id: "before", label: "Before", timing: "Before treatment", day: 0,
        phase: "baseline", effectProgress: 0,
        note: "Your starting neutral and frown photos, with no simulated treatment.",
        care: "Use the same lighting, head position and requested expression for comparisons.",
        sourceIds: ["botox-prescribing"]
      }),
      journeyStage({
        id: "immediate", label: "Immediately after", timing: "Same day", day: 0,
        phase: "recovery", effectProgress: 0, swelling: 0.08, redness: 0.12, bruising: 0.04,
        note: "The full wrinkle-relaxing effect is not immediate. This view can show temporary injection-related marks without removing the frown lines.",
        care: "Follow the treating clinician's aftercare instructions.",
        contactWarning: "Get medical help right away for trouble breathing, swallowing or speaking.",
        sourceIds: ["botox-prescribing", "aad-neuromodulator"]
      }),
      journeyStage({
        id: "early", label: "Days 1–3", timing: "Onset may begin", day: 2,
        phase: "onset", effectProgress: 0.2, swelling: 0.01, redness: 0.02, bruising: 0.12,
        note: "BOTOX Cosmetic may start to take effect in 1–2 days. This example shows a small early change, not an immediate finished result.",
        care: "Use the same requested frown when comparing photos. Onset differs between people.",
        sourceIds: ["botox-faq", "botox-prescribing"]
      }),
      journeyStage({
        id: "day-three", label: "Day 3", timing: "Early effect check", day: 3,
        phase: "onset", effectProgress: 0.25, bruising: 0.1,
        note: "An early BOTOX change can still be modest at day 3. This checkpoint keeps more of the starting frown before the stronger first-week example; individual responses vary.",
        care: "Compare the same requested expression. The drawing strength is illustrative, not a measured treatment percentage.",
        sourceIds: ["botox-prescribing", "rodriguez-botox-onset"]
      }),
      journeyStage({
        id: "developing", label: "Days 4–7", timing: "Effect developing", day: 7,
        phase: "developing", effectProgress: 0.7, bruising: 0.06,
        note: "The effect develops through the first week. The frown appears less creased in this example while natural skin texture remains.",
        care: "A matched expression is more useful for comparison than a relaxed photo alone.",
        sourceIds: ["botox-prescribing", "aad-neuromodulator", "rodriguez-botox-onset"]
      }),
      journeyStage({
        id: "settling", label: "Around 2 weeks", timing: "About day 14", day: 14,
        phase: "developing", effectProgress: 0.92,
        note: "A more developed effect is shown here. Day 14 is a useful checkpoint, not a guaranteed final result for everyone.",
        care: "Discuss unexpected changes or remaining concerns with the treating clinician.",
        contactWarning: "A new drooping brow or eyelid, or unexpected weakness, needs clinical advice.",
        sourceIds: ["botox-faq", "botox-prescribing"]
      }),
      journeyStage({
        id: "final", label: "Full-effect example", timing: "Around day 30", day: 30,
        phase: "established", effectProgress: 1,
        note: "BOTOX Cosmetic describes full results by 30 days. This view shows the selected effect on frown creasing, with any remaining static lines preserved.",
        care: "A clinician can review the result in person. The image cannot determine a dose or a treatment plan.",
        sourceIds: ["botox-faq", "botox-prescribing"]
      }),
      journeyStage({
        id: "wearing-off", label: "Around 3 months", timing: "Movement may return", day: 90,
        phase: "wearing-off", effectProgress: 0.55,
        note: "In this example, frown movement and lines are returning. Duration varies; there is no single wear-off date.",
        care: "Discuss repeat treatment with the clinician. The slider is not a treatment schedule.",
        sourceIds: ["botox-prescribing"]
      }),
      journeyStage({
        id: "later", label: "Around 4 months", timing: "Further return of movement", day: 120,
        phase: "wearing-off", effectProgress: 0.18,
        note: "The example moves further toward the starting expression. Some people still have an effect at this point.",
        care: "Use an assessment of your own result to discuss next steps with the clinician.",
        sourceIds: ["botox-prescribing"]
      })
    ]
  }
};

const HA_LIP_OPTIONS = new Set([
  "", "hyaluronic-acid", "ha", "ha-filler", "juvederm", "restylane-kysse", "rha"
]);

const HA_LIP_PRODUCTS = new Set([
  "", "provider", "hyaluronic-acid", "juvederm-ultra", "volbella",
  "restylane-kysse", "kysse", "restylane-silk", "silk",
  "belotero-intense", "belotero", "revanesse-lips", "revanesse", "rha2", "rha3"
]);

function contextIds(procedureId, context) {
  const values = typeof context === "string" ? { productId: context } : (context || {});
  const normalize = value => String(value?.id ?? value ?? "").trim().toLowerCase();
  return {
    optionId: normalize(values.optionId ?? values.option),
    productId: normalize(values.productId ?? values.product ?? (
      procedureId === "lip-filler" ? values.fillerProduct : values.neuromodulatorProduct
    ))
  };
}

export function getProcedureJourney(procedureId, context = {}) {
  const { productId, optionId } = contextIds(procedureId, context);
  const supported = procedureId === "lip-filler"
    ? HA_LIP_OPTIONS.has(optionId) && HA_LIP_PRODUCTS.has(productId)
    : procedureId === "glabella-neuromodulator"
      && ["", "botox"].includes(productId) && ["", "botox"].includes(optionId);

  if (!supported) return null;

  // Callers can edit their copy without changing the next preview.
  return JSON.parse(JSON.stringify(JOURNEYS[procedureId]));
}

const TRANSITION_NOTES = {
  "lip-filler": {
    immediate: "HA volume is already present. This example changes the early swelling and injection marks as you move through the first days.",
    early: "Temporary swelling and optional bruising ease in this example while the selected lip contour stays present.",
    developing: "The early reaction is settling in this example. The lip shape remains as the recovery effects decrease.",
    settling: "This view moves toward the settled contour. Any persistent symptoms need clinical advice; the slider cannot assess healing."
  },
  "glabella-neuromodulator": {
    immediate: "BOTOX Cosmetic may begin to take effect in 1–2 days. This is a sample transition, not an exact onset prediction.",
    early: "The effect develops during the first week. This example gradually reduces frown creasing while keeping skin texture.",
    "day-three": "The first-week effect is developing in this example. A day-3 checkpoint does not determine the size or speed of your own response.",
    developing: "This example continues to soften frown lines. Use the same requested expression to compare the change.",
    settling: "This view moves toward the full-effect example at day 30. The amount of change is not a clinical prediction.",
    final: "Frown movement and lines gradually return in this example. The duration and remaining effect vary between people.",
    "wearing-off": "This example continues toward the starting expression. Some people still have an effect at four months."
  }
};

export function getRecoveryStageAtDay(procedureId, day, context = {}) {
  const journey = getProcedureJourney(procedureId, context);
  if (!journey) return null;

  const anchors = journey.stages.filter(item => item.id !== "before");
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  const parsedDay = typeof day === "number" || (typeof day === "string" && day.trim())
    ? Number(day) : NaN;
  const selectedDay = Number.isNaN(parsedDay)
    ? journey.stages.find(item => item.id === "final").day
    : Math.max(first.day, Math.min(last.day, parsedDay));
  const exact = anchors.find(item => item.day === selectedDay);
  if (exact) return exact;

  const nextIndex = anchors.findIndex(item => item.day > selectedDay);
  const previous = anchors[nextIndex - 1];
  const next = anchors[nextIndex];
  const progress = (selectedDay - previous.day) / (next.day - previous.day);
  const result = {
    ...previous,
    id: `day-${selectedDay}`,
    label: next.phase === "wearing-off"
      ? "Return of movement" : `Days ${previous.day + 1}–${next.day}`,
    timing: `Day ${selectedDay}`,
    day: selectedDay,
    phase: next.phase === "wearing-off" ? next.phase : previous.phase,
    interpolated: true,
    note: TRANSITION_NOTES[procedureId][previous.id] || previous.note,
    care: next.care,
    contactWarning: next.contactWarning || previous.contactWarning,
    sourceIds: [...new Set([...previous.sourceIds, ...next.sourceIds])]
  };

  // Change the drawing smoothly between the saved checkpoints.
  for (const key of ["effectProgress", "swelling", "redness", "bruising"]) {
    result[key] = previous[key] + (next[key] - previous[key]) * progress;
  }
  result.resultProgress = result.effectProgress;
  return result;
}

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
  procedureId,
  context = {}
) {
  const journey = getProcedureJourney(procedureId, context);
  if (journey) return journey.stages;

  const { productId, optionId } = contextIds(procedureId, context);
  if (procedureId === "lip-filler" && [optionId, productId].some(
    value => ["fat-transfer", "fat-grafting"].includes(value)
  )) {
    return TIMELINES.volume.map(item => ({ ...item }));
  }

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
  stageId = "final",
  context = {}
) {
  const timeline =
    getRecoveryTimeline(
      procedureId,
      context
    );

  return (
    timeline.find(
      item => item.id === stageId
    ) ||
    timeline.find(
      item => item.id === "final"
    ) ||
    timeline[
      timeline.length - 1
    ]
  );
}
