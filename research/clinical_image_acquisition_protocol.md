# AesthetIQ clinical image acquisition and validation protocol

**Status (2026-10-09):** Five open-license adult figure files were temporarily acquired. Two exploratory comparisons from one adult were completed; zero comparisons qualify for clinical calibration. Source images, crops, renders and landmark arrays are discarded after analysis and are not app assets.

## Required clearance before acquiring a patient photo
- Identify photographer/clinic/publisher, exact figure and DOI/URL.
- Record copyright license and verify whether commercial software development, derivative processing, and model training are expressly permitted.
- Record publication consent and the intended processing. For the requested temporary review of published open-license adult figures, verify article and figure reuse terms and record limitations. This review does not train a model or redistribute images. Any future training or persistent patient-image dataset needs its own permissions review.
- Record any restrictions on identifiable patient images, redistribution, retention, and deletion.
- Do not commit identifiable clinical images to public GitHub.
- Exclude noncommercial-only databases and figures from commercial product calibration.

## Image pairing requirements
- Same individual, same treatment, documented intervention and treatment date.
- Before and after, same facial expression and camera pose, neutral lighting, focal length/distance where possible.
- Record follow-up time (e.g., 4 weeks, 3 months, 12 months), formulation/dose and concurrent procedures.
- Reject image pairs with overlays, filters, heavy makeup changes, inconsistent cropping, and substantial pose mismatch.
- Label images that have multiple concurrent treatments as **not attributable** to one procedure.
- Stratify by anatomy, skin appearance, procedure type, clinician technique, follow-up interval and camera type without claiming individual prediction.

## Quantitative comparison
1. Detect landmarks and segment the relevant anatomical region.
2. Align the pair to a stable facial reference and flag mismatched yaw/roll.
3. Compute normalized before-to-after geometry metrics.
4. Run AesthetIQ Natural/Balanced/Enhanced on the same original image.
5. Compare the *direction and magnitude* of normalized metrics; inspect seam/blur artifacts.
6. Retain outliers and failures in the audit, do not cherry-pick good examples.
7. For skin/hair/dental/body procedures, implement validated domain-specific measurements before declaring comparable outcomes.
8. Separate data into development and held-out validation sets. Do not tune on the held-out set.
9. Require a qualified medical reviewer before accepting any new procedure parameters.

## Current tools
- `clinical-evidence-audit.html`: local same-person image pair and simulation comparison for procedures with available facial metrics.
- `js/procedureEvidenceComparison.js`: normalized metric residuals and camera alignment flags.
- `js/evidenceCalibrationReview.js`: summary of independent cases, requires >=20 before expert review and does not auto-adjust coefficients.
- `research/procedure_evidence_audit_v2.json`: all 54 procedures, 26 candidate source links, source-specific or gallery-only coverage, and licensing flags.
- `research/clinical_quantitative_benchmarks.json`: selected published numeric findings, **not** direct simulation calibration.

## Not completed
- No commercial reuse permission established for a clinical image corpus.
- A small published-image diagnostic has been completed; no suitable clinical calibration corpus has been established.
- Two exploratory image-vs-simulation comparisons exist, from one adult at two follow-ups. Obscured references and low resolution prevent their use for calibration.
- No clinical coefficients calibrated or validated.
- 2D MediaPipe landmark ratios are not interchangeable with measured 3D volume, millimeters, clinical scales or surgical outcomes.

**Release gate:** Keep AesthetIQ previews educational and nonpredictive until independent visual and clinical validation is complete.


## Temporary-only analysis and data minimization (2026-10-09)
- Clinical photos are **development-only inputs**, never product assets, marketing imagery, seed data, public example faces, or app content.
- Analyze authorized pairs locally in an isolated development environment; do not commit them, attach them to bug reports, or send them to public issue trackers.
- Do not retain identifiable landmark arrays, original file names, EXIF, facial embeddings, individual photographs, or raw per-person reports in production.
- After measurements are reviewed, delete temporary source photos, cropped faces, previews, browser-held canvases and any authorized scratch files. Clear local trash and backups where possible; verify the actual retention/deletion behavior of the development environment.
- The audit tool provides a **Discard temporary photos** action and clears canvas references on page exit. It does not guarantee immediate secure erasure from browser memory or external caches.
- Keep only licensed, de-identified, aggregate procedure statistics, uncertainty ranges, provenance records and approved code/parameter changes. Small groups can still be re-identifiable; suppress or combine sparse strata.
- The current HTML research tool resides in the repository. A `noindex` directive and absence from app navigation **do not constitute access control**. Before public deployment, exclude the research tool and any temporary analysis data from the deployed build or put it behind authenticated developer-only access.
- If any image has already been committed, `.gitignore` will not remove it from Git history; history and hosting caches require separate remediation.
- The clinical audit does **not** upload reference photos itself, but MediaPipe scripts are loaded from a CDN; review third-party runtime and privacy policies before handling sensitive clinical material.

