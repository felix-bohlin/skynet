import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";
import { OBJLoader } from "./OBJLoader.js";
import { MTLLoader } from "./MTLLoader.js";
import { FBXLoader } from "./FBXLoader.js";
import { DragControls } from "./DragControls.js"; // Ensure this is included

// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 150, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const materialsDemo = {
  plant: {
    leaves: new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load("./objects/plants/textures/indoor plant_2_COL.jpg"),
    }),
    pot: new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load("./objects/plants/textures/indoor plant_2_NOR.jpg"),
    }),
    ground: new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load("./objects/plants/textures/indoor plant_2_NOR.jpg"),
    }),
  },
  can: {
    base: new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load("./objects/can/CokeCan_Base_color.png"),
    }),
    top: new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("textures/can_top.jpg") }),
  },
  car: {
    base: new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("./objects/car/car.jpg") }),
    top: new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("textures/can_top.jpg") }),
  },
};

let isRecording = false;
let customPath = [];
const recordingKey = "t"; // Start/stop recording
const lockPositionKey = "a"; // Lock the current position as a keyframe
const playAnimationKey = "0"; // Play the custom animation

function startRecording() {
  isRecording = true;
  customPath = []; // Reset any previous recording
  console.log("Recording started. Move the camera and press 'L' to lock positions.");
}

function stopRecording() {
  isRecording = false;
  console.log("Recording stopped.");
}

function lockCurrentPosition() {
  if (isRecording) {
    const currentPosition = camera.position.clone();
    const currentLookAt = controls.target.clone(); // Use the target the camera is looking at
    customPath.push({ position: currentPosition, lookAt: currentLookAt });
    console.log("Position locked at:", currentPosition);
  }
}

function playCustomAnimation() {
  if (customPath.length === 0) {
    console.log("No custom animation recorded.");
    return;
  }

  let segmentIndex = 0;
  const segmentTime = 2; // Time in seconds for each segment

  function animateSegment(startTime) {
    const elapsedTime = (performance.now() - startTime) / 1000;
    const t = elapsedTime / segmentTime;

    if (segmentIndex < customPath.length - 1) {
      const startPosition = customPath[segmentIndex].position;
      const endPosition = customPath[segmentIndex + 1].position;
      const startLookAt = customPath[segmentIndex].lookAt;
      const endLookAt = customPath[segmentIndex + 1].lookAt;

      // Linear interpolation for position
      camera.position.lerpVectors(startPosition, endPosition, t);

      // Linear interpolation for lookAt target
      controls.target.lerpVectors(startLookAt, endLookAt, t);
      camera.lookAt(controls.target);

      if (t >= 1) {
        segmentIndex++;
        if (segmentIndex < customPath.length - 1) {
          animateSegment(performance.now()); // Move to the next segment
        }
      } else {
        requestAnimationFrame(() => animateSegment(startTime));
      }
    }
  }

  animateSegment(performance.now());
}

