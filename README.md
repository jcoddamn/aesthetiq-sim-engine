# AesthetIQ

Educational cosmetic procedure exploration and 2D/3D visualization using MediaPipe and Three.js. Simulated outcomes are not clinically validated.

## Local development

Serve this directory over localhost (for example, `python -m http.server 8765`) and open `http://localhost:8765/`. Camera access requires a secure context or localhost. Preview models and rendering assets load from third-party CDNs.

The app is static; npm dependencies are development/test tools only. Use Node 22.12 or newer:

```
npm ci
npm test
npm run test:ui
```

`npm run format:product` formats the shared product files. The DOM suite does not replace mobile, camera or WebGL browser testing.

## Structure

- `index.html`: canonical home; `home.html` redirects here.
- `procedures.html` / `procedure.html`: catalog and details.
- `simulation.html`, `body-simulation.html`, `viewer.html`: preview experiences.
- `saved.html` / `about.html`: local shortlist and product/data notes.
- `css/product.css` / `js/productUI.js`: shared visual system and navigation/accessibility behavior.
- `js/clinicalMeasurementRegistry.js`: 54-procedure research endpoint requirements.
- `measurement-workbench.html` / `clinical-evidence-audit.html`: localhost-only research tools.

See `docs/product-polish-qa.md` for delivered changes and pending device checks, and `research/measurement_protocol_v3.md` for measurement methods and limits. Never commit patient images, raw cases, exported private reports or secrets.
