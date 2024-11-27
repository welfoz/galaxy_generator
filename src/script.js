import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// const axesHelpers = new THREE.AxesHelper(4)
// scene.add(axesHelpers)

const parameters = {
    count: {value: 10000, min: 1000, max: 100000},
    size: {value: 0.01, min: 0.001, max: 0.1},
    branchNumber: {value: 2, min: 1, max: 20},
    radius: {value: 5, min: 1, max: 50},
    a: {value: 2, min: 0, max: 10},
    b: {value: 2, min: 0, max: 10},
    margin: {value: 2, min: 0, max: 10},
    rotationX: {value: 0, min: 0, max: 0.2},
    rotationY: {value: 0, min: 0, max: 0.2},
    rotationZ: {value: 0, min: 0, max: 0.2},
    puissance: {value: 1, min: 1, max: 50},
    bold: {value: 0.1, min: 0, max: 0.5},
    div: {value: 7 / 100, min: 0.01, max: 0.2},
    // particule density, up => more particules around the origin 
    dispersion: {value: 0, min: 0, max: 3},
    centerDispersion: {value: 1.1, min: 0, max: 5},
    insideColor: {value: "#ff0000", min: "#000000", max: "#ffffff"},
    outsideColor: {value: "#00ccff", min: "#000000", max: "#ffffff"},
    colorGradient: {value: 0, min: -1, max: 1}
}

const functions = {
    random: () => {
        // Helper function to get random number in range
        const getRandom = (min, max) => Math.random() * (max - min) + min;
        // Helper function to get random hex color
        const getRandomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);
        
        for (const key in parameters) {
            if (key === 'insideColor' || key === 'outsideColor') {
                parameters[key].value = getRandomColor();
            } else {
                parameters[key].value = getRandom(parameters[key].min, parameters[key].max);
            }
        }
        galaxyGenerator();
    }
}

let particuleGeometry = null;
let particuleMaterial = null;
let particuleMesh = null;