const spotlightColors = [0xffe0b2, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
let currentColorIndexLeft = 0;
let currentColorIndexMain = 0;
let currentColorIndexRight = 0;

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.rotateSpeed = 0.1;
controls.enablePan = true;

// Studio Floor
const floorGeometry = new THREE.PlaneGeometry(500, 500);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const backdropGeometry = new THREE.PlaneGeometry(500, 300);
const backdropMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
backdrop.position.z = -150;
backdrop.position.y = 150;
backdrop.receiveShadow = true;

// Option 2: Curved Backdrop
let curvedBackdrop = createCurvedBackdrop();

// Option 3: Cylindrical Backdrop
let cylindricalBackdrop = createCylindricalBackdrop();

let currentBackdrop = 0; // 0: Flat, 1: Curved, 2: Cylindrical

function createCurvedBackdrop() {
  const curvedGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);

  // Access the position attribute of the geometry
  const position = curvedGeometry.attributes.position;

  // Modify the vertex positions to create a curve
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);

    if (y > 0) {
      position.setZ(i, Math.pow(Math.abs(y), 2) * 0.0025); // Curves up from the floor to the wall
    }
    if (Math.abs(x) > 200) {
      position.setX(i, x * 0.75); // Slightly curve in the sides
    }
  }

  // Need to recompute normals after modifying vertex positions
  curvedGeometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(curvedGeometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function createCylindricalBackdrop() {
  const geometry = new THREE.CylinderGeometry(500, 500, 300, 50, 1, true);
  geometry.scale(-1, 1, 1); // Invert the cylinder to be viewed from inside
  const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 150;
  mesh.receiveShadow = true;
  return mesh;
}

function switchBackdrop() {
  // Remove the current backdrop
  scene.remove(floor);
  scene.remove(backdrop);
  scene.remove(curvedBackdrop);
  scene.remove(cylindricalBackdrop);

  switch (currentBackdrop) {
    case 0: // Flat Backdrop
      scene.add(floor);
      scene.add(backdrop);
      break;
    case 1: // Curved Backdrop
      //scene.add(floor);
      scene.add(curvedBackdrop);
      break;
    case 2: // Cylindrical Backdrop
      scene.add(cylindricalBackdrop);
      break;
  }

  currentBackdrop = (currentBackdrop + 1) % 3;
}

// Initialize with the first backdrop
switchBackdrop();

// Set the target for the lights to point towards the center of the scene
const target = new THREE.Object3D();
target.position.set(0, 0, 0);
scene.add(target);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Main Spotlight
const mainSpotLight = new THREE.SpotLight(0xffffff, 1);
mainSpotLight.position.set(0, 300, 300);
mainSpotLight.castShadow = true;
mainSpotLight.angle = Math.PI / 4;
mainSpotLight.penumbra = 0.5;
mainSpotLight.decay = 2;
mainSpotLight.distance = 1000;
mainSpotLight.target = target;
scene.add(mainSpotLight);

const mainSpotLightHelper = new THREE.SpotLightHelper(mainSpotLight);
scene.add(mainSpotLightHelper);

// Front Left Spotlight
const leftSpotLight = new THREE.SpotLight(0xffffff, 0.7); // Slightly lower intensity
leftSpotLight.position.set(-300, 300, 300);
leftSpotLight.castShadow = true;
leftSpotLight.angle = Math.PI / 4;
leftSpotLight.penumbra = 0.5;
leftSpotLight.decay = 2;
leftSpotLight.distance = 1000;
leftSpotLight.target = target;
scene.add(leftSpotLight);

const leftSpotLightHelper = new THREE.SpotLightHelper(leftSpotLight);
scene.add(leftSpotLightHelper);

// Front Right Spotlight
const rightSpotLight = new THREE.SpotLight(0xffffff, 0.7); // Slightly lower intensity
rightSpotLight.position.set(300, 300, 300);
rightSpotLight.castShadow = true;
rightSpotLight.angle = Math.PI / 4;
rightSpotLight.penumbra = 0.5;
rightSpotLight.decay = 2;
rightSpotLight.distance = 1000;
rightSpotLight.target = target;
scene.add(rightSpotLight);

const rightSpotLightHelper = new THREE.SpotLightHelper(rightSpotLight);
scene.add(rightSpotLightHelper);

let model;
let isRotating = false;
let materialsVisible = true;
let originalMaterials = {};

// Light Helpers Toggle
let helperState = 0; // 0: all on, 1: left only, 2: middle only, 3: right only, 4: all off

function toggleLightHelpers() {
  switch (helperState) {
    case 0:
      mainSpotLightHelper.visible = true;
      leftSpotLightHelper.visible = true;
      rightSpotLightHelper.visible = true;
      break;
    case 1:
      mainSpotLightHelper.visible = false;
      leftSpotLightHelper.visible = true;
      rightSpotLightHelper.visible = false;
      break;
    case 2:
      mainSpotLightHelper.visible = true;
      leftSpotLightHelper.visible = false;
      rightSpotLightHelper.visible = false;
      break;
    case 3:
      mainSpotLightHelper.visible = false;
      leftSpotLightHelper.visible = false;
      rightSpotLightHelper.visible = true;
      break;
    case 4:
      mainSpotLightHelper.visible = false;
      leftSpotLightHelper.visible = false;
      rightSpotLightHelper.visible = false;
      break;
  }

  helperState = (helperState + 1) % 5; // Cycle through the states
}

const mainLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0, transparent: true })
);
mainLightHandle.position.copy(mainSpotLight.position);
scene.add(mainLightHandle);

const leftLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0, transparent: true })
);
leftLightHandle.position.copy(leftSpotLight.position);
scene.add(leftLightHandle);

const rightLightHandle = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0, transparent: true })
);
rightLightHandle.position.copy(rightSpotLight.position);
scene.add(rightLightHandle);

// Drag Controls for Lights
const draggableLights = [mainLightHandle, leftLightHandle, rightLightHandle];
const dragControls = new DragControls(draggableLights, camera, renderer.domElement);

dragControls.addEventListener("dragstart", function (event) {
  controls.enabled = false; // Disable OrbitControls while dragging
});

