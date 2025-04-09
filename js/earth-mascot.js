import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

class EarthMascot {
  constructor(containerId) {
    this.container = document.getElementById(containerId)
    this.scene = null
    this.camera = null
    this.renderer = null
    this.model = null
    this.mixer = null
    this.clock = new THREE.Clock()
    this.controls = null
    this.isListening = false

    this.init()
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene()

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    this.camera.position.z = 2

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    this.scene.add(directionalLight)

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.25
    this.controls.enableZoom = false
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 1

    // Load the 3D model
    this.loadModel()

    // Start animation loop
    this.animate()

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize())
  }

  loadModel() {
    const loader = new GLTFLoader()

    loader.load(
      "mascot.glb",
      (gltf) => {
        this.model = gltf.scene
        this.scene.add(this.model)

        // Set up animations if available
        if (gltf.animations && gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model)

          gltf.animations.forEach((clip) => {
            this.mixer.clipAction(clip).play()
          })
        }
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
      },
      (error) => {
        console.error("Error loading model:", error)
      },
    )
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    // Update controls
    this.controls.update()

    // Update animations
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta())
    }

    // Adjust rotation speed based on listening state
    if (this.controls) {
      this.controls.autoRotateSpeed = this.isListening ? 3 : 1
    }

    // Render scene
    this.renderer.render(this.scene, this.camera)
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  setListening(listening) {
    this.isListening = listening

    // Show/hide listening indicator
    const indicator = document.querySelector(".listening-indicator")
    if (indicator) {
      if (listening) {
        indicator.classList.remove("hidden")
      } else {
        indicator.classList.add("hidden")
      }
    }
  }
}
