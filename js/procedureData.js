export const procedures = [
  // =========================================================
  // FACE SURGERY
  // =========================================================

  {
    id: "rhinoplasty",
    name: "Rhinoplasty",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "👃",
    summary:
      "Surgery that changes the shape, size, projection, or proportions of the nose.",
    goals: [
      "Refine the nasal bridge",
      "Adjust tip shape or projection",
      "Improve facial balance",
      "Address visible asymmetry"
    ],
    recovery:
      "Swelling and bruising are common during the first one to two weeks. Subtle swelling may continue improving for several months.",
    risks: [
      "Bleeding",
      "Infection",
      "Breathing changes",
      "Asymmetry",
      "Need for revision"
    ],
    candidate:
      "Adults with realistic expectations who want to change the appearance or structure of the nose.",
    simulation: "2D Available",
    cameraProcedure: "rhinoplasty",
    featured: true
  },

  {
    id: "revision-rhinoplasty",
    name: "Revision Rhinoplasty",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "👃",
    summary:
      "A secondary nose surgery intended to address concerns remaining after an earlier rhinoplasty.",
    goals: [
      "Correct persistent asymmetry",
      "Improve nasal contour",
      "Address breathing concerns",
      "Refine a previous result"
    ],
    recovery:
      "Recovery varies depending on the amount of scar tissue and structural work required. Swelling may last longer than after a first rhinoplasty.",
    risks: [
      "Scar tissue",
      "Prolonged swelling",
      "Breathing changes",
      "Asymmetry",
      "Additional revision"
    ],
    candidate:
      "People who have fully healed from a previous rhinoplasty and continue to have functional or cosmetic concerns.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "chin-implant",
    name: "Chin Implant",
    area: "Face",
    type: "Surgical",
    category: "Facial Contouring",
    icon: "🗿",
    summary:
      "A facial implant used to increase chin projection and improve lower-face balance.",
    goals: [
      "Increase chin projection",
      "Improve side-profile balance",
      "Define the lower face",
      "Create stronger facial proportions"
    ],
    recovery:
      "Swelling and tightness are common during the first week. Most visible swelling improves over several weeks.",
    risks: [
      "Implant movement",
      "Infection",
      "Numbness",
      "Asymmetry",
      "Scarring"
    ],
    candidate:
      "Adults with a recessed or underprojected chin who want longer-lasting structural enhancement.",
    simulation: "2D Available",
    cameraProcedure: "chinImplant",
    featured: true
  },

  {
    id: "cheek-implants",
    name: "Cheek Implants",
    area: "Face",
    type: "Surgical",
    category: "Facial Contouring",
    icon: "😊",
    summary:
      "Permanent implants placed to increase cheek projection and midface definition.",
    goals: [
      "Enhance cheek projection",
      "Improve midface contour",
      "Create stronger facial definition",
      "Restore facial volume"
    ],
    recovery:
      "Swelling, tightness, and temporary changes in sensation may occur for one to two weeks.",
    risks: [
      "Implant shifting",
      "Infection",
      "Asymmetry",
      "Numbness",
      "Visible implant edges"
    ],
    candidate:
      "Adults seeking permanent cheek enhancement or increased midface definition.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "buccal-fat-removal",
    name: "Buccal Fat Removal",
    area: "Face",
    type: "Surgical",
    category: "Facial Contouring",
    icon: "🙂",
    summary:
      "Removal of selected inner-cheek fat to create a slimmer or more sculpted lower face.",
    goals: [
      "Reduce lower-cheek fullness",
      "Create cheek definition",
      "Enhance facial contour",
      "Emphasize the cheekbones"
    ],
    recovery:
      "Cheek swelling is common for one to three weeks. Final contour becomes more visible as swelling resolves.",
    risks: [
      "Over-hollowing",
      "Asymmetry",
      "Infection",
      "Nerve or duct injury",
      "Prematurely aged appearance"
    ],
    candidate:
      "Adults with persistent lower-cheek fullness and stable weight who understand that facial volume naturally decreases with age.",
    simulation: "2D Available",
    cameraProcedure: "buccalFatRemoval",
    featured: true
  },

  {
    id: "facelift",
    name: "Facelift",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "✨",
    summary:
      "Surgery designed to reposition facial tissues and reduce visible sagging in the cheeks, jawline, and lower face.",
    goals: [
      "Improve lower-face sagging",
      "Refine the jawline",
      "Reduce jowls",
      "Create a more refreshed appearance"
    ],
    recovery:
      "Bruising and swelling are common for two to four weeks. Healing and scar maturation continue for several months.",
    risks: [
      "Bleeding",
      "Infection",
      "Nerve injury",
      "Scarring",
      "Asymmetry"
    ],
    candidate:
      "Adults with facial laxity or jowling who are healthy enough for surgery and have realistic expectations.",
    simulation: "2D Available",
    cameraProcedure: "facelift",
    featured: true
  },

  {
    id: "mini-facelift",
    name: "Mini Facelift",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "✨",
    summary:
      "A more limited facial lifting procedure generally focused on early jowling and lower-face laxity.",
    goals: [
      "Improve early jowling",
      "Refine the lower face",
      "Create subtle lifting",
      "Reduce mild skin laxity"
    ],
    recovery:
      "Visible swelling and bruising may improve within one to three weeks, although healing varies by technique.",
    risks: [
      "Bleeding",
      "Infection",
      "Scarring",
      "Asymmetry",
      "Temporary numbness"
    ],
    candidate:
      "Adults with mild to moderate lower-face laxity who may not require a full facelift.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "brow-lift",
    name: "Brow Lift",
    area: "Face",
    type: "Surgical",
    category: "Eye and Brow",
    icon: "🤨",
    summary:
      "Surgery that elevates the brow position and may soften heaviness around the upper eye area.",
    goals: [
      "Raise a low brow",
      "Reduce upper-eye heaviness",
      "Improve brow symmetry",
      "Create a more alert appearance"
    ],
    recovery:
      "Swelling and bruising usually improve over one to two weeks. Numbness or tightness may last longer.",
    risks: [
      "Asymmetry",
      "Hairline changes",
      "Numbness",
      "Scarring",
      "Nerve injury"
    ],
    candidate:
      "Adults with low or uneven brows, forehead laxity, or upper-eye heaviness.",
    simulation: "2D Available",
    cameraProcedure: "browLift",
    featured: false
  },

  {
    id: "upper-blepharoplasty",
    name: "Upper Blepharoplasty",
    area: "Face",
    type: "Surgical",
    category: "Eye and Brow",
    icon: "👁️",
    summary:
      "Upper-eyelid surgery that removes or repositions selected skin and tissue.",
    goals: [
      "Reduce upper-eyelid hooding",
      "Create a clearer eyelid crease",
      "Improve eye-area balance",
      "Reduce a tired appearance"
    ],
    recovery:
      "Bruising and swelling are common for about one to two weeks. Incision lines continue fading over time.",
    risks: [
      "Dry eyes",
      "Asymmetry",
      "Scarring",
      "Difficulty closing the eyes",
      "Vision complications"
    ],
    candidate:
      "Adults with upper-eyelid skin excess or hooding who have been evaluated for eye-health concerns.",
    simulation: "2D Available",
    cameraProcedure: "upperBlepharoplasty",
    featured: true
  },

  {
    id: "lower-blepharoplasty",
    name: "Lower Blepharoplasty",
    area: "Face",
    type: "Surgical",
    category: "Eye and Brow",
    icon: "👁️",
    summary:
      "Lower-eyelid surgery used to address under-eye bags, excess skin, or uneven contour.",
    goals: [
      "Reduce under-eye bags",
      "Smooth lower-eyelid contour",
      "Improve under-eye transition",
      "Create a more rested appearance"
    ],
    recovery:
      "Swelling and bruising commonly improve within two weeks, while subtle changes may continue for several months.",
    risks: [
      "Dryness",
      "Lower-lid pulling",
      "Asymmetry",
      "Scarring",
      "Vision complications"
    ],
    candidate:
      "Adults with persistent under-eye bags or lower-eyelid skin excess.",
    simulation: "2D Available",
    cameraProcedure: "lowerBlepharoplasty",
    featured: true
  },

  {
    id: "neck-lift",
    name: "Neck Lift",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "🦢",
    summary:
      "Surgery that improves loose neck skin, neck bands, and contour beneath the chin.",
    goals: [
      "Improve neck definition",
      "Reduce loose skin",
      "Address visible neck bands",
      "Create a smoother jaw-to-neck transition"
    ],
    recovery:
      "Swelling, tightness, and bruising may last two to four weeks. Final definition continues improving with healing.",
    risks: [
      "Bleeding",
      "Infection",
      "Nerve injury",
      "Scarring",
      "Contour irregularity"
    ],
    candidate:
      "Adults with neck laxity, visible neck bands, or reduced jawline definition.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "lip-lift",
    name: "Lip Lift",
    area: "Face",
    type: "Surgical",
    category: "Lip Procedures",
    icon: "👄",
    summary:
      "Surgery that shortens the distance between the nose and upper lip to increase visible upper-lip height.",
    goals: [
      "Increase visible upper-lip height",
      "Show more upper teeth",
      "Improve lip proportions",
      "Create a more defined lip shape"
    ],
    recovery:
      "Swelling is common during the first one to two weeks. Scar appearance continues improving over several months.",
    risks: [
      "Visible scarring",
      "Asymmetry",
      "Infection",
      "Numbness",
      "Overcorrection"
    ],
    candidate:
      "Adults with a long upper-lip distance who want a permanent structural change rather than filler alone.",
    simulation: "2D Available",
    cameraProcedure: "lipLift",
    featured: false
  },

  {
    id: "otoplasty",
    name: "Otoplasty",
    area: "Face",
    type: "Surgical",
    category: "Face Surgery",
    icon: "👂",
    summary:
      "Ear surgery used to adjust prominence, position, shape, or symmetry.",
    goals: [
      "Reduce ear prominence",
      "Improve ear symmetry",
      "Adjust ear shape",
      "Position ears closer to the head"
    ],
    recovery:
      "Tenderness and swelling usually improve over one to two weeks. A protective headband may be recommended.",
    risks: [
      "Asymmetry",
      "Scarring",
      "Infection",
      "Cartilage changes",
      "Recurrence"
    ],
    candidate:
      "Adults or children with fully developed ears who want to change ear position or shape.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "facial-fat-transfer",
    name: "Facial Fat Transfer",
    area: "Face",
    type: "Surgical",
    category: "Facial Contouring",
    icon: "💧",
    summary:
      "A procedure that transfers a person's own fat into selected areas of the face to restore or enhance volume.",
    goals: [
      "Restore facial volume",
      "Improve cheek fullness",
      "Soften facial hollows",
      "Enhance facial contour"
    ],
    recovery:
      "Swelling and bruising may affect both the face and the fat-donor area for one to three weeks.",
    risks: [
      "Uneven fat survival",
      "Asymmetry",
      "Lumps",
      "Infection",
      "Fat necrosis"
    ],
    candidate:
      "Adults seeking facial volume enhancement who have enough donor fat and understand that some transferred fat may be reabsorbed.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  // =========================================================
  // INJECTABLES
  // =========================================================

  {
    id: "lip-filler",
    name: "Lip Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "👄",
    summary:
      "Injectable treatment used to temporarily increase lip volume, shape, balance, or definition.",
    goals: [
      "Increase lip volume",
      "Improve lip symmetry",
      "Define the lip border",
      "Adjust upper-to-lower lip balance"
    ],
    recovery:
      "Swelling, tenderness, and bruising are common for several days. Results settle as swelling decreases.",
    risks: [
      "Bruising",
      "Swelling",
      "Lumps",
      "Asymmetry",
      "Vascular occlusion"
    ],
    candidate:
      "Adults seeking temporary lip enhancement who understand that results and product longevity vary.",
    simulation: "2D Available",
    cameraProcedure: "lipFiller",
    featured: true
  },

  {
    id: "cheek-filler",
    name: "Cheek Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "😊",
    summary:
      "Injectable filler used to temporarily enhance cheek volume, projection, or contour.",
    goals: [
      "Increase cheek projection",
      "Restore midface volume",
      "Improve facial contour",
      "Support facial proportions"
    ],
    recovery:
      "Mild swelling, tenderness, or bruising may last several days.",
    risks: [
      "Bruising",
      "Swelling",
      "Lumps",
      "Asymmetry",
      "Vascular occlusion"
    ],
    candidate:
      "Adults seeking temporary cheek enhancement or age-related volume restoration.",
    simulation: "2D Available",
    cameraProcedure: "cheekFiller",
    featured: true
  },

  {
    id: "chin-filler",
    name: "Chin Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "🗿",
    summary:
      "Injectable filler used to temporarily change chin projection, length, or contour.",
    goals: [
      "Increase chin projection",
      "Improve profile balance",
      "Refine chin shape",
      "Improve lower-face proportions"
    ],
    recovery:
      "Tenderness, swelling, or bruising may be present for several days.",
    risks: [
      "Swelling",
      "Bruising",
      "Asymmetry",
      "Lumps",
      "Vascular occlusion"
    ],
    candidate:
      "Adults who want temporary chin enhancement without placement of a permanent implant.",
    simulation: "2D Available",
    cameraProcedure: "chinFiller",
    featured: true
  },

  {
    id: "jawline-filler",
    name: "Jawline Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "📐",
    summary:
      "Injectable filler used to temporarily enhance jawline definition, angle, or symmetry.",
    goals: [
      "Define the jawline",
      "Enhance jaw angles",
      "Improve lower-face symmetry",
      "Create a stronger profile"
    ],
    recovery:
      "Swelling and tenderness usually improve over several days.",
    risks: [
      "Bruising",
      "Swelling",
      "Lumps",
      "Asymmetry",
      "Vascular occlusion"
    ],
    candidate:
      "Adults seeking temporary jawline enhancement who have appropriate skin support and realistic expectations.",
    simulation: "2D Available",
    cameraProcedure: "jawlineFiller",
    featured: true
  },

  {
    id: "under-eye-filler",
    name: "Under-eye Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "👁️",
    summary:
      "Injectable filler used in selected patients to improve under-eye hollowing and the transition into the cheek.",
    goals: [
      "Reduce visible under-eye hollowing",
      "Smooth the lid-cheek transition",
      "Create a more rested appearance",
      "Improve under-eye symmetry"
    ],
    recovery:
      "Swelling or bruising may last several days and can occasionally persist longer in the under-eye region.",
    risks: [
      "Persistent swelling",
      "Blue-gray discoloration",
      "Lumps",
      "Asymmetry",
      "Vascular complications"
    ],
    candidate:
      "Carefully selected adults with under-eye hollowing rather than prominent bags or significant skin laxity.",
    simulation: "2D Available",
    cameraProcedure: "underEyeFiller",
    featured: true
  },

  {
    id: "temple-filler",
    name: "Temple Filler",
    area: "Face",
    type: "Non-Surgical",
    category: "Injectables",
    icon: "💧",
    summary:
      "Injectable filler used to temporarily restore volume in hollow temple areas.",
    goals: [
      "Reduce temple hollowing",
      "Restore upper-face volume",
      "Improve facial balance",
      "Create smoother facial contours"
    ],
    recovery:
      "Tenderness, swelling, or bruising may last several days.",
    risks: [
      "Swelling",
      "Bruising",
      "Asymmetry",
      "Lumps",
      "Vascular complications"
    ],
    candidate:
      "Adults with visible temple hollowing who are appropriate candidates for injectable treatment.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "forehead-neuromodulator",
    name: "Forehead Neuromodulator",
    area: "Face",
    type: "Non-Surgical",
    category: "Neuromodulators",
    icon: "💉",
    summary:
      "An injectable neuromodulator treatment used to temporarily soften forehead expression lines.",
    goals: [
      "Soften forehead lines",
      "Reduce muscle movement",
      "Create a smoother appearance",
      "Maintain natural expression when appropriately dosed"
    ],
    recovery:
      "There is usually minimal downtime. Small bumps or redness may resolve within hours.",
    risks: [
      "Bruising",
      "Headache",
      "Brow heaviness",
      "Asymmetry",
      "Temporary eyelid droop"
    ],
    candidate:
      "Adults with dynamic forehead lines who want a temporary reduction in muscle movement.",
    simulation: "2D Available",
    cameraProcedure: "foreheadBotox",
    featured: true
  },

  {
    id: "glabella-neuromodulator",
    name: "Glabella Neuromodulator",
    area: "Face",
    type: "Non-Surgical",
    category: "Neuromodulators",
    icon: "💉",
    summary:
      "An injectable neuromodulator treatment used to soften vertical lines between the eyebrows.",
    goals: [
      "Reduce frown lines",
      "Soften the 11 lines",
      "Decrease strong muscle movement",
      "Create a more relaxed appearance"
    ],
    recovery:
      "Small injection marks or mild bruising may occur. Results develop gradually over several days.",
    risks: [
      "Bruising",
      "Headache",
      "Brow asymmetry",
      "Temporary eyelid droop",
      "Unwanted expression changes"
    ],
    candidate:
      "Adults with visible expression lines between the eyebrows.",
    simulation: "2D Available",
    cameraProcedure: "glabellaBotox",
    featured: true
  },

  {
    id: "crows-feet-neuromodulator",
    name: "Crow's Feet Neuromodulator",
    area: "Face",
    type: "Non-Surgical",
    category: "Neuromodulators",
    icon: "💉",
    summary:
      "An injectable neuromodulator treatment used to temporarily soften expression lines around the outer eyes.",
    goals: [
      "Reduce outer-eye lines",
      "Soften smiling wrinkles",
      "Create a smoother eye area",
      "Maintain natural expression"
    ],
    recovery:
      "Most people return to normal activities quickly. Mild redness or bruising may occur.",
    risks: [
      "Bruising",
      "Dry eye symptoms",
      "Smile asymmetry",
      "Temporary weakness",
      "Unwanted expression changes"
    ],
    candidate:
      "Adults with dynamic lines around the outer eyes.",
    simulation: "2D Available",
    cameraProcedure: "crowsFeetBotox",
    featured: false
  },

  {
    id: "lip-flip",
    name: "Lip Flip",
    area: "Face",
    type: "Non-Surgical",
    category: "Neuromodulators",
    icon: "👄",
    summary:
      "A small-dose neuromodulator treatment intended to slightly relax the upper-lip muscle and increase visible lip height.",
    goals: [
      "Increase visible upper-lip height",
      "Create subtle lip eversion",
      "Reduce a gummy smile in selected cases",
      "Enhance the lip without adding filler volume"
    ],
    recovery:
      "Downtime is usually minimal. Temporary changes in lip movement may become noticeable as the treatment takes effect.",
    risks: [
      "Difficulty using a straw",
      "Speech changes",
      "Smile asymmetry",
      "Drooling",
      "Temporary lip weakness"
    ],
    candidate:
      "Adults seeking a subtle, temporary change in upper-lip position rather than additional volume.",
    simulation: "2D Available",
    cameraProcedure: "lipFlip",
    featured: false
  },

  // =========================================================
  // SKIN
  // =========================================================

  {
    id: "chemical-peel",
    name: "Chemical Peel",
    area: "Skin",
    type: "Non-Surgical",
    category: "Skin Resurfacing",
    icon: "🧴",
    summary:
      "A controlled chemical exfoliation treatment intended to improve tone, texture, discoloration, or fine lines.",
    goals: [
      "Improve uneven tone",
      "Smooth skin texture",
      "Reduce selected discoloration",
      "Soften fine lines"
    ],
    recovery:
      "Recovery ranges from mild flaking to more significant peeling depending on peel depth.",
    risks: [
      "Irritation",
      "Pigment changes",
      "Infection",
      "Scarring",
      "Prolonged redness"
    ],
    candidate:
      "Adults seeking improvement in skin tone or texture who have been evaluated for skin type and pigment risk.",
    simulation: "2D Available",
    cameraProcedure: "chemicalPeel",
    featured: true
  },

  {
    id: "laser-resurfacing",
    name: "Laser Resurfacing",
    area: "Skin",
    type: "Non-Surgical",
    category: "Skin Resurfacing",
    icon: "⚡",
    summary:
      "A laser-based treatment used to improve skin texture, fine lines, scars, or selected pigmentation concerns.",
    goals: [
      "Smooth skin texture",
      "Reduce fine lines",
      "Improve selected scars",
      "Improve uneven pigmentation"
    ],
    recovery:
      "Redness, swelling, crusting, or peeling may last from several days to multiple weeks depending on treatment intensity.",
    risks: [
      "Burns",
      "Pigment changes",
      "Infection",
      "Scarring",
      "Prolonged redness"
    ],
    candidate:
      "Adults with appropriate skin type and treatment goals who can follow strict aftercare and sun protection.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "microneedling",
    name: "Microneedling",
    area: "Skin",
    type: "Non-Surgical",
    category: "Skin Renewal",
    icon: "✨",
    summary:
      "A treatment that creates controlled microchannels in the skin to support texture and collagen remodeling.",
    goals: [
      "Improve skin texture",
      "Reduce the appearance of selected scars",
      "Soften fine lines",
      "Support collagen remodeling"
    ],
    recovery:
      "Redness and sensitivity commonly resemble a mild sunburn for one to three days.",
    risks: [
      "Irritation",
      "Infection",
      "Pigment changes",
      "Scarring",
      "Acne flare"
    ],
    candidate:
      "Adults seeking gradual skin-texture improvement who do not have active skin infection or certain healing disorders.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "rf-microneedling",
    name: "RF Microneedling",
    area: "Skin",
    type: "Non-Surgical",
    category: "Skin Renewal",
    icon: "⚡",
    summary:
      "Microneedling combined with radiofrequency energy to support collagen remodeling and skin tightening.",
    goals: [
      "Improve skin texture",
      "Support skin tightening",
      "Reduce selected acne scars",
      "Soften fine lines"
    ],
    recovery:
      "Redness, swelling, and pinpoint marks may last several days.",
    risks: [
      "Burns",
      "Pigment changes",
      "Infection",
      "Scarring",
      "Fat loss with overly aggressive treatment"
    ],
    candidate:
      "Adults seeking texture or mild tightening improvements who have been evaluated for device and skin-type suitability.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "ipl",
    name: "IPL Photofacial",
    area: "Skin",
    type: "Non-Surgical",
    category: "Light Treatments",
    icon: "☀️",
    summary:
      "Intense pulsed light treatment used to target selected redness, brown spots, and uneven skin tone.",
    goals: [
      "Reduce selected brown spots",
      "Improve visible redness",
      "Create more even skin tone",
      "Address sun-related discoloration"
    ],
    recovery:
      "Mild redness or darkening of treated pigment may occur for several days.",
    risks: [
      "Burns",
      "Blistering",
      "Pigment changes",
      "Eye injury",
      "Incomplete improvement"
    ],
    candidate:
      "Adults with appropriate skin type and selected pigment or vascular concerns.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "co2-laser",
    name: "CO₂ Laser Resurfacing",
    area: "Skin",
    type: "Non-Surgical",
    category: "Skin Resurfacing",
    icon: "⚡",
    summary:
      "An ablative laser treatment used for deeper resurfacing of wrinkles, scars, and texture concerns.",
    goals: [
      "Improve deeper wrinkles",
      "Reduce selected scars",
      "Resurface uneven texture",
      "Support collagen remodeling"
    ],
    recovery:
      "Healing commonly involves redness, swelling, crusting, and peeling. Redness may continue for weeks or longer.",
    risks: [
      "Infection",
      "Scarring",
      "Pigment changes",
      "Prolonged redness",
      "Delayed healing"
    ],
    candidate:
      "Carefully selected adults who understand the greater downtime and aftercare associated with ablative resurfacing.",
    simulation: "Educational",
    featured: false
  },

  // =========================================================
  // BODY
  // =========================================================

  {
    id: "breast-augmentation",
    name: "Breast Augmentation",
    area: "Body",
    type: "Surgical",
    category: "Breast Procedures",
    icon: "◉",
    summary:
      "Surgery that increases breast volume using implants or, in selected cases, transferred fat.",
    goals: [
      "Increase breast volume",
      "Improve breast symmetry",
      "Restore lost fullness",
      "Adjust breast proportions"
    ],
    recovery:
      "Soreness, swelling, and activity restrictions are common during the first several weeks.",
    risks: [
      "Capsular contracture",
      "Implant rupture",
      "Infection",
      "Changes in sensation",
      "Need for future surgery"
    ],
    candidate:
      "Adults seeking increased breast volume who understand implant maintenance, alternatives, and long-term follow-up.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "breast-lift",
    name: "Breast Lift",
    area: "Body",
    type: "Surgical",
    category: "Breast Procedures",
    icon: "◉",
    summary:
      "Surgery that reshapes and elevates breast tissue while removing selected excess skin.",
    goals: [
      "Elevate breast position",
      "Improve breast shape",
      "Reposition the nipple",
      "Reduce stretched skin"
    ],
    recovery:
      "Swelling, soreness, and activity restrictions commonly last several weeks.",
    risks: [
      "Scarring",
      "Asymmetry",
      "Changes in sensation",
      "Delayed healing",
      "Breastfeeding changes"
    ],
    candidate:
      "Adults with breast sagging who have stable weight and realistic expectations about scars.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "breast-reduction",
    name: "Breast Reduction",
    area: "Body",
    type: "Surgical",
    category: "Breast Procedures",
    icon: "◉",
    summary:
      "Surgery that removes breast tissue, fat, and skin to reduce breast size and reshape the breasts.",
    goals: [
      "Reduce breast size",
      "Improve physical comfort",
      "Elevate breast position",
      "Improve proportions"
    ],
    recovery:
      "Soreness and swelling are common for several weeks. Lifting and strenuous activity are usually restricted.",
    risks: [
      "Scarring",
      "Asymmetry",
      "Changes in sensation",
      "Delayed healing",
      "Breastfeeding changes"
    ],
    candidate:
      "Adults experiencing physical or cosmetic concerns related to breast size.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "liposuction",
    name: "Liposuction",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "〰️",
    summary:
      "Surgery that removes selected localized fat deposits to change body contour.",
    goals: [
      "Reduce localized fat",
      "Improve body contour",
      "Refine proportions",
      "Treat areas resistant to diet and exercise"
    ],
    recovery:
      "Bruising, swelling, soreness, and compression-garment use are common for several weeks.",
    risks: [
      "Contour irregularities",
      "Fluid collection",
      "Blood clots",
      "Infection",
      "Skin laxity"
    ],
    candidate:
      "Adults near a stable weight with localized fat deposits and reasonable skin elasticity.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "tummy-tuck",
    name: "Tummy Tuck",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "⌛",
    summary:
      "Surgery that removes selected excess abdominal skin and may tighten separated abdominal muscles.",
    goals: [
      "Remove excess abdominal skin",
      "Improve abdominal contour",
      "Repair selected muscle separation",
      "Reduce lower-abdominal overhang"
    ],
    recovery:
      "Walking is encouraged early, but lifting and strenuous activity are restricted for several weeks.",
    risks: [
      "Blood clots",
      "Fluid collection",
      "Delayed healing",
      "Scarring",
      "Numbness"
    ],
    candidate:
      "Adults with loose abdominal skin or muscle separation who are near a stable weight and do not plan major future weight changes.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "mini-tummy-tuck",
    name: "Mini Tummy Tuck",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "⌛",
    summary:
      "A limited abdominal-contouring surgery generally focused below the belly button.",
    goals: [
      "Reduce lower-abdominal skin excess",
      "Improve lower-abdominal contour",
      "Address limited muscle laxity",
      "Use a shorter incision than a full tummy tuck in selected cases"
    ],
    recovery:
      "Activity restrictions and swelling commonly last several weeks.",
    risks: [
      "Scarring",
      "Fluid collection",
      "Asymmetry",
      "Delayed healing",
      "Blood clots"
    ],
    candidate:
      "Adults whose concerns are mainly limited to the lower abdomen.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "brazilian-butt-lift",
    name: "Brazilian Butt Lift",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "🍑",
    summary:
      "A fat-transfer procedure that uses liposuctioned fat to increase or reshape buttock volume.",
    goals: [
      "Increase buttock volume",
      "Improve waist-to-hip contour",
      "Adjust buttock shape",
      "Use the patient's own fat"
    ],
    recovery:
      "Patients are commonly instructed to limit direct pressure on the buttocks and wear compression garments for several weeks.",
    risks: [
      "Fat embolism",
      "Blood clots",
      "Infection",
      "Fat necrosis",
      "Contour irregularities"
    ],
    candidate:
      "Adults with enough donor fat who understand the serious safety considerations and need for a properly trained surgeon.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "butt-implants",
    name: "Butt Implants",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "🍑",
    summary:
      "Surgery that places solid implants to increase buttock projection or volume.",
    goals: [
      "Increase buttock projection",
      "Add volume without donor fat",
      "Improve body proportions",
      "Create a more defined shape"
    ],
    recovery:
      "Sitting and activity may be restricted during early recovery. Swelling and discomfort can last several weeks.",
    risks: [
      "Implant movement",
      "Infection",
      "Wound separation",
      "Asymmetry",
      "Need for implant removal"
    ],
    candidate:
      "Adults seeking buttock augmentation who do not have enough donor fat or prefer implants after reviewing risks.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "mommy-makeover",
    name: "Mommy Makeover",
    area: "Body",
    type: "Surgical",
    category: "Combination Procedures",
    icon: "✨",
    summary:
      "A customized combination of procedures commonly used to address breast and abdominal changes after pregnancy.",
    goals: [
      "Improve abdominal contour",
      "Address breast volume or sagging",
      "Reduce selected fat deposits",
      "Combine recovery periods"
    ],
    recovery:
      "Recovery depends on the procedures combined and may involve several weeks of significant activity restriction.",
    risks: [
      "Blood clots",
      "Bleeding",
      "Infection",
      "Delayed healing",
      "Risks from longer surgery"
    ],
    candidate:
      "Adults who have completed pregnancy and breastfeeding, have stable weight, and are healthy enough for combined surgery.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "arm-lift",
    name: "Arm Lift",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "💪",
    summary:
      "Surgery that removes selected loose skin and reshapes the upper arms.",
    goals: [
      "Reduce hanging upper-arm skin",
      "Improve arm contour",
      "Remove selected excess fat",
      "Create a firmer appearance"
    ],
    recovery:
      "Swelling, soreness, and arm-movement restrictions are common for several weeks.",
    risks: [
      "Visible scarring",
      "Fluid collection",
      "Numbness",
      "Delayed healing",
      "Asymmetry"
    ],
    candidate:
      "Adults with significant upper-arm skin laxity, often after major weight loss.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "thigh-lift",
    name: "Thigh Lift",
    area: "Body",
    type: "Surgical",
    category: "Body Contouring",
    icon: "🦵",
    summary:
      "Surgery that removes selected excess thigh skin and improves thigh contour.",
    goals: [
      "Reduce loose thigh skin",
      "Improve thigh contour",
      "Address post-weight-loss laxity",
      "Reduce selected skin folds"
    ],
    recovery:
      "Walking, swelling, wound care, and activity restrictions can be significant during the first several weeks.",
    risks: [
      "Scarring",
      "Fluid collection",
      "Wound separation",
      "Blood clots",
      "Asymmetry"
    ],
    candidate:
      "Adults with significant thigh skin laxity and stable weight.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "male-breast-reduction",
    name: "Male Breast Reduction",
    area: "Body",
    type: "Surgical",
    category: "Chest Procedures",
    icon: "👕",
    summary:
      "Surgery that reduces excess male breast tissue using liposuction, tissue removal, or both.",
    goals: [
      "Flatten the chest contour",
      "Reduce glandular tissue",
      "Improve chest symmetry",
      "Improve clothing fit"
    ],
    recovery:
      "Compression garments, swelling, bruising, and upper-body activity restrictions are common for several weeks.",
    risks: [
      "Contour irregularity",
      "Scarring",
      "Changes in sensation",
      "Asymmetry",
      "Fluid collection"
    ],
    candidate:
      "Adult men with persistent enlarged breast tissue after medical causes have been considered.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "pectoral-implants",
    name: "Pectoral Implants",
    area: "Body",
    type: "Surgical",
    category: "Chest Procedures",
    icon: "💪",
    summary:
      "Solid implants placed to increase the appearance of chest-muscle size or symmetry.",
    goals: [
      "Increase chest projection",
      "Improve pectoral symmetry",
      "Address congenital chest differences",
      "Enhance chest contour"
    ],
    recovery:
      "Chest tightness, swelling, and restrictions on upper-body exercise are common for several weeks.",
    risks: [
      "Implant movement",
      "Infection",
      "Asymmetry",
      "Visible implant edges",
      "Need for revision"
    ],
    candidate:
      "Adults seeking structural chest enhancement who understand implant-related risks.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "calf-implants",
    name: "Calf Implants",
    area: "Body",
    type: "Surgical",
    category: "Leg Procedures",
    icon: "🦵",
    summary:
      "Solid implants placed to increase calf size, shape, or symmetry.",
    goals: [
      "Increase calf volume",
      "Improve lower-leg symmetry",
      "Address congenital differences",
      "Enhance leg proportions"
    ],
    recovery:
      "Walking may be limited early in recovery, with swelling and activity restrictions lasting several weeks.",
    risks: [
      "Implant movement",
      "Infection",
      "Nerve symptoms",
      "Asymmetry",
      "Compartment pressure"
    ],
    candidate:
      "Adults seeking calf enhancement for cosmetic or reconstructive reasons.",
    simulation: "Educational",
    featured: false
  },

  // =========================================================
  // HAIR
  // =========================================================

  {
    id: "fue-hair-transplant",
    name: "FUE Hair Transplant",
    area: "Hair",
    type: "Surgical",
    category: "Hair Restoration",
    icon: "💇",
    summary:
      "A hair-transplant technique that removes individual follicular units from a donor area and places them into thinning areas.",
    goals: [
      "Restore selected thinning areas",
      "Improve hairline density",
      "Use individual follicular grafts",
      "Avoid a long linear donor scar"
    ],
    recovery:
      "Small scabs and redness may last one to two weeks. Transplanted hairs commonly shed before new growth begins.",
    risks: [
      "Uneven growth",
      "Scarring",
      "Infection",
      "Shock loss",
      "Overharvesting"
    ],
    candidate:
      "Adults with suitable donor-hair density and a stable or medically managed pattern of hair loss.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  },

  {
    id: "fut-hair-transplant",
    name: "FUT Hair Transplant",
    area: "Hair",
    type: "Surgical",
    category: "Hair Restoration",
    icon: "💇",
    summary:
      "A hair-transplant method that removes a strip of donor scalp and separates it into follicular grafts.",
    goals: [
      "Restore thinning areas",
      "Transfer a larger number of grafts",
      "Improve hairline density",
      "Preserve portions of the donor zone"
    ],
    recovery:
      "The donor incision requires healing and leaves a linear scar. Transplanted hairs commonly shed before regrowth.",
    risks: [
      "Linear scarring",
      "Numbness",
      "Infection",
      "Uneven growth",
      "Shock loss"
    ],
    candidate:
      "Adults with adequate donor hair who accept a linear donor scar and need a larger graft session.",
    simulation: "Educational",
    featured: false
  },

  {
    id: "beard-transplant",
    name: "Beard Transplant",
    area: "Hair",
    type: "Surgical",
    category: "Hair Restoration",
    icon: "🧔",
    summary:
      "A transplant procedure that places donor-hair follicles into selected beard or mustache areas.",
    goals: [
      "Improve beard density",
      "Fill patchy areas",
      "Adjust beard shape",
      "Restore hair in scarred areas"
    ],
    recovery:
      "Redness, swelling, and small scabs may last one to two weeks. New growth develops gradually.",
    risks: [
      "Uneven direction",
      "Scarring",
      "Infection",
      "Poor graft growth",
      "Unnatural density"
    ],
    candidate:
      "Adults with suitable donor hair who want increased facial-hair density.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "eyebrow-transplant",
    name: "Eyebrow Transplant",
    area: "Hair",
    type: "Surgical",
    category: "Hair Restoration",
    icon: "🤨",
    summary:
      "A transplant procedure that places donor-hair follicles into the eyebrow region.",
    goals: [
      "Increase eyebrow density",
      "Restore missing brow areas",
      "Adjust brow shape",
      "Improve brow symmetry"
    ],
    recovery:
      "Small scabs and redness may last about one week. Transplanted hairs require ongoing trimming because they retain donor-hair growth characteristics.",
    risks: [
      "Incorrect hair direction",
      "Uneven density",
      "Scarring",
      "Infection",
      "Poor graft growth"
    ],
    candidate:
      "Adults with thin or absent eyebrow areas and suitable donor hair.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: false
  },

  {
    id: "hairline-lowering",
    name: "Hairline Lowering",
    area: "Hair",
    type: "Surgical",
    category: "Hairline Procedures",
    icon: "💇",
    summary:
      "Surgery that advances the scalp to shorten the visible forehead and lower the frontal hairline.",
    goals: [
      "Lower the frontal hairline",
      "Reduce visible forehead height",
      "Improve facial proportions",
      "Create a denser immediate hairline"
    ],
    recovery:
      "Swelling, scalp tightness, and temporary numbness may last several weeks. The incision scar matures over time.",
    risks: [
      "Visible scarring",
      "Hair loss near the incision",
      "Numbness",
      "Asymmetry",
      "Need for later hair transplantation"
    ],
    candidate:
      "Adults with a naturally high hairline, good scalp flexibility, and no uncontrolled progressive frontal hair loss.",
    simulation: "2D Available",
    cameraProcedure: "hairlineLowering",
    featured: true
  },

  // =========================================================
  // DENTAL / SMILE
  // =========================================================

  {
    id: "veneers",
    name: "Veneers",
    area: "Smile",
    type: "Dental",
    category: "Cosmetic Dentistry",
    icon: "😁",
    summary:
      "Thin restorations bonded to the front of selected teeth to change color, shape, size, or alignment appearance.",
    goals: [
      "Change tooth color",
      "Improve tooth shape",
      "Close selected spaces",
      "Create a more uniform smile"
    ],
    recovery:
      "Temporary sensitivity may occur. Tooth preparation and permanence depend on the veneer type.",
    risks: [
      "Sensitivity",
      "Chipping",
      "Debonding",
      "Gum irritation",
      "Irreversible enamel removal"
    ],
    candidate:
      "Adults with healthy teeth and gums who want cosmetic changes that cannot be achieved adequately with simpler treatments.",
    simulation: "2D Available",
    cameraProcedure: "veneers",
    featured: true
  },

  {
    id: "dental-bonding",
    name: "Dental Bonding",
    area: "Smile",
    type: "Dental",
    category: "Cosmetic Dentistry",
    icon: "🦷",
    summary:
      "Tooth-colored resin applied to selected teeth to improve shape, chips, spacing, or surface appearance.",
    goals: [
      "Repair minor chips",
      "Adjust tooth shape",
      "Close small spaces",
      "Improve selected discoloration"
    ],
    recovery:
      "There is usually little downtime, although mild sensitivity can occur.",
    risks: [
      "Staining",
      "Chipping",
      "Wear",
      "Color mismatch",
      "Need for maintenance"
    ],
    candidate:
      "Adults with minor cosmetic tooth concerns and healthy underlying teeth.",
    simulation: "2D Available",
    cameraProcedure: "dentalBonding",
    featured: true
  },

  {
    id: "teeth-whitening",
    name: "Teeth Whitening",
    area: "Smile",
    type: "Dental",
    category: "Cosmetic Dentistry",
    icon: "✨",
    summary:
      "A bleaching treatment used to lighten selected tooth discoloration.",
    goals: [
      "Brighten tooth color",
      "Reduce selected surface stains",
      "Improve smile appearance",
      "Create a more even shade"
    ],
    recovery:
      "Temporary tooth or gum sensitivity may occur after treatment.",
    risks: [
      "Sensitivity",
      "Gum irritation",
      "Uneven whitening",
      "Limited effect on restorations",
      "Temporary results"
    ],
    candidate:
      "Adults with healthy teeth and gums whose discoloration is suitable for bleaching.",
    simulation: "2D Available",
    cameraProcedure: "teethWhitening",
    featured: true
  },

  {
    id: "gum-contouring",
    name: "Gum Contouring",
    area: "Smile",
    type: "Dental",
    category: "Cosmetic Dentistry",
    icon: "🦷",
    summary:
      "A dental procedure that reshapes selected gum tissue to change tooth exposure or gumline symmetry.",
    goals: [
      "Improve gumline symmetry",
      "Reduce a gummy-smile appearance",
      "Expose more tooth surface",
      "Improve smile proportions"
    ],
    recovery:
      "Tenderness and sensitivity may last several days. Healing depends on the amount of tissue treated.",
    risks: [
      "Bleeding",
      "Infection",
      "Gum recession",
      "Sensitivity",
      "Uneven gumline"
    ],
    candidate:
      "Adults with healthy gums who want to adjust gumline shape or tooth exposure.",
    simulation: "2D Available",
    cameraProcedure: "gumContouring",
    featured: false
  },

  {
    id: "smile-makeover",
    name: "Smile Makeover",
    area: "Smile",
    type: "Dental",
    category: "Cosmetic Dentistry",
    icon: "😁",
    summary:
      "A customized combination of dental treatments used to change several aspects of a person's smile.",
    goals: [
      "Improve tooth color",
      "Adjust tooth shape or alignment",
      "Improve gumline appearance",
      "Create overall smile harmony"
    ],
    recovery:
      "Recovery depends on the procedures included, which may range from whitening to orthodontics, bonding, veneers, or gum treatment.",
    risks: [
      "Sensitivity",
      "Tooth reduction",
      "Restoration failure",
      "Gum irritation",
      "Need for long-term maintenance"
    ],
    candidate:
      "Adults with multiple cosmetic dental concerns who have completed a full dental evaluation.",
    simulation: "Camera Preview",
    cameraProcedure: null,
    featured: true
  }
];

// =========================================================
// HELPER FUNCTIONS
// =========================================================

export function getProcedureById(id) {
  return procedures.find(
    (procedure) => procedure.id === id
  );
}

export function getProceduresByArea(area) {
  return procedures.filter(
    (procedure) => procedure.area === area
  );
}

export function getProceduresByType(type) {
  return procedures.filter(
    (procedure) => procedure.type === type
  );
}

export function getProceduresByCategory(category) {
  return procedures.filter(
    (procedure) => procedure.category === category
  );
}

export function getFeaturedProcedures() {
  return procedures.filter(
    (procedure) => procedure.featured === true
  );
}

export function searchProcedures(searchTerm) {
  const normalizedSearch = String(searchTerm || "")
    .toLowerCase()
    .trim();

  if (!normalizedSearch) {
    return procedures;
  }

  return procedures.filter((procedure) => {
    const searchableContent = [
      procedure.name,
      procedure.area,
      procedure.type,
      procedure.category,
      procedure.summary,
      procedure.recovery,
      procedure.candidate,
      ...(procedure.goals || []),
      ...(procedure.risks || [])
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(
      normalizedSearch
    );
  });
}