dragControls.addEventListener("dragend", function (event) {
  controls.enabled = true; // Re-enable OrbitControls after dragging
});

dragControls.addEventListener("drag", function (event) {
  // Update spotlight positions to follow the dragged handles
  if (event.object === mainLightHandle) {
    mainSpotLight.position.copy(mainLightHandle.position);
    mainSpotLightHelper.update();
  } else if (event.object === leftLightHandle) {
    leftSpotLight.position.copy(leftLightHandle.position);
    leftSpotLightHelper.update();
  } else if (event.object === rightLightHandle) {
    rightSpotLight.position.copy(rightLightHandle.position);
    rightSpotLightHelper.update();
  }
});

function scaleModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const minSize = 150;
  const maxDimension = Math.max(size.x, size.y, size.z);

  if (maxDimension < minSize) {
    const scaleFactor = minSize / maxDimension;
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }
}

function placeOnFloor(object) {
  let minY = Infinity;
  object.traverse(function (child) {
    if (child.isMesh) {
      const geometry = child.geometry;
      if (geometry.isBufferGeometry) {
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          const y = position.getY(i);
          if (y < minY) {
            minY = y;
          }
        }
      } else if (geometry.isGeometry) {
        geometry.vertices.forEach((vertex) => {
          if (vertex.y < minY) {
            minY = vertex.y;
          }
        });
      }
    }
  });
  object.position.y -= minY;
  if (currentObject === "car") object.position.y += 45;
  if (currentObject === "chair") object.position.y += 45;
}
function storeOriginalMaterials(object) {
  object.traverse(function (child) {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        // If the material is an array (multi-material), clone each material in the array
        child.userData.originalMaterial = child.material.map((mat) => {
          return mat.clone ? mat.clone() : mat;
        });
      } else if (child.material && typeof child.material.clone === "function") {
        // If the material has a clone function, clone it
        child.userData.originalMaterial = child.material.clone();
      } else {
        // If no clone function, just store the material reference
        child.userData.originalMaterial = child.material;
      }
    }
  });
}

function applyHardcodedMaterials(objectName) {
  if (!model) return;

  model.traverse(function (child) {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        // Loop through each material in the array
        child.material.forEach((mat, index) => {
          switch (objectName) {
            case "plant":
              if (mat.name.includes("leaves")) {
                child.material[index] = materialsDemo.plant.leaves;
              } else if (mat.name.includes("Pot")) {
                child.material[index] = materialsDemo.plant.pot;
              } else if (mat.name.includes("ground")) {
                child.material[index] = materialsDemo.plant.ground;
              } else if (mat.name.includes("root")) {
                child.material[index] = materialsDemo.plant.ground;
              }
              break;
            case "can":
              if (mat.name.includes("base")) {
                child.material[index] = materialsDemo.can.base;
              } else if (mat.name.includes("top")) {
                child.material[index] = materialsDemo.can.top;
              }
              break;
            case "car":
              if (mat.name.includes("TexMap")) {
                child.material[index] = materialsDemo.car.base;
              } else if (mat.name.includes("top")) {
                child.material[index] = materialsDemo.car.top;
              }
              break;
          }
        });
      } else {
        // Handle single material cases
        switch (objectName) {
          case "plant":
            if (child.material.name.includes("leaves")) {
              child.material = materialsDemo.plant.leaves;
            } else if (child.material.name.includes("Pot")) {
              child.material = materialsDemo.plant.pot;
            } else if (child.material.name.includes("ground")) {
              child.material = materialsDemo.plant.ground;
            }
            break;
          case "can":
            if (child.material.name.includes("Material")) {
              child.material = materialsDemo.can.base;
            } else if (child.material.name.includes("top")) {
              child.material = materialsDemo.can.top;
            }
            break;
          case "car":
            if (child.material.name.includes("TexMap")) {
              child.material = materialsDemo.car.base;
            } else if (child.material.name.includes("top")) {
              child.material = materialsDemo.car.top;
            }
            break;
        }
      }
    }
  });
}

let currentObject = "plant"; // Change this based on the loaded object

