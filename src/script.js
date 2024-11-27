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
  count: { value: null, defaultValue: 10000, min: 1000, max: 100000 },
  size: { value: null, defaultValue: 0.01, min: 0.001, max: 0.1 },
  branchNumber: { value: null, defaultValue: 2, min: 1, max: 20 },
  radius: { value: null, defaultValue: 5, min: 1, max: 50 },
  a: { value: null, defaultValue: 2, min: 0, max: 10 },
  b: { value: null, defaultValue: 2, min: 0, max: 10 },
  margin: { value: null, defaultValue: 2, min: 0, max: 10 },
  rotationX: { value: null, defaultValue: 0, min: 0, max: 0 },
  rotationY: { value: null, defaultValue: 0, min: 0, max: 0.05 },
  rotationZ: { value: null, defaultValue: 0, min: 0, max: 0 },
  puissance: { value: null, defaultValue: 1, min: 1, max: 50 },
  bold: { value: null, defaultValue: 0.1, min: 0, max: 0.5 },
  div: { value: null, defaultValue: 7 / 100, min: 0.01, max: 0.2 },
  dispersion: { value: null, defaultValue: 0, min: 0, max: 3 },
  centerDispersion: { value: null, defaultValue: 1.1, min: 0, max: 5 },
  insideColor: { value: null, defaultValue: "#ff0000", min: "#000000", max: "#ffffff" },
  outsideColor: { value: null, defaultValue: "#00ccff", min: "#000000", max: "#ffffff" },
  colorGradient: { value: null, defaultValue: 0, min: -1, max: 1 },
};

const functions = {
  random: () => {
    // Helper function to get random number in range
    const getRandom = (min, max) => Math.random() * (max - min) + min;
    // Helper function to get random hex color
    const getRandomColor = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16);

    for (const key in params) {
      if (key === "insideColor" || key === "outsideColor") {
        params[key].value = getRandomColor();
      } else {
        params[key].value = getRandom(params[key].min, params[key].max);
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
  gui
    .add(params.count, "value", params.count.min, params.count.max, 100)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Star Count")
    .listen();
  gui
    .add(params.size, "value", params.size.min, params.size.max, 0.01)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Star Size")
    .listen();
  gui
    .add(params.radius, "value", params.radius.min, params.radius.max, 1)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Galaxy Radius")
    .listen();

  const branchFolder = gui.addFolder("Branch");
  branchFolder
    .add(
      params.branchNumber,
      "value",
      params.branchNumber.min,
      params.branchNumber.max,
      1
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Branch Count")
    .listen();
  branchFolder
    .add(
      params.puissance,
      "value",
      params.puissance.min,
      params.puissance.max,
      0.5
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Branch Flatness")
    .listen();
  branchFolder
    .add(params.margin, "value", params.margin.min, params.margin.max, 1)
    .onFinishChange((value) => {
      params.a.value = value;
      params.b.value = value;
      galaxyGenerator();
    })
    .name("Spiral Proximity")
    .listen();

  const distributionFolder = gui.addFolder("Distribution");
  distributionFolder
    .add(params.bold, "value", params.bold.min, params.bold.max, 0.001)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Star Randomness")
    .listen();
  distributionFolder
    .add(
      params.dispersion,
      "value",
      params.dispersion.min,
      params.dispersion.max,
      0.01
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Origin Density")
    .listen();
  distributionFolder
    .add(
      params.centerDispersion,
      "value",
      params.centerDispersion.min,
      params.centerDispersion.max,
      0.01
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Middle Branch Density")
    .listen();

  const rotationFolder = gui.addFolder("Rotation");
  rotationFolder
    .add(
      params.rotationX,
      "value",
      params.rotationX.min,
      params.rotationX.max,
      0.001
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("X Rotation")
    .listen();
  rotationFolder
    .add(
      params.rotationY,
      "value",
      params.rotationY.min,
      params.rotationY.max,
      0.001
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Y Rotation")
    .listen();
  rotationFolder
    .add(
      params.rotationZ,
      "value",
      params.rotationZ.min,
      params.rotationZ.max,
      0.001
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Z Rotation")
    .listen();

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
  colorFolder
    .add(
      params.colorGradient,
      "value",
      params.colorGradient.min,
      params.colorGradient.max,
      0.01
    )
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("Color Gradient")
    .listen();

  const advancedFolder = gui.addFolder("Advanced");
  advancedFolder
    .add(params.a, "value", params.a.min, params.a.max, 1)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("A")
    .listen();
  advancedFolder
    .add(params.b, "value", params.b.min, params.b.max, 1)
    .onFinishChange(() => {
      galaxyGenerator();
    })
    .name("B")
    .listen();
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