## Continuation update — 2026-10-09

- Verified the article-level CC BY 4.0 statements of all eight leads in
  `all_54_procedure_evidence_matrix.json` against Europe PMC's primary full-text
  XML. The matrix records exact source URLs, DOIs, reviewed figure IDs and XML
  hashes. Caption review identifies combined treatments, reconstructive cases,
  and non-outcome studies. Figure-processing clearance remains separate.
- Rechecked the previously transcribed lip volume and fullness values against
  the article's results paragraph and Table 2. No patient photos were acquired.
- Comparison schema v2 requires each image's dimensions. It converts normalized
  FaceMesh coordinates to square-pixel geometry and removes in-plane roll before
  computing ratios. Differing head pose still triggers review; this does not
  correct perspective, expression, lighting, depth, or clinical confounders.
- All three simulated levels and every procedure metric must be finite before
  a report can be summarized. The 17 supported facial procedure metrics remain
  exploratory descriptors, not validated measurements of all treatment effects.
- Reports require pseudonymous study/case codes, goal, technique, follow-up,
  simulator configuration, development/holdout role and case-review assertions.
  Never use names or medical-record identifiers. Metadata is self-attested and
  requires independent expert verification.
- Repeated cases count once per procedure; exact repeated measurement sets are
  excluded for review even if renamed. Cases appearing in both development and
  holdout sets are excluded from both. Distinct studies, goals, techniques,
  follow-up windows and simulator configurations are not pooled toward the
  review floor. Holdout cases never qualify for coefficient tuning.
- Twenty comparable cases is a workflow floor for expert review, not a clinical
  sample-size justification or proof of accuracy. No coefficients are adjusted.
- Earlier reports lack the required coordinate/case protocol and must be
  remeasured; silently treating their values as v2 data is unsafe.
- Discard invalidates pending image work, clears previews and imported summaries,
  and prevents late callbacks from restoring them. The image detector is closed
  after each attempted comparison. The old reference-photo URL routes local
  users to this single workflow and stays disabled on public hosts.

### Verification

Run `node --test tests/evidence-audit.test.mjs` for synthetic geometry, count,
separation, lifecycle and 54-procedure audit regression checks. For the browser
workflow, install Playwright and Chromium, serve the repository on
`http://127.0.0.1:8765`, then run `node tests/evidence-audit.browser.mjs`.
The browser test uses canonical reference geometry and synthetic pixels with a
stub detector, running the actual simulation pipeline. It is not an assessment
of face-detection accuracy, clinical images, or iPhone Safari behavior.

Current verification: all 17 Node regression tests passed. The actual Canvas 2D simulation pipeline also completed three intensity renders using the temporary published adult baseline. Inline module syntax and `git diff --check` passed. Browser automation remains blocked by the execution environment (Chromium socket creation is not permitted); browser and mobile QA remain unverified.

### Still outstanding

Authorized, applicable adult paired-image acquisition and case review;
independent clinical comparisons; domain-specific skin/hair/dental/body/3D
measurement validation; clinician review; and held-out clinical validation.
Article-license verification and passing software tests do not complete these.

## Populated image diagnostic and lip-math correction

`published_image_comparison_summary.json` contains source attribution, exclusion
reasons, comparison counts and residual ranges. Patient photos and landmark arrays
are not in that file. Figure 1A of DOI 10.1111/jocd.70744 provides baseline, day-30
and day-90 views of an adult; its study population is ages 20–30. Eye blurring and
low resolution are explicit exclusion reasons for calibration. Other acquired lip
pairs failed complete paired face detection; the acquired rhinoplasty example is
a side profile, incompatible with the current frontal measurements. The mixed-age
rhinoplasty study was excluded after automatic approval review rejected further
image acquisition. No photos from that study were acquired or processed.

Execution exposed and fixed a temporal-dead-zone error: lip product coefficients
were read before their `const` declarations. Lip anatomy also used the inner-mouth
opening as fullness; it now measures upper and lower vermilion thickness, projects
onto the mouth's normal axis, and accounts for image proportions. This is a
geometric implementation correction, not effect-size fitting to one person.

Temporary images, crops, renders, model workspace and individual landmark/report files were deleted after analysis. Only source attribution, diagnostic residual ranges and code corrections remain. No secure-erasure guarantee is made for external hosting caches.

The native render regression can be run with `node --test tests/simulation-pipeline.test.mjs` after installing `@napi-rs/canvas`; it uses the repository canonical reference model and synthetic pixels, not clinical photos.