function toggleMaterials() {
  if (!model) return;

  materialsVisible = !materialsVisible;

  if (materialsVisible) {
    applyHardcodedMaterials(currentObject);
  } else {
    model.traverse(function (child) {
      if (child.isMesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    });
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const fileName = file.name.toLowerCase();

  // If the file is an .obj file
  if (fileName.endsWith(".obj")) {
    handleOBJFile(file);
  }
}

function handleOBJFile(file) {
  const fileName = file.name;
  const fileBaseName = fileName.substring(0, fileName.lastIndexOf(".")).toLowerCase();

  console.log(`Handling OBJ file: ${fileName}`);

  const objLoader = new OBJLoader();
  currentObject = fileBaseName;

  const objReader = new FileReader();
  objReader.onload = function (e) {
    const contents = e.target.result;
    const object = objLoader.parse(contents);
    console.log("OBJ file loaded.");
    setupModel(object);

    // Apply hardcoded materials after setting up the model
    applyHardcodedMaterials(currentObject);
  };
  objReader.readAsText(file);
}

function setupModel(object) {
  // Remove the existing model from the scene
  if (model) {
    scene.remove(model);
  }

  // Place the model on the floor, scale it, and store original materials
  placeOnFloor(object);
  scaleModel(object);
  storeOriginalMaterials(object);

  object.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  model = object;
  scene.add(object);

  // Load a test texture manually
  // const textureLoader = new THREE.TextureLoader();
  // const testTexture = textureLoader.load(
  //   "./objects/plants/textures/indoor plant_2_COL.jpg",
  //   function (texture) {
  //     console.log("Texture loaded successfully:", texture);
  //   },
  //   undefined,
  //   function (err) {
  //     console.error("Texture loading failed:", err);
  //   }
  // );

  // // Manually apply this texture to a test material
  // const testMaterial = new THREE.MeshStandardMaterial({ map: testTexture });

  // // Apply the material to a specific mesh for testing
  // if (model) {
  //   model.traverse(function (child) {
  //     if (child.isMesh) {
  //       child.material = testMaterial; // Override with the test material
  //     }
  //   });
  // }
}

document.getElementById("fileInput").addEventListener("change", handleFileSelect, false);

const cameraPositions = {
  default: { position: new THREE.Vector3(0, 150, 300), lookAt: new THREE.Vector3(0, 0, 0) },
  interesting1: { position: new THREE.Vector3(300, 300, 300), lookAt: new THREE.Vector3(0, 150, 0) },
  interesting2: { position: new THREE.Vector3(-300, 300, 300), lookAt: new THREE.Vector3(0, 100, 0) },
};

// Helper function to move camera to a target position
function moveCameraTo(position, lookAt, duration = 1000) {
  const startPos = camera.position.clone();
  const startLookAt = controls.target.clone();

  const startTime = performance.now();

  function animateCamera(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Linear interpolation between start and target positions
    camera.position.lerpVectors(startPos, position, t);
    controls.target.lerpVectors(startLookAt, lookAt, t);
    camera.lookAt(controls.target);

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    }
  }

  requestAnimationFrame(animateCamera);
}

// Camera Orbit Animation
function startOrbitAnimation(duration = 5000) {
  const startPos = camera.position.clone();
  const startTime = performance.now();

  function animateOrbit(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Orbit logic
    const angle = t * Math.PI * 2; // One full orbit
    const radius = 500;
    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
    camera.position.y = 150; // Keep camera at a fixed height
    camera.lookAt(0, 0, 0);

    if (t < 1) {
      requestAnimationFrame(animateOrbit);
    }
  }

  requestAnimationFrame(animateOrbit);
}
function animateCameraPath(path, duration = 5000) {
  const startTime = performance.now();

  function animateCamera(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    const point = path.getPoint(t);

    if (point) {
      camera.position.copy(point);
      camera.lookAt(0, 0, 0); // Always look at the center
    }

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    }
  }

  requestAnimationFrame(animateCamera);
}

// Path Animation 1 (Key 7)
function startPathAnimation1() {
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, 50, 500), new THREE.Vector3(0, 300, -300)));
  animateCameraPath(path, 5000);
}

// Path Animation 2 (Key 8)
function startPathAnimation2() {
  const path = new THREE.CurvePath();

  // S-shaped path
  path.add(new THREE.LineCurve3(new THREE.Vector3(300, 150, 300), new THREE.Vector3(-300, 150, 100)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(-300, 150, 100), new THREE.Vector3(300, 150, -100)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(300, 150, -100), new THREE.Vector3(-300, 150, -300)));

  animateCameraPath(path, 7000); // 7 seconds duration
}

// Path Animation 3 (Key 9)
function startPathAnimation3() {
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(new THREE.Vector3(-500, 200, 200), new THREE.Vector3(0, 100, 200)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, 100, 200), new THREE.Vector3(500, 200, 200)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(500, 200, 200), new THREE.Vector3(0, 100, 200)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, 100, 200), new THREE.Vector3(-500, 200, 200)));
  animateCameraPath(path, 8000);
}

