# AesthetIQ measurement specification — 2026-10-09

## Scope and evidence

The registry covers all 54 catalog procedures with 67 distinct candidate endpoints, anatomical definitions, units, acquisition requirements and references. This is an engineering research specification, not an exhaustive clinical examination, validated device, surgical plan or established predictor of treatment response. Clinicians must select procedure- and technique-specific endpoints, examine function and complications, and approve acquisition protocols. None of the 54 procedures is clinically calibrated by this update.

`js/clinicalMeasurementRegistry.js` is the authoritative endpoint/source mapping. Fifteen primary-source references support selected endpoints. A reference for a related procedure does not validate another procedure, and an article is not a cleared training dataset. Entries without direct references are explicitly proposed endpoints requiring clinician review. No patient photographs, patient records or fitted outcome coefficients were added.

Coverage includes:

- Nose, chin, jaw and cheek: widths, projection, reference-plane distances, angles, symmetry and registered regional volume.
- Eyes, brow and neck: margin-reflex distances, lid crease/aperture, scleral show, brow height, lid-cheek depth and neck profile angles.
- Lips and ears: philtral/vermilion dimensions, bow depth, projection, area, asymmetry, expression controls, closure assessment and ear protrusion.
- Skin: instrument-defined roughness, pigment/erythema, wrinkle depth, scar dimensions and named observer scales.
- Breast and body: regional volume, projection, nipple/fold position, ptosis, circumference, widths, skin folds and displacement.
- Hair: shaft and follicular-unit densities, graft survival, coverage and hairline position.
- Dental: tooth dimensions, edge/gap/gingival relationships and calibrated CIELAB color.

No universal aesthetic ideal or target is assigned. These endpoint sets do not cover all possible clinical safety, functional, patient-reported or long-term outcomes.

## App integration

Facial and body preview pages display the selected procedure's requirements. Facial pipeline results include descriptive ratios for 11 supported procedures, with physical measurements explicitly unavailable. A collapsed illustrated-geometry panel exposes those ratios. Recovery overlays are not measured; these are underlying landmark descriptors, not clinical outcomes.

`measurement-workbench.html` provides an isolated localhost-only tool for all 54 procedures. It supplies blank procedure-specific JSON templates, local comparison, report export and geometry calculators. No network upload or persistent browser storage is used by the workbench. Inputs and reports remain in page memory until cleared or closed. Pseudonymous codes and measurements can still be sensitive; exported files require appropriate handling. The host check is a workflow guard, not authentication.

The public body renderer remains an illustrative silhouette warp. It does not acquire 3D tissue measurements or implement surgical repositioning. Defining a measurement does not make a contour preview an accurate prediction.

## Calibrated arithmetic

`js/clinicalMeasurements.js` accepts finite 2D pixel points with a documented same-plane ruler, or verified metric 3D points in millimeters. Unscaled FaceMesh depth is rejected. A calibration assertion is not independent verification of camera distortion or scanner accuracy.

- Distance: Euclidean endpoint distance; pixels multiplied by reference millimeters/reference pixels.
- Angle: angle between vectors around the second point, in degrees.
- Ratio: first endpoint-pair distance divided by second; zero denominator rejected.
- Area: absolute shoelace area of a simple calibrated 2D polygon, in mm². This is planar projected area, not curved surface area. Convert mm² to cm² by dividing by 100 when recording hair coverage.
- Circumference: closed perimeter of a simple planar 3D section, divided by 10 for cm. It cannot be inferred from a frontal photo width. Polygons are capped at 2,000 points.
- Volume: absolute signed-tetrahedron sum of a closed, consistently oriented, connected triangle mesh, divided by 1,000 for mL. Open meshes, degenerate faces, unused vertices and zero volume fail. Absence of self-intersection must be checked upstream and explicitly confirmed; the calculator does not solve geometric self-intersection. Both visits need identical ROI and closure definitions.
- Density: integer count divided by calibrated cm², retaining hairs/cm² versus FU/cm².
- Color: Euclidean CIELAB difference (ΔE76), requiring matched calibrated color conditions. No raw-RGB inference, ΔE2000, or clinical whitening grade.

Geometry values must be associated with the correct anatomical endpoint and acquisition protocol; the calculator cannot recognize anatomy. Signed clinical offsets need a declared sign convention; an unsigned endpoint distance does not establish direction.

## Paired observations (schema 1)

Input contains procedure, pseudonymous case/cohort/technique context, reviewed adult/same-person/authorized-use/matched-capture assertions, positive follow-up days and before/after arrays. Each observation supplies metricId, value, exact unit, allowed method, region, side, expression, view, protocolId and calibrationId. Scores additionally require scale ID and bounds; color requires illuminant and observer.

Match by metric, region, side and expression, then require identical method, view and protocol. Missing pairs and incompatible protocols never become zero. Calibration IDs may differ between visits while the measurement protocol remains identical. Report provenance retains both calibration IDs. The tool cannot establish calibration traceability from a string identifier.

Delta is after minus before. Percentage change is omitted for zero baseline, signed offsets, angles, scores, indices and already-percent values. Color reports unsigned ΔE76. No mixed-unit RMSE is produced. Individual uncertainty values are retained, but paired uncertainty is not combined without repeatability/covariance. Complete endpoint coverage is not validation and does not establish adequate bilateral or regional sampling; clinician review must verify this.

Follow-up under 14 days triggers an engineering caution about swelling, not a universal healing threshold. Unconfirmed isolation of the procedure flags concurrent-treatment attribution. No coefficients, filler doses, implant sizes or treatment recommendations are derived.

## Facial comparison migration

Comparison schema 3 / `square_pixel_eye_aligned_2d_v3` keeps image-aspect correction and eye alignment, projects vermilion thickness onto the mouth normal, adds philtral length and lower-lid-to-canthal-line descriptors, and screens changes in oral opening. Thresholds are engineering screens, not validated clinical cutoffs. Perspective/depth/expression cannot be corrected by in-plane alignment alone.

Cheek filler/implants, buccal fat removal, facelift/mini-facelift and facial fat transfer no longer use jaw width as a substitute for tissue volume. They require additional calibrated acquisition. Lower blepharoplasty no longer reuses an upper-aperture label; lip lift includes a philtral descriptor. FaceMesh landmarks remain approximations, not clinician-identified anatomical ground truth.

The multi-case reviewer rejects old protocols. Historical published v2 diagnostics remain unchanged and cannot be reused as v3 calibration evidence. The compatibility photo-pair API shares the same supported-procedure gate and does not fall back to arbitrary facial metrics.

## Verification

Automated tests check all 54 registry mappings, calibrated scale/units, polygon and mesh failures, translation invariance, density/color differences, matching/context requirements, expression confounds, evidence aggregation, and actual three-level canvas rendering with synthetic face geometry. These establish software behavior only; they do not establish clinical measurement accuracy or patient outcome validity.
