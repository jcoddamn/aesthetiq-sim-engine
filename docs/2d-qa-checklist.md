# AesthetIQ 2D visual QA checklist

Status: code-integrated, **not clinically validated or visually approved**.

## Test matrix
Run each procedure at Natural / Balanced / Enhanced and Immediate / Early / Settling / Final.

1. Lip filler: preserve Cupid's bow, no black seam or excessive blur.
2. Rhinoplasty / revision: smooth bridge and nostril transitions, no collapsed nose.
3. Upper/lower blepharoplasty: eyelid boundary preserved, no iris distortion.
4. Brow lift / facelift / jawline / buccal: no visible triangle edges or background warping.
5. Under-eye filler: no eyelashes, sclera, or iris softening.
6. Forehead / glabella / crow's feet: retain pores and brows; no waxy skin.
7. Laser / chemical peel / IPL / microneedling: texture retained; no color cast outside skin.
8. Veneers / bonding / whitening / gum contouring: mouth safety mask respected, no lip whitening, no fabricated tooth detection claims.
9. Face mask debug: verify expected region for each procedure.
10. Compare the same selected procedure/intensity in 2D and 3D; record differences.

## Capture cases
- Front-facing high-resolution photo, adequate light
- Left/right three-angle scan
- Dark and light skin tones
- Thin and full lips
- Open and closed mouth
- Glasses / facial hair / makeup
- Low-light and motion-blurred photos
- iPhone Safari and Android Chrome

## Release gates
- No JavaScript runtime errors on procedure navigation or rendering.
- All three intensity canvases populated and visually distinct where appropriate.
- Mask exclusions keep eyes, mouth, and brows intact.
- QA warnings appear when output quality degrades.
- Photos stay on-device unless users explicitly consent to another workflow.
- Medical advisor reviews procedure claims and recovery descriptions.
- Replace estimated dental masks with validated tooth/gum segmentation before advertising precise tooth reshaping.
- Calibrate procedural changes against properly licensed, standardized clinical evidence.
- Do not label results as predictive or clinically accurate without validation.

## Current implementation limitations
- Depth-aware 2D weighting uses relative MediaPipe Z, not metric depth.
- Dental color/luminance thresholding estimates enamel/gum appearance; it is not a trained segmentation model.
- Recovery illustration is conservative and not a patient-specific wound/swelling simulator.
- 2D and 3D share intensity presets but still have different deformation implementations; numeric agreement is not established.
- Syntax and pure-function tests do not replace browser-based image testing.
