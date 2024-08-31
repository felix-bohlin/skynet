import * as THREE from "./three.module.js"
import { OrbitControls } from "./OrbitControls.js"
import { OBJLoader } from "./OBJLoader.js"
import { DragControls } from "./DragControls.js" // Ensure this is included

// Scene, Camera, and Renderer
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
document.body.appendChild(renderer.domElement)

const spotlightColors = [
  0xffe0b2, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff,
]
let currentColorIndex = 0

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enableZoom = true
controls.enableRotate = true
controls.rotateSpeed = 0.1
controls.enablePan = true

// Studio Floor
const floorGeometry = new THREE.PlaneGeometry(500, 500)
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  side: THREE.DoubleSide,
})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const backdropGeometry = new THREE.PlaneGeometry(500, 300)
const backdropMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial)
backdrop.position.z = -150
backdrop.position.y = 150
backdrop.receiveShadow = true

// Option 2: Curved Backdrop
let curvedBackdrop = createCurvedBackdrop()

// Option 3: Cylindrical Backdrop
let cylindricalBackdrop = createCylindricalBackdrop()

let currentBackdrop = 0 // 0: Flat, 1: Curved, 2: Cylindrical

function createCurvedBackdrop() {
  const curvedGeometry = new THREE.PlaneGeometry(500, 500, 50, 50)

  // Access the position attribute of the geometry
  const position = curvedGeometry.attributes.position

  // Modify the vertex positions to create a curve
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)

    if (y > 0) {
      position.setZ(i, Math.pow(Math.abs(y), 2) * 0.0025) // Curves up from the floor to the wall
    }
    if (Math.abs(x) > 200) {
      position.setX(i, x * 0.75) // Slightly curve in the sides
    }
  }

  // Need to recompute normals after modifying vertex positions
  curvedGeometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(curvedGeometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  return mesh
}

function createCylindricalBackdrop() {
  const geometry = new THREE.CylinderGeometry(500, 500, 300, 50, 1, true)
  geometry.scale(-1, 1, 1) // Invert the cylinder to be viewed from inside
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = Math.PI / 2
  mesh.position.y = 150
  mesh.receiveShadow = true
  return mesh
}

function switchBackdrop() {
  // Remove the current backdrop
  scene.remove(floor)
  scene.remove(backdrop)
  scene.remove(curvedBackdrop)
  scene.remove(cylindricalBackdrop)

  switch (currentBackdrop) {
    case 0: // Flat Backdrop
      scene.add(floor)
      scene.add(backdrop)
      break
    case 1: // Curved Backdrop
      //scene.add(floor);
      scene.add(curvedBackdrop)
      break
    case 2: // Cylindrical Backdrop
      scene.add(cylindricalBackdrop)
      break
  }

  currentBackdrop = (currentBackdrop + 1) % 3
}

// Initialize with the first backdrop
switchBackdrop()

// Set the target for the lights to point towards the center of the scene
const target = new THREE.Object3D()
target.position.set(0, 0, 0)
scene.add(target)

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

// Main Spotlight
const mainSpotLight = new THREE.SpotLight(0xffffff, 1)
mainSpotLight.position.set(0, 300, 300)
mainSpotLight.castShadow = true
mainSpotLight.angle = Math.PI / 4
mainSpotLight.penumbra = 0.5
mainSpotLight.decay = 2
mainSpotLight.distance = 1000
mainSpotLight.target = target
scene.add(mainSpotLight)

const mainSpotLightHelper = new THREE.SpotLightHelper(mainSpotLight)
scene.add(mainSpotLightHelper)

// Front Left Spotlight
const leftSpotLight = new THREE.SpotLight(0xffffff, 0.7) // Slightly lower intensity
leftSpotLight.position.set(-300, 300, 300)
leftSpotLight.castShadow = true
leftSpotLight.angle = Math.PI / 4
leftSpotLight.penumbra = 0.5
leftSpotLight.decay = 2
leftSpotLight.distance = 1000
leftSpotLight.target = target
scene.add(leftSpotLight)

const leftSpotLightHelper = new THREE.SpotLightHelper(leftSpotLight)
scene.add(leftSpotLightHelper)

// Front Right Spotlight
const rightSpotLight = new THREE.SpotLight(0xffffff, 0.7) // Slightly lower intensity
rightSpotLight.position.set(300, 300, 300)
rightSpotLight.castShadow = true
rightSpotLight.angle = Math.PI / 4
rightSpotLight.penumbra = 0.5
rightSpotLight.decay = 2
rightSpotLight.distance = 1000
rightSpotLight.target = target
scene.add(rightSpotLight)

const rightSpotLightHelper = new THREE.SpotLightHelper(rightSpotLight)
scene.add(rightSpotLightHelper)

let model
let isRotating = false
let materialsVisible = true

// Light Helpers Toggle
let helperState = 0 // 0: all on, 1: left only, 2: middle only, 3: right only, 4: all off

function toggleLightHelpers() {
  switch (helperState) {
    case 0:
      mainSpotLightHelper.visible = true
      leftSpotLightHelper.visible = true
      rightSpotLightHelper.visible = true
      break
    case 1:
      mainSpotLightHelper.visible = false
      leftSpotLightHelper.visible = true
      rightSpotLightHelper.visible = false
      break
    case 2:
      mainSpotLightHelper.visible = true
      leftSpotLightHelper.visible = false
      rightSpotLightHelper.visible = false
      break
    case 3:
      mainSpotLightHelper.visible = false
      leftSpotLightHelper.visible = false
      rightSpotLightHelper.visible = true
      break
    case 4:
      mainSpotLightHelper.visible = false
      leftSpotLightHelper.visible = false
      rightSpotLightHelper.visible = false
      break
  }

  helperState = (helperState + 1) % 5 // Cycle through the states
}

const mainLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0,
    transparent: true,
  }),
)
mainLightHandle.position.copy(mainSpotLight.position)
scene.add(mainLightHandle)

const leftLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: 0,
    transparent: true,
  }),
)
leftLightHandle.position.copy(leftSpotLight.position)
scene.add(leftLightHandle)

const rightLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    opacity: 0,
    transparent: true,
  }),
)
rightLightHandle.position.copy(rightSpotLight.position)
scene.add(rightLightHandle)

// Drag Controls for Lights
const draggableLights = [mainLightHandle, leftLightHandle, rightLightHandle]
const dragControls = new DragControls(
  draggableLights,
  camera,
  renderer.domElement,
)

dragControls.addEventListener("hoveron", function (event) {
  console.log("Hovered on:", event.object)
})

dragControls.addEventListener("dragstart", function (event) {
  controls.enabled = false // Disable OrbitControls while dragging
})

dragControls.addEventListener("dragend", function (event) {
  controls.enabled = true // Re-enable OrbitControls after dragging
})

dragControls.addEventListener("drag", function (event) {
  // Update spotlight positions to follow the dragged handles
  if (event.object === mainLightHandle) {
    mainSpotLight.position.copy(mainLightHandle.position)
    mainSpotLightHelper.update()
  } else if (event.object === leftLightHandle) {
    leftSpotLight.position.copy(leftLightHandle.position)
    leftSpotLightHelper.update()
  } else if (event.object === rightLightHandle) {
    rightSpotLight.position.copy(rightLightHandle.position)
    rightSpotLightHelper.update()
  }
})

function scaleModel(object) {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)

  const minSize = 150
  const maxDimension = Math.max(size.x, size.y, size.z)

  if (maxDimension < minSize) {
    const scaleFactor = minSize / maxDimension
    object.scale.set(scaleFactor, scaleFactor, scaleFactor)
  }
}

function placeOnFloor(object) {
  let minY = Infinity
  object.traverse(function (child) {
    if (child.isMesh) {
      const geometry = child.geometry
      if (geometry.isBufferGeometry) {
        const position = geometry.attributes.position
        for (let i = 0; i < position.count; i++) {
          const y = position.getY(i)
          if (y < minY) {
            minY = y
          }
        }
      } else if (geometry.isGeometry) {
        geometry.vertices.forEach((vertex) => {
          if (vertex.y < minY) {
            minY = vertex.y
          }
        })
      }
    }
  })
  object.position.y -= minY
}

function storeOriginalMaterials(object) {
  object.traverse(function (child) {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.userData.originalMaterial = child.material.map((mat) =>
          mat.clone(),
        )
      } else if (typeof child.material.clone === "function") {
        child.userData.originalMaterial = child.material.clone()
      }
    }
  })
}

function toggleMaterials() {
  if (!model) return

  model.traverse(function (child) {
    if (child.isMesh) {
      if (materialsVisible) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x808080 })
      } else {
        if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial
        }
      }
    }
  })

  materialsVisible = !materialsVisible
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = function (e) {
    const contents = e.target.result

    if (model) {
      scene.remove(model)
    }

    const objLoader = new OBJLoader()
    const object = objLoader.parse(contents)

    placeOnFloor(object)
    scaleModel(object)
    storeOriginalMaterials(object)

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    model = object
    scene.add(object)
  }

  reader.readAsText(file)
}

document
  .getElementById("fileInput")
  .addEventListener("change", handleFileSelect, false)

// TODO: potential button implementations
window.addEventListener("keydown", function (event) {
  if (event.key === "r" || event.key === "R") {
    isRotating = !isRotating
  }

  if (event.key === "l" || event.key === "L") {
    currentColorIndex = (currentColorIndex + 1) % spotlightColors.length

    if (event.shiftKey) {
      mainSpotLight.color.setHex(spotlightColors[currentColorIndex])
    } else if (event.altKey) {
      leftSpotLight.color.setHex(spotlightColors[currentColorIndex])
    } else if (event.ctrlKey) {
      rightSpotLight.color.setHex(spotlightColors[currentColorIndex])
    } else {
      mainSpotLight.color.setHex(spotlightColors[currentColorIndex])
      leftSpotLight.color.setHex(spotlightColors[currentColorIndex])
      rightSpotLight.color.setHex(spotlightColors[currentColorIndex])
    }
  }

  if (event.key === "m" || event.key === "M") {
    toggleMaterials()
  }

  if (event.key === "h" || event.key === "H") {
    toggleLightHelpers()
  }

  if (event.key === "s" || event.key === "S") {
    shadowsEnabled = !shadowsEnabled
    toggleShadows(shadowsEnabled)
  }

  if (event.key === "b" || event.key === "B") {
    switchBackdrop() // Toggle backdrop on B press
  }
})

function toggleShadows(enable) {
  mainSpotLight.castShadow = enable
  leftSpotLight.castShadow = enable
  rightSpotLight.castShadow = enable
  if (model) {
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = enable
        child.receiveShadow = enable
      }
    })
  }
}

function animate() {
  requestAnimationFrame(animate)

  if (isRotating && model) {
    model.rotation.y += 0.01
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})
