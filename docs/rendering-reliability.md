# Rendering reliability investigation — October 9, 2026

The reported user-device failure has not yet been reproduced. The deployed GitHub Pages preview loads the current controller; the remote test browser has no camera and was incorrectly shown a generic permission-denied message. A local DOM/native-canvas integration test completes the Precision Scan callback and displays rendered pixels. All 40 non-body procedure pipelines return three finite render levels with synthetic reference geometry.

Confirmed failure paths corrected:

- Uploaded phone photos were expanded to full-resolution canvases before detection and multi-pass rendering. Upload analysis and the generation entry point now preserve aspect ratio while limiting the longest edge to 1,200 pixels.
- Image face detection had no timeout and could remain pending indefinitely. It now times out after 20 seconds, releases the failed detector and permits a fresh retry.
- Concurrent upload requests could replace the detector's result callback. The detector now rejects overlap and the controller disables competing controls during analysis/generation. Live camera readiness/status updates cannot overwrite active photo processing or a completed preview status.
- Camera startup now distinguishes missing hardware from blocked permission and offers the upload path. Missing model scripts produce visible feedback.

Tests cover size bounds, timeout/retry, overlap rejection, camera hardware feedback, actual scan-to-visible-result integration and all non-body pipelines. These tests do not reproduce real camera permissions, phone memory limits, browser-specific rendering or the user's exact failure. Procedure name, capture route and the visible error/screenshot are still needed if the reported issue persists.

## Follow-up: completed scans with unchanged images

Reproduced a silent no-op in geometric rendering: when the CDN mesh-connection global is absent at first import, the renderer caches an empty triangle array indefinitely. Lip rendering also snapshots that empty topology during module initialization. Detection can still complete, and non-empty result canvases alone do not prove an image was changed.

Rendering now uses the repository's existing canonical 468-vertex triangle connectivity directly, independent of CDN globals and script timing. A failing-before/passing-after regression removes those globals and checks actual pixel differences for lip filler, rhinoplasty and chin filler. The completed Precision Scan controller test now also verifies intensity selection changes the displayed pixels and Original restores the source image. No intensity coefficients were increased. All 37 tests pass; confirmation on the reporting user's phone remains pending.
