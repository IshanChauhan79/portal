import * as dat from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";

import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

THREE.ColorManagement.enabled = true;

/**
 * Base
 */
// Debug
const debugObject = {};
// debugObject.clearColor = "#ff0000";
debugObject.clearColor = "#201919";
debugObject.doubleSide = false;
debugObject.portalColorStart = "#000000";
debugObject.portalColorEnd = "#ffffff";

const gui = new dat.GUI({
  width: 400,
});
gui.close();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
// baked texture
const bakedTexture = textureLoader.load("/baked.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;
/**
 * Materials
 */
// Baked Materials
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
  side: null,
});

gui
  .add(debugObject, "doubleSide")
  .name("Double side modal")
  .onChange(() => {
    if (debugObject.doubleSide) {
      bakedMaterial.side = THREE.DoubleSide;
    } else {
      bakedMaterial.side = THREE.null;
    }
  });
gui.add(bakedMaterial, "wireframe");

// Portal Light material
const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart
  );
});

gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

// Pole Light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

/**
 * Portal
 */
gltfLoader.load("/portal.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  const portalLightMesh = gltf.scene.children.find(
    (child) => child.name === "portalLight"
  );
  const poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightA"
  );
  const poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightB"
  );
  bakedMesh.material = bakedMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;
  portalLightMesh.material = portalLightMaterial;

  scene.add(gltf.scene);
});

/**
 * Fireflies
 */

// Fireflies geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);

// Fireflies Material
const firefliesMaterial = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,

  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 140 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
});

// Fireflies Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");

scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(debugObject.clearColor);
renderer.colorSpace = THREE.SRGBColorSpace;

// Clear color

gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // update materials
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalLightMaterial.uniforms.uTime.value = elapsedTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
