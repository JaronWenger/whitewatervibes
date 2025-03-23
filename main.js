import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Prevent scrolling
window.addEventListener('scroll', (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

window.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
});

// Set renderer size and position
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// Append renderer to body and ensure it's positioned correctly
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

// Create river
const riverGeometry = new THREE.PlaneGeometry(100, 1000);
const waterNormals = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg', 
    function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        console.log('Water normals texture loaded successfully');
    },
    undefined,
    function(error) {
        console.error('Error loading water normals texture:', error);
    }
);

const river = new Water(riverGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x006994,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
});

// Initialize water uniforms
if (river.material && river.material.uniforms) {
    river.material.uniforms['time'].value = 0;
    river.material.uniforms['sunDirection'].value.set(0, 1, 0);
    console.log('Water uniforms initialized successfully');
} else {
    console.error('Water material or uniforms not initialized properly');
}

river.rotation.x = -Math.PI / 2;
river.position.y = 0;
scene.add(river);

// Create canyon walls
const canyonMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.2
});

// Left wall
const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 100),
    canyonMaterial
);
leftWall.position.set(-50, 50, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 100),
    canyonMaterial
);
rightWall.position.set(50, 50, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Create trees
function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2F10 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    treeGroup.add(trunk);
    
    // Tree top
    const topGeometry = new THREE.ConeGeometry(3, 6, 8);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5A27 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 7;
    treeGroup.add(top);
    
    treeGroup.position.set(x, 0, z);
    return treeGroup;
}

// Add trees along the canyon walls
for (let i = -400; i <= 400; i += 50) {
    scene.add(createTree(-45, i));
    scene.add(createTree(45, i));
}

// Add sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

// Initialize sun direction
const sunDirection = new THREE.Vector3();
const sunPosition = new THREE.Vector3();

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Position camera
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// Create kayaker
function createKayaker() {
    const kayakerGroup = new THREE.Group();
    
    // Kayak body
    const kayakGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const kayakMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const kayak = new THREE.Mesh(kayakGeometry, kayakMaterial);
    kayak.rotation.z = Math.PI / 2;
    kayak.position.y = 0.5;
    kayakerGroup.add(kayak);
    
    // Paddler
    const paddlerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const paddlerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF });
    const paddler = new THREE.Mesh(paddlerGeometry, paddlerMaterial);
    paddler.position.y = 1.5;
    kayakerGroup.add(paddler);
    
    kayakerGroup.position.set(0, 0, 0);
    return kayakerGroup;
}

const kayaker = createKayaker();
scene.add(kayaker);

// Kayaker movement
const kayakerSpeed = 0.1;
const kayakerRotationSpeed = 0.02;
let kayakerPosition = new THREE.Vector3(0, 0, 0);
let kayakerRotation = 0;

// Handle keyboard controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update water
    if (river.material && river.material.uniforms) {
        river.material.uniforms['time'].value += 1.0 / 60.0;
    }

    // Update sun position
    const time = Date.now() * 0.001;
    sunPosition.setFromSpherical(new THREE.Spherical(1, 0.5, time));
    sunDirection.copy(sunPosition).normalize();
    
    if (river.material && river.material.uniforms) {
        river.material.uniforms['sunDirection'].value.copy(sunDirection);
    }

    // Update kayaker position
    if (keys.ArrowLeft) kayakerRotation += kayakerRotationSpeed;
    if (keys.ArrowRight) kayakerRotation -= kayakerRotationSpeed;
    if (keys.ArrowUp) {
        kayakerPosition.x += Math.sin(kayakerRotation) * kayakerSpeed;
        kayakerPosition.z += Math.cos(kayakerRotation) * kayakerSpeed;
    }
    if (keys.ArrowDown) {
        kayakerPosition.x -= Math.sin(kayakerRotation) * kayakerSpeed;
        kayakerPosition.z -= Math.cos(kayakerRotation) * kayakerSpeed;
    }

    kayaker.position.copy(kayakerPosition);
    kayaker.rotation.y = kayakerRotation;

    // Update camera to follow kayaker
    camera.position.set(
        kayakerPosition.x,
        10,
        kayakerPosition.z + 20
    );
    camera.lookAt(kayakerPosition);

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}

// Start the animation
animate(); 