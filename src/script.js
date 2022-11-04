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
    count: 10000,
    size: 0.01,
    branchNumber: 2,
    radius: 5,
    a: 2,
    b: 2,
    margin: 2,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    puissance: 1,
    bold: 0.1,
    div: 7 / 100,
    // particule density, up => more particules around the origin 
    dispersion: 0,
    centerDispersion: 1.1,
    insideColor: "#ff0000",
    outsideColor: "#00ccff",
    colorGradient: 0,
    hypnose: {
        enable: false,
        directionUp: true,
        min: 2,
        max: 5,
        previousTime: 0
    }
}
const functions = {
    addPow: () => {
        parameters.puissance++;
        galaxyGenerator()
    },
    subPow: () => {
        parameters.puissance--;
        galaxyGenerator()
    },
    enableHypnose: () => {
        parameters.hypnose.enable == true? parameters.hypnose.enable = false: parameters.hypnose.enable = true
    },
    reset: () => {
        gui.reset()
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
    const particules = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    
    
    // compute particules and colors
    const nbOfParticulePerBranch = Math.floor(parameters.count / parameters.branchNumber)
    const increment = parameters.branchNumber * parameters.radius / parameters.count
    const angle = 2 * Math.PI / parameters.branchNumber
    let theta = angle
    const boldFactor = parameters.bold / (parameters.div * nbOfParticulePerBranch)
    
    // color
    const insideColor = new THREE.Color(parameters.insideColor)
    const outsideColor = new THREE.Color(parameters.outsideColor)

    for (let j = 0; j < parameters.branchNumber; j++) {
        // compute branch
        for (let i = 0; i < nbOfParticulePerBranch; i++) {
            const i3 = i * 3 + nbOfParticulePerBranch * 3 * j
           
            // position
            const iDispersion =  i * Math.pow(i / nbOfParticulePerBranch, parameters.dispersion)
            const x = increment * iDispersion
            const newR = (parameters.radius * Math.pow(iDispersion, parameters.puissance)) / (Math.pow(nbOfParticulePerBranch, parameters.puissance))
            const centerDispersion = Math.pow(Math.random(), parameters.centerDispersion) 
            
            // oldX and oldZ are there to rotate the branch of theta
            const oldX = newR * Math.cos(parameters.a * x) + (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            const oldZ = newR * Math.sin(parameters.b * x) + (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            particules[i3 + 0] = Math.cos(theta) * oldX + Math.sin(theta) * oldZ
            particules[i3 + 1] = (Math.random() - 0.5) * iDispersion * boldFactor * centerDispersion 
            particules[i3 + 2] = - Math.sin(theta) * oldX + Math.cos(theta) * oldZ
    
            // color
            const gradient = (x / parameters.radius) + parameters.colorGradient
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
        size: parameters.size,
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
gui.add(parameters, "count", 1, 100000, 100).onFinishChange(() => {galaxyGenerator()}).name("Star Count")
gui.add(parameters, "size", 0.01, 0.5, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Star Size")
gui.add(parameters, "radius", 1, 50, 1).onFinishChange(() => {galaxyGenerator()}).name("Galaxy Radius")

const branchFolder = gui.addFolder("Branch")
branchFolder.add(parameters, "branchNumber", 1, 20, 1).onFinishChange(() => {galaxyGenerator()}).name("Branch Count")
branchFolder.add(parameters, "puissance", 1, 50, 0.5).onFinishChange(() => {galaxyGenerator()}).name("Branch Flatness")
branchFolder.add(parameters, "margin", 0, 10, 1).onFinishChange((value) => {
    parameters.a = value
    parameters.b = value
    galaxyGenerator()
}).name("Spiral Proximity")


const distributionFolder = gui.addFolder("Distribution")
distributionFolder.add(parameters, "bold", 0, 0.5, 0.001).onFinishChange(() => {galaxyGenerator()}).name("Star Randomness")
distributionFolder.add(parameters, "dispersion", 0, 3, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Origin Density")
distributionFolder.add(parameters, "centerDispersion", 0, 5, 0.01).onFinishChange(() => {galaxyGenerator()}).name("Middle Branch Density")
distributionFolder.close()

const rotationFolder = gui.addFolder("Rotation")
rotationFolder.add(parameters, "rotationX", 0, 1, 0.001).onFinishChange(() => {galaxyGenerator()})
rotationFolder.add(parameters, "rotationY", 0, 1, 0.001).onFinishChange(() => {galaxyGenerator()})
rotationFolder.add(parameters, "rotationZ", 0, 1, 0.001).onFinishChange(() => {galaxyGenerator()})
rotationFolder.close()

const colorFolder = gui.addFolder("Color")
colorFolder.addColor(parameters, "insideColor").onFinishChange(() => {galaxyGenerator()})
colorFolder.addColor(parameters, "outsideColor").onFinishChange(() => {galaxyGenerator()})
colorFolder.add(parameters, "colorGradient", -1, 1, 0.01).onFinishChange(() => {galaxyGenerator()})
colorFolder.close()

const advancedFolder = gui.addFolder("Advanced")
advancedFolder.add(parameters, "a", 0, 10, 1).onFinishChange(() => {galaxyGenerator()}).listen()
advancedFolder.add(parameters, "b", 0, 10, 1).onFinishChange(() => {galaxyGenerator()}).listen()
advancedFolder.add(functions, "enableHypnose")
advancedFolder.close()

gui.add(functions, "reset")

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
const clock = new THREE.Clock()
function hypnose(elapsedTime) {
    if (elapsedTime - parameters.hypnose.previousTime > 1) {
        parameters.hypnose.previousTime = elapsedTime
        if (parameters.hypnose.directionUp) {
            if (parameters.hypnose.max > parameters.puissance) {
                return functions.addPow()
            }
            parameters.hypnose.directionUp = false
            return functions.subPow()
        } else {
            if (parameters.hypnose.min < parameters.puissance) {
                return functions.subPow()
            }
            parameters.hypnose.directionUp = true
            return functions.addPow()
        }
    }
}

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    if (parameters.hypnose.enable) {
        hypnose(elapsedTime)
    }
    particuleMesh.rotateY(parameters.rotationY)
    particuleMesh.rotateX(parameters.rotationX)
    particuleMesh.rotateZ(parameters.rotationZ)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()