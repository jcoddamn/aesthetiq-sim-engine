import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Load GLB model
const loader = new GLTFLoader();
let model;

loader.load(
  "models/female_head_2.glb",
  function(gltf){
    console.log("GLB loaded successfully");
    model = gltf.scene;
    scene.add(model);
  },
  function(xhr){
    if(xhr.total) console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function(error){
    console.error("Model failed to load:", error);
  }
);

// Basic lighting
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
light.position.set(0, 20, 0);
scene.add(light);

// Animation loop
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});