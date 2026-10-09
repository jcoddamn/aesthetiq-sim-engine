# Experimental multi-view facial fitting

This update replaces blending detector-relative Z with a regularized weak-perspective fit to image X/Y landmarks. Camera yaw, pitch, roll, scale and translation are fitted against reference anchors; each vertex is solved across accepted views with a canonical prior and bounded displacement. Image coordinates preserve pixel aspect ratio. Physical scale is unknown.

Near-duplicate angles, same-side pairs and cameras with excessive reference-fit residual are excluded. Texture selection uses estimated surface facing and accepted views rather than hard-coded left/right lateral bands. This is an approximate visibility heuristic, not a depth-buffer occlusion solution. Blending may still produce seams with expression or lighting changes.

The viewer reports independent accepted views, estimated turns and normalized reprojection residual. Residual is image agreement, not anatomical accuracy. Camera estimates depend on the reference shape, landmarks may be wrong or occluded, and weak perspective ignores full perspective distortion. No clinical calibration, complete head reconstruction, hardware depth, or photorealistic twin is claimed.

## Verification

Synthetic projection tests cover camera orientation, known local depth recovery, duplicate/same-side rejection, aspect ratio/distance variation, invalid landmarks and a single-view fallback. Canvas texture test checks view exclusion and orientation weighting. These do not establish performance on patient scans. Real-device camera/WebGL testing and comparison with independently measured geometry remain required.

## Measured-depth next step

A native iOS capture module can synchronize RGB and AVDepthData from a supported TrueDepth device, preserve cameraCalibrationData, coordinate conventions, timestamps, depth units/accuracy flags, original image dimensions and transforms. Check actual depth availability; ARKit face-tracking support alone does not imply measured depth. Registration and fusion must reject invalid depth and motion, and retain coverage/uncertainty. Facial capture remains incomplete around scalp/ears/neck.

A cross-platform calibrated-photo path requires per-camera/lens/resolution intrinsic calibration (checkerboard/ChArUco), overlapping images of a static neutral face, estimated camera poses, and an observed known-size reference to establish scale. Intrinsic calibration alone does not establish subject scale. Calibration must be invalidated when cropping, lens, zoom or relevant focus parameters change.

Independent validation requires repeated scans and a suitable reference scanner or controlled measurements, with regional error reported rather than a single 'accuracy percent'. Clinical procedure prediction needs separate validation.

Sources:
- https://github.com/google-ai-edge/mediapipe/wiki/MediaPipe-Face-Mesh
- https://developer.apple.com/documentation/avfoundation/avdepthdata
- https://developer.apple.com/documentation/avfoundation/avcameracalibrationdata
- https://developer.apple.com/documentation/arkit/arfacetrackingconfiguration
- https://docs.opencv.org/4.2.0/d9/d0c/group__calib3d.html
