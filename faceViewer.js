import * as THREE from './js/three.module.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { OrbitControls } from './js/OrbitControls.js';

let scene;
let camera;
let renderer;
let controls;
let model;

let currentProcedure = 'forehead';

const canvas = document.getElementById('viewer');
const intensitySlider = document.getElementById('intensitySlider');
const recoverySlider = document.getElementById('recoverySlider');
const procedureLabel = document.getElementById('selectedProcedureLabel');

init();
loadModel();
animate();

window.setProcedure = setProcedure;
window.resetView = resetView;
window.goBack = goBack;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / (window.innerHeight * 0.68),
    0.1,
    1000
  );
  camera.position.set(0, 0, 2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight * 0.68);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.25);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);
  controls.minDistance = 1.2;
  controls.maxDistance = 4;
  controls.update();

  window.addEventListener('resize', onWindowResize);

  if (intensitySlider) {
    intensitySlider.addEventListener('input', onIntensityChange);
  }

  if (recoverySlider) {
    recoverySlider.addEventListener('input', onRecoveryChange);
  }

  applyProcedureFromURL();
  updateProcedureLabel();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / (window.innerHeight * 0.68);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.68);
}

function loadModel() {
  const loader = new GLTFLoader();

  loader.load(
    './models/female_head_2.glb',

    function (gltf) {
      model = gltf.scene;

      model.position.set(0, -0.3, 0);
      model.scale.set(1.4, 1.4, 1.4);

      scene.add(model);

      console.log('Model loaded');

      model.traverse((child) => {
        if (child.isMesh) {
          console.log('Mesh:', child.name);

          if (child.morphTargetDictionary) {
            console.log('Morph targets:', child.morphTargetDictionary);
          } else {
            console.log('No morph targets on this mesh');
          }
        }
      });

      onIntensityChange();
      onRecoveryChange();
    },

    undefined,

    function (error) {
      console.error('Model failed to load', error);
    }
  );
}

function applyProcedureFromURL() {
  const params = new URLSearchParams(window.location.search);
  const procedure = params.get('procedure');

  if (!procedure) return;

  const allowed = ['forehead', 'glabella', 'crowsfeet', 'brow', 'lip'];
  if (allowed.includes(procedure)) {
    currentProcedure = procedure;
  }
}

function getProcedureLabel(procedure) {
  switch (procedure) {
    case 'forehead':
      return 'Forehead Botox';
    case 'glabella':
      return '11 Lines';
    case 'crowsfeet':
      return "Crow's Feet";
    case 'brow':
      return 'Brow Lift';
    case 'lip':
      return 'Lip Flip';
    default:
      return 'Forehead Botox';
  }
}

function updateProcedureLabel() {
  if (procedureLabel) {
    procedureLabel.textContent = getProcedureLabel(currentProcedure);
  }
}

function setProcedure(name) {
  currentProcedure = name;
  updateProcedureLabel();
  onIntensityChange();
}

function resetMorphs(child) {
  if (!child.morphTargetInfluences) return;

  for (let i = 0; i < child.morphTargetInfluences.length; i++) {
    child.morphTargetInfluences[i] = 0;
  }
}

function onIntensityChange() {
  if (!model || !intensitySlider) return;

  const value = parseFloat(intensitySlider.value);

  model.traverse((child) => {
    if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
      const dict = child.morphTargetDictionary;
      const influences = child.morphTargetInfluences;

      const smile = dict['Smile'];
      const sad = dict['Sad'];
      const angry = dict['Angry'];
      const worried = dict['Worried'];

      resetMorphs(child);

      if (currentProcedure === 'forehead') {
        if (worried !== undefined) influences[worried] = value * 0.8;
      }

      if (currentProcedure === 'glabella') {
        if (angry !== undefined) influences[angry] = value * 0.7;
        if (worried !== undefined) influences[worried] = value * 0.2;
      }

      if (currentProcedure === 'crowsfeet') {
        if (worried !== undefined) influences[worried] = value * 0.35;
        if (smile !== undefined) influences[smile] = value * 0.15;
      }

      if (currentProcedure === 'brow') {
        if (worried !== undefined) influences[worried] = value * 0.6;
        if (angry !== undefined) influences[angry] = value * 0.3;
      }

      if (currentProcedure === 'lip') {
        if (smile !== undefined) influences[smile] = value * 0.6;
      }

      if (sad !== undefined) influences[sad] = 0;
    }
  });

  onRecoveryChange();
}

function onRecoveryChange() {
  if (!model || !recoverySlider) return;

  const factor = parseFloat(recoverySlider.value) / 100;

  model.traverse((child) => {
    if (child.isMesh && child.morphTargetInfluences) {
      for (let i = 0; i < child.morphTargetInfluences.length; i++) {
        child.morphTargetInfluences[i] *= factor;
      }
    }
  });
}

function resetView() {
  camera.position.set(0, 0, 2);
  controls.target.set(0, 0, 0);
  controls.update();
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = './index.html';
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
