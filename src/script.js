import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// const axesHelpers = new THREE.AxesHelper(4)
// scene.add(axesHelpers)

const params = {
  count: { value: null, defaultValue: 10000, min: 1000, max: 100000, precision: 100, name: "Star Count" },
  size: { value: null, defaultValue: 0.01, min: 0.001, max: 0.1, precision: 0.01, name: "Star Size" },
  branchNumber: { value: null, defaultValue: 2, min: 1, max: 20, precision: 1, name: "Branch Count" },
  radius: { value: null, defaultValue: 5, min: 1, max: 50, precision: 1, name: "Galaxy Radius" },
  a: { value: null, defaultValue: 2, min: 0, max: 20, precision: 0.01, name: "A" },
  b: { value: null, defaultValue: 2, min: 0, max: 20, precision: 0.01, name: "B" },
  margin: { value: null, defaultValue: 2, min: 0, max: 10, precision: 1, name: "Spiral Proximity" },
  rotationX: { value: null, defaultValue: 0, min: 0, max: 0, precision: 0.001, name: "X Rotation" },
  rotationY: { value: null, defaultValue: 0, min: 0, max: 0.05, precision: 0.001, name: "Y Rotation" },
  rotationZ: { value: null, defaultValue: 0, min: 0, max: 0, precision: 0.001, name: "Z Rotation" },
  puissance: { value: null, defaultValue: 1, min: 1, max: 50, precision: 0.5, name: "Branch Flatness" },
  bold: { value: null, defaultValue: 0.1, min: 0, max: 0.5, precision: 0.001, name: "Star Randomness" },
  div: { value: null, defaultValue: 7 / 100, min: 0.01, max: 0.2, precision: 0.01, name: "Division" },
  dispersion: { value: null, defaultValue: 0, min: 0, max: 3, precision: 0.01, name: "Origin Density" },
  centerDispersion: { value: null, defaultValue: 1.1, min: 0, max: 5, precision: 0.01, name: "Middle Branch Density" },
  insideColor: { value: null, defaultValue: "#ff0000", min: "#000000", max: "#ffffff", name: "Inside Color" },
  outsideColor: { value: null, defaultValue: "#00ccff", min: "#000000", max: "#ffffff", name: "Outside Color" },
  colorGradient: { value: null, defaultValue: 0, min: -1, max: 1, precision: 0.01, name: "Color Gradient" },
};

const functions = {
  random: () => {
    // Helper function to get random number in range with precision
    const getRandom = (min, max, precision) => {
      const random = Math.random() * (max - min) + min;
      return precision ? Math.round(random / precision) * precision : random;
    };
    // Helper function to get random hex color
    const getRandomColor = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16);

    for (const key in params) {
      if (key === "insideColor" || key === "outsideColor") {
        params[key].value = getRandomColor();
      } else {
        params[key].value = getRandom(
          params[key].min,
          params[key].max,
          params[key].precision
        );
      }
    }
    galaxyGenerator();
  },
  reset: () => {
    for (const key in params) {
      params[key].value = params[key].defaultValue;
    }
    galaxyGenerator();
  },
};

let particuleGeometry = null;
let particuleMaterial = null;
let particuleMesh = null;