window.addEventListener("keydown", function (event) {
  if (event.key === "r" || event.key === "R") {
    isRotating = !isRotating;
  }

  if (event.key === "l" || event.key === "L") {
    //currentColorIndexLeft = (currentColorIndexLeft + 1) % spotlightColors.length;

    if (event.shiftKey && event.altKey) {
      currentColorIndexMain = (currentColorIndexMain + 1) % spotlightColors.length;

      mainSpotLight.color.setHex(spotlightColors[currentColorIndexMain]);
    } else if (event.altKey && !event.shiftKey) {
      currentColorIndexLeft = (currentColorIndexLeft + 1) % spotlightColors.length;
      leftSpotLight.color.setHex(spotlightColors[currentColorIndexLeft]);
    } else if (!event.altKey && event.shiftKey) {
      currentColorIndexRight = (currentColorIndexRight + 1) % spotlightColors.length;

      rightSpotLight.color.setHex(spotlightColors[currentColorIndexRight]);
    } else {
      currentColorIndexMain = (currentColorIndexMain + 1) % spotlightColors.length;
      currentColorIndexLeft = currentColorIndexMain;
      currentColorIndexRight = currentColorIndexMain;
      mainSpotLight.color.setHex(spotlightColors[currentColorIndexMain]);
      leftSpotLight.color.setHex(spotlightColors[currentColorIndexMain]);
      rightSpotLight.color.setHex(spotlightColors[currentColorIndexMain]);
    }
  }

  if (event.key === "m" || event.key === "M") {
    toggleMaterials();
  }

  if (event.key === "h" || event.key === "H") {
    toggleLightHelpers();
  }

  if (event.key === "s" || event.key === "S") {
    shadowsEnabled = !shadowsEnabled;
    toggleShadows(shadowsEnabled);
  }

  if (event.key === "b" || event.key === "B") {
    switchBackdrop(); // Toggle backdrop on B press
  }

  if (event.key === "i" || event.key === "I") {
    if (event.shiftKey && event.altKey) mainSpotLight.intensity += 0.1;
    else if (event.altKey && !event.shiftKey) leftSpotLight.intensity += 0.1;
    else if (!event.altKey && event.shiftKey) rightSpotLight.intensity += 0.1;
    else {
      mainSpotLight.intensity += 0.1;
      leftSpotLight.intensity += 0.1;
      rightSpotLight.intensity += 0.1;
    }
  } else if (event.key === "d" || event.key === "D") {
    if (event.shiftKey && event.altKey) mainSpotLight.intensity -= 0.1;
    else if (event.altKey && !event.shiftKey) leftSpotLight.intensity -= 0.1;
    else if (!event.altKey && event.shiftKey) rightSpotLight.intensity -= 0.1;
    else {
      mainSpotLight.intensity -= 0.1;
      leftSpotLight.intensity -= 0.1;
      rightSpotLight.intensity -= 0.1;
    }
  }

  if (event.key === "p" || event.key === "P") {
    const imgData = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "screenshot.png";
    link.click();
  }

  if (event.key === "c" || event.key === "C") {
    animateCameraPath();
  }

  switch (event.key) {
    case "1":
      moveCameraTo(cameraPositions.default.position, cameraPositions.default.lookAt);
      break;
    case "2":
      moveCameraTo(cameraPositions.interesting1.position, cameraPositions.interesting1.lookAt);
      break;
    case "3":
      moveCameraTo(cameraPositions.interesting2.position, cameraPositions.interesting2.lookAt);
      break;
    case "4":
      animateCameraPath(); // Use your existing camera path animation
      break;
    case "5":
      startOrbitAnimation(5000); // Start an orbit animation
      break;
    case "6":
      startOrbitAnimation(10000); // Start a slower orbit animation
      break;
    // Keep other key events as before
  }

  if (event.key === "7") {
    startPathAnimation1();
  }

  if (event.key === "8") {
    startPathAnimation2();
  }

  if (event.key === "9") {
    startPathAnimation3();
  }

  if (event.key.toLowerCase() === recordingKey) {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  if (event.key.toLowerCase() === lockPositionKey) {
    lockCurrentPosition();
  }

  if (event.key === playAnimationKey) {
    playCustomAnimation();
  }
});

function toggleShadows(enable) {
  mainSpotLight.castShadow = enable;
  leftSpotLight.castShadow = enable;
  rightSpotLight.castShadow = enable;
  if (model) {
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = enable;
        child.receiveShadow = enable;
      }
    });
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (isRotating && model) {
    model.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
