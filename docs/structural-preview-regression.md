# 2D structural preview correction

User report: lip filler looked pink without fullness; facelift appeared unchanged.

Confirmed code issues and reproduced synthetic failures:
- Lip-specific rendering selected only triangles fully inside a hand-picked region and composited only within the lip boundary. Surrounding skin displacement was discarded. The final preview also added saturation and colored soft-tissue lighting.
- Facelift moved only fourteen outer-face vertices, leaving adjacent cheek tissue fixed.
- The face renderer drew displaced triangles over the original photo without replacing pixels immediately outside the displaced face boundary, retaining an old silhouette when the boundary moved inward.

Changes:
- Lip filler uses the complete geometry displacement render, preserving surrounding tissue movement. Pigment/saturation and artificial lip lighting passes are removed from filler previews.
- Facelift distributes existing lift vectors into three adjacent topology rings with tapering, protecting central eyes, nose and mouth landmarks. This is an illustrative field, not an evidence-derived surgical model; no new clinical effect-size claim is made.
- An exterior support ring replaces the original outline during contour movement. Unchanged triangles are skipped to avoid unnecessary rasterization of unaffected features. The support ring also moves adjacent background near the boundary; large deformation/poor framing can still cause artifacts.
- Cache versions updated for the 2D entry point and changed dependencies.

Verification:
- All three new structural tests failed against the prior commit and pass after correction: increasing rendered lip area, cheek feature motion with protected landmarks, and old silhouette replacement.
- Full suite: 49 passing tests.
- Synthetic tests are not patient-image or iPhone visual verification. The exact user's capture has not been reproduced. Phone testing of Natural/Balanced/Enhanced and Original comparison remains required before declaring the reported experience resolved.
