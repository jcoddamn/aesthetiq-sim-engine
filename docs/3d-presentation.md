# 3D presentation correction

The screenshot showed a photo-textured partial face attached to unscanned, fixed-color ears and neck. The model does not reconstruct a complete head or invisible regions. Capture check percentages did not measure reconstruction accuracy.

Changes:
- Personalized facial views hide generic head components by default. An explicit reference toggle can show neutral gray schematic components. Ear/neck procedures retain and label schematic context.
- Photo texture uses an unlit, untone-mapped material so scene lights do not add another layer of shadows or tint over captured lighting. This is a presentation choice, not relightable skin reconstruction.
- Camera reset/load framing accounts for model bounds and portrait aspect ratio.
- The UI reports angle count and approximate depth, without a scan-quality percentage or accuracy claim.
- Missing forehead, scalp, back-of-head and other unobserved surfaces remain incomplete. This update does not provide a photorealistic full-head twin.

Validation: 40 automated tests pass, including presentation defaults, schematic procedure context and portrait framing math. WebGL/device visual appearance has not been verified with the user's scan. No user photographs are included in the code or tests.
