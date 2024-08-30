import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";
import { OBJLoader } from "./OBJLoader.js";
// import { DragControls } from "./DragControls.js";

// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 150, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const spotlightColors = [0xffe0b2, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
let currentColorIndex = 0;
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

// Studio Backdrop
const backdropGeometry = new THREE.PlaneGeometry(500, 300);
const backdropMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
backdrop.position.z = -150;
backdrop.position.y = 150;
backdrop.receiveShadow = true;
scene.add(backdrop);

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
}

function storeOriginalMaterials(object) {
  object.traverse(function (child) {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.userData.originalMaterial = child.material.map((mat) => mat.clone());
      } else if (typeof child.material.clone === "function") {
        child.userData.originalMaterial = child.material.clone();
      }
    }
  });
}

function toggleMaterials() {
  if (!model) return;

  model.traverse(function (child) {
    if (child.isMesh) {
      if (materialsVisible) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x808080 });
      } else {
        if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
        }
      }
    }
  });

  materialsVisible = !materialsVisible;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;

    if (model) {
      scene.remove(model);
    }

    const objLoader = new OBJLoader();
    const object = objLoader.parse(contents);

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
    scene.add(model);
  };

  reader.readAsText(file);
}

document.getElementById("fileInput").addEventListener("change", handleFileSelect, false);

window.addEventListener("keydown", function (event) {
  if (event.key === "r" || event.key === "R") {
    isRotating = !isRotating;
  }

  if (event.key === "l" || event.key === "L") {
    currentColorIndex = (currentColorIndex + 1) % spotlightColors.length;

    if (event.shiftKey) {
      // Change only the central spotlight
      mainSpotLight.color.setHex(spotlightColors[currentColorIndex]);
    } else if (event.altKey) {
      // Change only the left spotlight
      leftSpotLight.color.setHex(spotlightColors[currentColorIndex]);
    } else if (event.ctrlKey) {
      // Change only the right spotlight
      rightSpotLight.color.setHex(spotlightColors[currentColorIndex]);
    } else {
      // Change all three spotlights
      mainSpotLight.color.setHex(spotlightColors[currentColorIndex]);
      leftSpotLight.color.setHex(spotlightColors[currentColorIndex]);
      rightSpotLight.color.setHex(spotlightColors[currentColorIndex]);
    }
  }

  if (event.key === "m" || event.key === "M") {
    toggleMaterials();
  }

  if (event.key === "s" || event.key === "S") {
    shadowsEnabled = !shadowsEnabled;
    toggleShadows(shadowsEnabled);
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