const galaxyGenerator = () => {
    
    if (particuleGeometry != null) {
        particuleGeometry.dispose()
        particuleMaterial.dispose()
        scene.remove(particuleMesh)
    }
    
    particuleGeometry = new THREE.BufferGeometry()
    const particules = new Float32Array(parameters.count.value * 3)
    const colors = new Float32Array(parameters.count.value * 3)
    
    
    // compute particules and colors
    const nbOfParticulePerBranch = Math.floor(parameters.count.value / parameters.branchNumber.value)
    const increment = parameters.branchNumber.value * parameters.radius.value / parameters.count.value
    const angle = 2 * Math.PI / parameters.branchNumber.value
    let theta = angle
    const boldFactor = parameters.bold.value / (parameters.div.value * nbOfParticulePerBranch)
    
    // color
    const insideColor = new THREE.Color(parameters.insideColor.value)
    const outsideColor = new THREE.Color(parameters.outsideColor.value)

    for (let j = 0; j < parameters.branchNumber.value; j++) {
        // compute branch
        for (let i = 0; i < nbOfParticulePerBranch; i++) {
            const i3 = i * 3 + nbOfParticulePerBranch * 3 * j
           
            // position
            const iDispersion =  i * Math.pow(i / nbOfParticulePerBranch, parameters.dispersion.value)
            const x = increment * iDispersion
            const newR = (parameters.radius.value * Math.pow(iDispersion, parameters.puissance.value)) / (Math.pow(nbOfParticulePerBranch, parameters.puissance.value))
            const centerDispersion = Math.pow(Math.random(), parameters.centerDispersion.value) 
            
            // oldX and oldZ are there to rotate the branch of theta
            const oldX = newR * Math.cos(parameters.a.value * x) + (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            const oldZ = newR * Math.sin(parameters.b.value * x) + (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            particules[i3 + 0] = Math.cos(theta) * oldX + Math.sin(theta) * oldZ
            particules[i3 + 1] = (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            particules[i3 + 2] = - Math.sin(theta) * oldX + Math.cos(theta) * oldZ
    
            // color
            const gradient = (x / parameters.radius.value) + parameters.colorGradient.value
            const mixColor = insideColor.clone().lerp(outsideColor, gradient > 1? 1: gradient < 0? 0: gradient)

            colors[i3 + 0] = mixColor.r
            colors[i3 + 1] = mixColor.g
            colors[i3 + 2] = mixColor.b
        }   
        theta += angle 

    } 
    particuleGeometry.setAttribute("position", new THREE.BufferAttribute(particules, 3))
    particuleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    /**
     * Particule Material
     */
    particuleMaterial = new THREE.PointsMaterial({
        size: parameters.size.value,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    
    particuleMesh = new THREE.Points(particuleGeometry, particuleMaterial)
    scene.add(particuleMesh)
}

galaxyGenerator()

/**
 * GUI
 */
gui.add(parameters.count, "value", parameters.count.min, parameters.count.max, 100).onFinishChange(() => {galaxyGenerator()}).name("Star Count")
gui.add(parameters.size, "value", parameters.size.min, parameters.size.max, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Star Size")
gui.add(parameters.radius, "value", parameters.radius.min, parameters.radius.max, 1).onFinishChange(() => {galaxyGenerator()}).name("Galaxy Radius")

const branchFolder = gui.addFolder("Branch")
branchFolder.add(parameters.branchNumber, "value", parameters.branchNumber.min, parameters.branchNumber.max, 1).onFinishChange(() => {galaxyGenerator()}).name("Branch Count")
branchFolder.add(parameters.puissance, "value", parameters.puissance.min, parameters.puissance.max, 0.5).onFinishChange(() => {galaxyGenerator()}).name("Branch Flatness")
branchFolder.add(parameters.margin, "value", parameters.margin.min, parameters.margin.max, 1).onFinishChange((value) => {
    parameters.a.value = value
    parameters.b.value = value
    galaxyGenerator()
}).name("Spiral Proximity")


const distributionFolder = gui.addFolder("Distribution")
distributionFolder.add(parameters.bold, "value", parameters.bold.min, parameters.bold.max, 0.001).onFinishChange(() => {galaxyGenerator()}).name("Star Randomness")
distributionFolder.add(parameters.dispersion, "value", parameters.dispersion.min, parameters.dispersion.max, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Origin Density")
distributionFolder.add(parameters.centerDispersion, "value", parameters.centerDispersion.min, parameters.centerDispersion.max, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Middle Branch Density")
distributionFolder.close()

const rotationFolder = gui.addFolder("Rotation")
rotationFolder.add(parameters.rotationX, "value", parameters.rotationX.min, parameters.rotationX.max, 0.001).onFinishChange(() => {galaxyGenerator()}).name("X Rotation")
rotationFolder.add(parameters.rotationY, "value", parameters.rotationY.min, parameters.rotationY.max, 0.001).onFinishChange(() => {galaxyGenerator()}).name("Y Rotation")
rotationFolder.add(parameters.rotationZ, "value", parameters.rotationZ.min, parameters.rotationZ.max, 0.001).onFinishChange(() => {galaxyGenerator()}).name("Z Rotation")
rotationFolder.close()

const colorFolder = gui.addFolder("Color")
colorFolder.addColor(parameters.insideColor, "value").onFinishChange(() => {galaxyGenerator()}).name("Inside Color")    
colorFolder.addColor(parameters.outsideColor, "value").onFinishChange(() => {galaxyGenerator()}).name("Outside Color")
colorFolder.add(parameters.colorGradient, "value", parameters.colorGradient.min, parameters.colorGradient.max, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Color Gradient")
colorFolder.close()

const advancedFolder = gui.addFolder("Advanced")
advancedFolder.add(parameters.a, "value", parameters.a.min, parameters.a.max, 1).onFinishChange(() => {galaxyGenerator()}).name("A")
advancedFolder.add(parameters.b, "value", parameters.b.min, parameters.b.max, 1).onFinishChange(() => {galaxyGenerator()}).name("B")
advancedFolder.close()

gui.add(functions, "random").name("Random Generator");

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)
camera.position.x = 0
camera.position.y = 10
camera.position.z = 0
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.maxDistance = 50
controls.minDistance = 0.1

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const tick = () =>
{
    particuleMesh.rotateY(parameters.rotationY.value)
    particuleMesh.rotateX(parameters.rotationX.value)
    particuleMesh.rotateZ(parameters.rotationZ.value)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()