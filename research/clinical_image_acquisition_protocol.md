# AesthetIQ clinical image acquisition and validation protocol

**Status:** Candidate sources identified; zero clinical image files cleared or downloaded as of 2026-10-09.

## Required clearance before acquiring a patient photo
- Identify photographer/clinic/publisher, exact figure and DOI/URL.
- Record copyright license and verify whether commercial software development, derivative processing, and model training are expressly permitted.
- Obtain consent covering intended patient-image processing and use; consent to publication alone does not necessarily authorize commercial training.
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
- `research/procedure_evidence_audit_v2.json`: all 54 procedures, 17 candidate source links, source-specific or gallery-only coverage, and licensing flags.
- `research/clinical_quantitative_benchmarks.json`: selected published numeric findings, **not** direct simulation calibration.

## Not completed
- No commercial reuse permission established for a clinical image corpus.
- No clinical image files acquired, no paired patient images measured.
- No quantitative clinical image-vs-simulation comparisons performed.
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
