import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";
import { OBJLoader } from "./OBJLoader.js"; // Add this line to import the OBJLoader
// import { MTLLoader } from "./MTLLoader.js"; // Add this line if you need to load materials

// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls for Panning
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth panning
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Disable zooming to keep the camera at a fixed distance
controls.enableRotate = true; // Enable rotation
controls.rotateSpeed = 0.1; // Adjust rotate speed
controls.enablePan = false; // Disable panning (only allow rotation)

// Studio Floor
const floorGeometry = new THREE.PlaneGeometry(500, 500);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate floor to lay flat
scene.add(floor);

// Studio Backdrop
const backdropGeometry = new THREE.PlaneGeometry(500, 300);
const backdropMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }); // Light gray backdrop
const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
backdrop.position.z = -150;
backdrop.position.y = 150;
scene.add(backdrop);

// Key Light
const keyLight = new THREE.DirectionalLight(0xffe0b2, 1); // Soft yellow light
keyLight.position.set(100, 100, 100); // Positioned top-left
scene.add(keyLight);

// Fill Light
const fillLight = new THREE.DirectionalLight(0xffe0b2, 0.5); // Soft yellow light
fillLight.position.set(-100, 50, 100); // Positioned bottom-right
scene.add(fillLight);

// Camera Position
camera.position.z = 300;
camera.position.y = 100;
camera.lookAt(0, 0, 0);

const objLoader = new OBJLoader();

function placeOnFloor(object) {
  // Initialize a variable to store the lowest y-coordinate
  let minY = Infinity;

  // Traverse through all the children of the object (to cover all meshes)
  object.traverse(function (child) {
    if (child.isMesh) {
      // Geometry might be a BufferGeometry or a Geometry, so handle both
      const geometry = child.geometry;

      // For BufferGeometry, access the position attribute directly
      if (geometry.isBufferGeometry) {
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          const y = position.getY(i);
          if (y < minY) {
            minY = y;
          }
        }
      }
      // For Geometry, access vertices directly
      else if (geometry.isGeometry) {
        geometry.vertices.forEach((vertex) => {
          if (vertex.y < minY) {
            minY = vertex.y;
          }
        });
      }
    }
  });

  // Adjust the object's position by the negative of minY to raise it to the floor level
  object.position.y -= minY;
}

// Usage example:
// After loading the OBJ or FBX model, call the placeOnFloor function
objLoader.load("chair.obj", function (object) {
  placeOnFloor(object);
  scene.add(object);
});

// Load the OBJ model

// objLoader.load(
//   "chair.obj", // Replace with the correct path to your OBJ file
//   function (object) {
//     object.position.set(0, 50, 0); // Set the model's position in the scene
//     scene.add(object);
//   },
//   function (xhr) {
//     console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
//   },
//   function (error) {
//     console.error("An error happened", error);
//   }
// );

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update the controls on each frame
  renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