const galaxyGenerator = () => {
  if (particuleGeometry != null) {
    particuleGeometry.dispose();
    particuleMaterial.dispose();
    scene.remove(particuleMesh);
  }

  particuleGeometry = new THREE.BufferGeometry();
  const particules = new Float32Array(params.count.value * 3);
  const colors = new Float32Array(params.count.value * 3);

  // compute particules and colors
  const nbOfParticulePerBranch = Math.floor(
    params.count.value / params.branchNumber.value
  );
  const increment =
    (params.branchNumber.value * params.radius.value) / params.count.value;
  const angle = (2 * Math.PI) / params.branchNumber.value;
  let theta = angle;
  const boldFactor =
    params.bold.value / (params.div.value * nbOfParticulePerBranch);

  // color
  const insideColor = new THREE.Color(params.insideColor.value);
  const outsideColor = new THREE.Color(params.outsideColor.value);

  for (let j = 0; j < params.branchNumber.value; j++) {
    // compute branch
    for (let i = 0; i < nbOfParticulePerBranch; i++) {
      const i3 = i * 3 + nbOfParticulePerBranch * 3 * j;

      // position
      const iDispersion =
        i * Math.pow(i / nbOfParticulePerBranch, params.dispersion.value);
      const x = increment * iDispersion;
      const newR =
        (params.radius.value * Math.pow(iDispersion, params.puissance.value)) /
        Math.pow(nbOfParticulePerBranch, params.puissance.value);
      const centerDispersion = Math.pow(
        Math.random(),
        params.centerDispersion.value
      );

      // oldX and oldZ are there to rotate the branch of theta
      const oldX =
        newR * Math.cos(params.a.value * x) +
        (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion;
      const oldZ =
        newR * Math.sin(params.b.value * x) +
        (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion;
      particules[i3 + 0] = Math.cos(theta) * oldX + Math.sin(theta) * oldZ;
      particules[i3 + 1] =
        (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion;
      particules[i3 + 2] = -Math.sin(theta) * oldX + Math.cos(theta) * oldZ;

      // color
      const gradient = x / params.radius.value + params.colorGradient.value;
      const mixColor = insideColor
        .clone()
        .lerp(outsideColor, gradient > 1 ? 1 : gradient < 0 ? 0 : gradient);

      colors[i3 + 0] = mixColor.r;
      colors[i3 + 1] = mixColor.g;
      colors[i3 + 2] = mixColor.b;
    }
    theta += angle;
  }
  particuleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particules, 3)
  );
  particuleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  /**
   * Particule Material
   */
  particuleMaterial = new THREE.PointsMaterial({
    size: params.size.value,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  particuleMesh = new THREE.Points(particuleGeometry, particuleMaterial);
  scene.add(particuleMesh);
};

/**
 * GUI
 */
const guiInit = () => {
  const guiAdd = (key) => {
    return gui
      .add(params[key], "value", params[key].min, params[key].max, params[key].precision)
      .onFinishChange(() => {
        galaxyGenerator();
      })
      .name(params[key].name)
      .listen();
  };

  const guiAddToFolder = (folder, key) => {
    return folder.add(params[key], "value", params[key].min, params[key].max, params[key].precision)
      .onFinishChange(() => {
        galaxyGenerator();
      })
      .name(params[key].name)
      .listen();
  };

  guiAdd("count");
  guiAdd("size");
  guiAdd("radius");

  const branchFolder = gui.addFolder("Branch");
  guiAddToFolder(branchFolder, "branchNumber");
  guiAddToFolder(branchFolder, "puissance");
  guiAddToFolder(branchFolder, "margin");


  const distributionFolder = gui.addFolder("Distribution");
  guiAddToFolder(distributionFolder, "bold");
  guiAddToFolder(distributionFolder, "dispersion");
  guiAddToFolder(distributionFolder, "centerDispersion");

  const rotationFolder = gui.addFolder("Rotation");
  guiAddToFolder(rotationFolder, "rotationX");
  guiAddToFolder(rotationFolder, "rotationY");
  guiAddToFolder(rotationFolder, "rotationZ");

  const colorFolder = gui.addFolder("Color");
  colorFolder
    .addColor(params.insideColor, "value")
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Inside Color")
    .listen();
  colorFolder
    .addColor(params.outsideColor, "value")
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Outside Color")
    .listen();
  guiAddToFolder(colorFolder, "colorGradient");

  const advancedFolder = gui.addFolder("Advanced");
  guiAddToFolder(advancedFolder, "a");
  guiAddToFolder(advancedFolder, "b");
  advancedFolder.close();

  gui.add(functions, "random").name("Random Generator");
  gui.add(functions, "reset").name("Reset");

  // close gui
  gui.close();
};

// init params randomly and init gui
functions.random();
guiInit();

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

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  200
);
camera.position.x = 0;
camera.position.y = 10;
camera.position.z = 0;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxDistance = 50;
controls.minDistance = 0.1;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () => {
  particuleMesh.rotateY(params.rotationY.value);
  particuleMesh.rotateX(params.rotationX.value);
  particuleMesh.rotateZ(params.rotationZ.value);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
