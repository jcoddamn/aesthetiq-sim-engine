# Nexus procedure demo

Use these two guided flows to show the complete software journey: add photos, create a preview, explore recovery, compare views, save a labeled image and clear the photos. Describe them as implemented procedure visualizations. Clinical review and real outcome comparison are still pending.

## Scope

| Flow | Required photos | Timeline checkpoints |
| --- | --- | --- |
| [Classic HA lip filler](../journey.html?procedure=lip-filler&option=hyaluronic-acid&style=classic&product=provider&intensity=balanced) | One relaxed face, lips gently closed | Before; immediately after; days 2, 7, 14 and 28 |
| [BOTOX Cosmetic for glabellar frown lines](../journey.html?procedure=glabella-neuromodulator&option=botox&neuromodulator=botox&intensity=balanced) | The same person at rest and frowning, in separate photos | Before; immediately after; days 2, 7, 14 and 30; wearing-off examples at days 90 and 120 |

Open these links from a local server or the app's host. The README has local setup commands.

The lip flow uses Classic shaping and an HA class-level recovery example. The intended lip shape is present immediately; temporary swelling changes separately as the timeline advances. Day 28 is the settled reference view.

The BOTOX flow covers the area between the eyebrows. It compares each expression with its own original photo. It starts without an immediate wrinkle-relaxing effect, builds toward the day 30 example, then shows a possible return of expression lines through day 120. Resting creases may remain. This timeline does not apply to every neuromodulator product.

Both flows have Natural, Balanced and Enhanced preview strengths, a day-by-day slider, full-face and close-up views, source notes and safety information. Recovery is visible by default; possible bruising is a separate option and starts off. The export includes the selected stage, strength, expression and view, with a simulation label. Photos are processed in the browser and can be cleared from the session.

The days between checkpoints use visual interpolation. Drawing strengths, swelling and bruising settings are design choices, not measured healing percentages. Day 28 and day 30 are reference checkpoints, not guaranteed recovery deadlines. These demos do not determine eligibility, injection plans or doses.

## Record the lip flow

1. Open the Classic HA link above. Use an adult photo you have permission to show in the application, with even light and no heavy lip makeup.
2. Choose the photo, check the permission box and select **Create my preview**. Keep Balanced selected for the first pass.
3. Select **Before**, then **Immediately after**. Keep both comparison panels visible so the starting photo stays clear.
4. Move through days 2, 7, 14 and 28. Pause at day 2 to show the recovery example, then at day 28 to show the settled reference.
5. Select **Close-up**. At day 2, briefly switch recovery off and on, then enable **Include possible bruising**. Explain that these are optional examples. Turn bruising off again.
6. Return to day 28 and select **Save this comparison**. Open the downloaded image and show its procedure, day and simulation label.
7. Select **Clear photos and start again** to finish the recording.

Useful stills: immediately after, day 2 with recovery visible, and day 28 close-up. Keep the original and the stage label in each frame.

## Record the frown-line flow

1. Open the BOTOX link. Add one relaxed photo and a separate frown photo of the same adult. Match the light, camera distance and head position. Do not reuse one photo for both expressions.
2. Check the permission box and create the preview. If the pair is rejected or the face position is poor, retake the photos before recording the result.
3. Keep **Frowning** selected. Show **Before**, **Immediately after**, then days 2, 7, 14 and 30. The immediate view should retain the starting expression lines.
4. At day 30, switch between **At rest** and **Frowning**, then select **Close-up**. Explain that the views show different expressions and that resting creases may persist.
5. Move to days 90 and 120 to show wearing off. Return to day 30, save the comparison, then save a second comparison with the other expression selected.
6. Clear the photos when finished.

Useful stills: the original pair, day 30 at rest, day 30 frowning, and day 120 frowning. A synthetic test face must be identified as synthetic and cannot stand in for a treated patient result.

## Checks and remaining work

Status recorded on October 18, 2026. Passing a software check does not establish clinical accuracy.

| Check | Status |
| --- | --- |
| Timeline anchors, continuous interpolation, product-context fallback and returned-data isolation | Automated tests passed |
| Existing simulation page: fixed capture landmarks, recovery controls, selected-stage rendering and matching exports | All four tests passed after the photo-orientation fix |
| Guided lip flow in real Chrome: upload, render, timeline, close-up, export and clear | Passed; export readability fixed and the photo flow rechecked twice |
| Guided-page flow with real rendering, timelines and export, but mocked photos, detector and camera | All eight tests passed |
| Photo helper: cancelled model loading, late callbacks, multiple faces and file checks | All five tests passed with a fake FaceMesh |
| Synthetic frown rendering: local crease softening, protected eyes and brows, and expression checks | All seven tests passed |
| BOTOX guided flow in Chromium at 320 px and 390 px | Passed: expression and day switches, correct exports, no horizontal overflow or page errors; photo decoding and face detection were mocked |
| Lip strength across portrait, landscape and padded versions of the same face | All four quality tests passed; framing no longer changes the treatment strength |
| Physical iPhone 12, including Safari camera, touch controls and saving images | Pending |
| Matched real neutral/frown photos reviewed by a clinician | Pending |
| Comparison against consented, documented treatment and recovery photo series | Pending |

Keep grant wording tied to these checks. This work does not establish completed patient cases or clinically validated outcome prediction.

## Timeline sources

The sources support the treatment sequence and recovery context. They do not validate the generated images or the interpolation curves.

- [American Academy of Dermatology: Fillers FAQs](https://www.aad.org/public/cosmetic/wrinkles/fillers-faqs) — immediate HA volume and common temporary injection reactions, often clearing within 7–14 days or sooner.
- [Cleveland Clinic: Lip Fillers](https://my.clevelandclinic.org/health/treatments/22133-lip-fillers) — variable early swelling and a follow-up around two weeks.
- [FDA: Restylane Kysse patient information](https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140029S021D.pdf) — patient guidance, warning signs and a study that allowed a four-week touch-up.
- [Galderma: Restylane Kysse prescribing information](https://www.galderma.com/us/sites/default/files/2023-05/Restylane_Kysse_eIFU_USA.pdf) — recorded injection reactions across several recovery windows. Kysse data provides one HA reference; it does not establish identical recovery for all fillers.
- [BOTOX Cosmetic: Frequently asked questions](https://www.botoxcosmetic.com/how-it-works/frequently-asked-questions) — possible onset in 1–2 days, full results by 30 days and effects lasting up to four months.
- [AbbVie: BOTOX Cosmetic prescribing information](https://www.rxabbvie.com/pdf/botox-cosmetic_pi.pdf) — delayed onset, glabellar assessments at maximum frown and an approximately three-to-four-month effect.
- [American Academy of Dermatology: Botulinum toxin therapy FAQs](https://www.aad.org/public/cosmetic/wrinkles/botulinum-toxin-faqs) — muscle relaxation and possible temporary injection reactions.

## Application description draft

AesthetIQ has implemented two photo-based procedure journeys: Classic HA lip filler and BOTOX Cosmetic for frown lines. Users can compare their starting photos with illustrative stages from immediately after treatment through settling or full effect, then save a labeled comparison. Published clinical information guides the timeline; the current checks cover software behavior and an uploaded-photo lip flow in Chrome. Clinical review, matched real-photo evaluation and physical-device testing remain to be completed.
