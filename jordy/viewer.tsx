import { state, effect } from "./../src/framework/core"
import { createElement } from "./../src/framework/render"
import * as THREE from "./three.module.js"
import { OrbitControls } from "./OrbitControls.js"
import { OBJLoader } from "./OBJLoader.js"
import { MTLLoader } from "./MTLLoader.js"
import { FBXLoader } from "./FBXLoader.js"
import { DragControls } from "./DragControls.js" // Ensure this is included

export function Viewer({
  rotation,
  materials,
  lightHelpers,
  shadows,
  backdrop,
  color,
  lightIntensity,
}) {
  const sceneState = state(null)
  const cameraState = state(null)
  const rendererState = state(null)
  const controlsState = state(null)
  const modelState = state(null)
  const isRotatingState = state(false)
  const materialsVisibleState = state(true)
  const customPathState = state([])
  const isRecordingState = state(false)

  const spotlightColors = [
    0xffe0b2, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff,
  ]
  const currentColorIndexState = state({ main: 0, left: 0, right: 0 })

  effect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    )
    camera.position.set(0, 150, 300)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enableRotate = true
    controls.rotateSpeed = 0.1
    controls.enablePan = true

    sceneState.value = scene
    cameraState.value = camera
    rendererState.value = renderer
    controlsState.value = controls

    document.body.appendChild(renderer.domElement)

    setupScene(scene, camera, renderer)

    function animate() {
      requestAnimationFrame(animate)
      if (isRotatingState.value && modelState.value) {
        modelState.value.rotation.y += 0.01
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    setupEventListeners()

    return () => {
      document.body.removeChild(renderer.domElement)
      removeEventListeners()
    }
  }, [])

  function setupScene(scene, camera, renderer) {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(500, 500)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const mainSpotLight = createSpotlight(0, 300, 300)
    const leftSpotLight = createSpotlight(-300, 300, 300)
    const rightSpotLight = createSpotlight(300, 300, 300)

    scene.add(mainSpotLight, leftSpotLight, rightSpotLight)

    // Light helpers
    const mainSpotLightHelper = new THREE.SpotLightHelper(mainSpotLight)
    const leftSpotLightHelper = new THREE.SpotLightHelper(leftSpotLight)
    const rightSpotLightHelper = new THREE.SpotLightHelper(rightSpotLight)

    scene.add(mainSpotLightHelper, leftSpotLightHelper, rightSpotLightHelper)

    // Drag controls for lights
    const mainLightHandle = createLightHandle(mainSpotLight.position, 0xff0000)
    const leftLightHandle = createLightHandle(leftSpotLight.position, 0x00ff00)
    const rightLightHandle = createLightHandle(
      rightSpotLight.position,
      0x0000ff,
    )

    scene.add(mainLightHandle, leftLightHandle, rightLightHandle)

    const dragControls = new DragControls(
      [mainLightHandle, leftLightHandle, rightLightHandle],
      camera,
      renderer.domElement,
    )

    setupDragControls(dragControls, [
      mainSpotLight,
      leftSpotLight,
      rightSpotLight,
    ])
  }

  function createSpotlight(x, y, z) {
    const spotLight = new THREE.SpotLight(0xffffff, 1)
    spotLight.position.set(x, y, z)
    spotLight.castShadow = true
    spotLight.angle = Math.PI / 4
    spotLight.penumbra = 0.5
    spotLight.decay = 2
    spotLight.distance = 1000
    return spotLight
  }

  function createLightHandle(position, color) {
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color, opacity: 0, transparent: true }),
    )
    handle.position.copy(position)
    return handle
  }

  function setupDragControls(dragControls, spotLights) {
    dragControls.addEventListener(
      "dragstart",
      () => (controlsState.value.enabled = false),
    )
    dragControls.addEventListener(
      "dragend",
      () => (controlsState.value.enabled = true),
    )
    dragControls.addEventListener("drag", (event) => {
      const index = dragControls.getObjects().indexOf(event.object)
      if (index !== -1) {
        spotLights[index].position.copy(event.object.position)
      }
    })
  }

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (fileName.endsWith(".obj")) {
      handleOBJFile(file)
    }
  }

  function handleOBJFile(file) {
    const objLoader = new OBJLoader()
    const reader = new FileReader()

    reader.onload = (e) => {
      const contents = e.target.result
      const object = objLoader.parse(contents)
      setupModel(object)
    }

    reader.readAsText(file)
  }

  function setupModel(object) {
    if (modelState.value) {
      sceneState.value.remove(modelState.value)
    }

    placeOnFloor(object)
    scaleModel(object)
    storeOriginalMaterials(object)

    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    modelState.value = object
    sceneState.value.add(object)
  }

  function setupEventListeners() {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleResize)
  }

  function removeEventListeners() {
    window.removeEventListener("keydown", handleKeyDown)
    window.removeEventListener("resize", handleResize)
  }

  function placeOnFloor(object) {
    let minY = Infinity
    object.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry
        const position = geometry.attributes.position
        for (let i = 0; i < position.count; i++) {
          minY = Math.min(minY, position.getY(i))
        }
      }
    })
    object.position.y -= minY
  }

  function scaleModel(object) {
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = 150 / maxDimension
    object.scale.multiplyScalar(scale)
  }

  function storeOriginalMaterials(object) {
    object.traverse(function (child) {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          // If the material is an array (multi-material), clone each material in the array
          child.userData.originalMaterial = child.material.map((mat) => {
            return mat.clone ? mat.clone() : mat
          })
        } else if (
          child.material &&
          typeof child.material.clone === "function"
        ) {
          // If the material has a clone function, clone it
          child.userData.originalMaterial = child.material.clone()
        } else {
          // If no clone function, just store the material reference
          child.userData.originalMaterial = child.material
        }
      }
    })
  }

  function toggleMaterials() {
    if (!modelState.value) return

    materialsVisibleState.value = !materialsVisibleState.value

    modelState.value.traverse((child) => {
      if (child.isMesh) {
        if (materialsVisibleState.value) {
          child.material = child.userData.originalMaterial
        } else {
          child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc })
        }
      }
    })
  }

  function toggleShadows(enable) {
    sceneState.value.traverse((object) => {
      if (object.isLight) {
        object.castShadow = enable
      } else if (object.isMesh) {
        object.castShadow = enable
        object.receiveShadow = enable
      }
    })
  }

  function switchBackdrop() {
    // Implement backdrop switching logic here
  }

  function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case "r":
        isRotatingState.value = !isRotatingState.value
        break
      case "m":
        toggleMaterials()
        break
      case "s":
        toggleShadows(!shadows.value)
        break
      case "b":
        switchBackdrop()
        break
      case "p":
        takeScreenshot()
        break
      // Add more keyboard shortcuts as needed
    }
  }

  function handleResize() {
    const camera = cameraState.value
    const renderer = rendererState.value
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }

  function takeScreenshot() {
    const renderer = rendererState.value
    if (renderer) {
      const imgData = renderer.domElement.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = imgData
      link.download = "screenshot.png"
      link.click()
    }
  }

  return (
    <div>
      <input type="file" id="fileInput" onChange={handleFileSelect} />
      {/* Add more UI elements as needed */}
    </div>
  )
}
