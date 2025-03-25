// Import dependencies and initialize
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
scene.background = new THREE.Color(0x87CEEB); // Add sky blue background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false // Change to false since we have a background
});

// Set renderer size and position
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x87CEEB, 1); // Match scene background
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Append renderer to body and ensure it's positioned correctly
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

// Add sky and sun first
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const sun = new THREE.Vector3();
const uniforms = sky.material.uniforms;
uniforms['turbidity'].value = 10;
uniforms['rayleigh'].value = 2;
uniforms['mieCoefficient'].value = 0.005;
uniforms['mieDirectionalG'].value = 0.8;

// Set up sun position
const phi = THREE.MathUtils.degToRad(90 - 2);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
uniforms['sunPosition'].value.copy(sun);

// Enhanced lighting setup - add this BEFORE creating water and materials
const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainLight.position.set(50, 100, 50);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 500;
scene.add(mainLight);

const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
backLight.position.set(-50, 100, -50);
scene.add(backLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-50, 50, 50);
scene.add(fillLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

// Create hemisphere light for better sky/ground interaction
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
scene.add(hemiLight);

// Create river with elevation changes and rapids
const riverLength = 1000;
const riverWidth = 100;
const riverSegments = 200;

function createRiverGeometry() {
    const geometry = new THREE.PlaneGeometry(riverWidth, riverLength, riverSegments, riverSegments);
    const positions = geometry.attributes.position.array;
    
    // Create more random and dynamic water features
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Base elevation with multiple wave patterns
        let y = -z * 0.05; // General downstream slope
        
        // Add multiple wave frequencies for more chaos
        y += Math.sin(z * 0.2 + x * 0.3) * 0.8; // Large diagonal waves
        y += Math.sin(x * 0.5 + z * 0.1) * 0.4; // Cross-stream variations
        y += Math.sin(z * 0.8 + x * 0.4) * 0.3; // Small choppy waves
        
        // Add specific rapid sections with more randomness
        if (z < -200 && z > -300) {
            y += Math.sin(z * 0.8 + x * 0.6) * 1.2;
            y += Math.cos(x * 0.4 + z * 0.3) * 0.7;
            y += (Math.random() - 0.5) * 0.5; // Random chop
        }
        
        if (z < -500 && z > -600) {
            y += Math.sin(z * 1.2 + x * 0.8) * 1.8;
            y += Math.sin(x * 0.6 + z * 0.5) * 1.0;
            y += (Math.random() - 0.5) * 0.8; // More intense random chop
        }
        
        positions[i + 1] = y;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
}

const riverGeometry = createRiverGeometry();

// Create rocks
function createRock(x, z, scale) {
    const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, -1.5, z);
    rock.scale.set(scale, scale * 1.2, scale);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    return rock;
}

// Add rocks to the river
const rocks = [];
const rockPositions = [
    // First rapids section
    { x: -20, z: -220, scale: 3 },
    { x: 15, z: -250, scale: 2.5 },
    { x: -10, z: -280, scale: 2 },
    // Second rapids section
    { x: 25, z: -520, scale: 3.5 },
    { x: -15, z: -550, scale: 3 },
    { x: 5, z: -580, scale: 2.5 },
    // Scattered rocks
    { x: -30, z: -150, scale: 2 },
    { x: 20, z: -350, scale: 2.5 },
    { x: -25, z: -450, scale: 2 },
    { x: 30, z: -650, scale: 3 }
];

rockPositions.forEach(pos => {
    const rock = createRock(pos.x, pos.z, pos.scale);
    rocks.push(rock);
    scene.add(rock);
});

// Create procedural riverbed texture
function createRiverbedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create a noisy rock pattern
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const noise1 = Math.random() * 0.3;
            const noise2 = Math.sin(x/20) * Math.cos(y/20) * 0.2;
            const noise3 = Math.sin(x/5 + y/10) * 0.1;
            
            const value = Math.min(Math.max(0.3 + noise1 + noise2 + noise3, 0), 1);
            const color = Math.floor(value * 255);
            
            ctx.fillStyle = `rgb(${color}, ${color * 0.9}, ${color * 0.8})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 20);
    return texture;
}

// Create procedural normal map for riverbed
function createRiverbedNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const noise = Math.sin(x/10) * Math.cos(y/10) * 0.5 + 0.5;
            const r = Math.floor(128 + noise * 127); // x-normal
            const g = Math.floor(128 + noise * 127); // y-normal
            const b = 255; // z-normal (mostly pointing up)
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 20);
    return texture;
}

// Create procedural caustics texture
function createCausticsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create caustics pattern
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const noise1 = Math.sin(x/30) * Math.cos(y/30) * 0.5 + 0.5;
            const noise2 = Math.sin(x/20 + y/40) * Math.cos(y/20 + x/40) * 0.5 + 0.5;
            const value = (noise1 + noise2) / 2;
            
            const alpha = Math.min(Math.max(value * 0.7, 0), 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

// Create riverbed with procedural textures
function createRiverbed() {
    const riverbedGeometry = createRiverGeometry();
    
    const riverbedTexture = createRiverbedTexture();
    const riverbedNormal = createRiverbedNormalMap();
    
    const riverbedMaterial = new THREE.MeshStandardMaterial({
        map: riverbedTexture,
        normalMap: riverbedNormal,
        roughness: 0.8,
        metalness: 0.2,
        color: 0x666666
    });
    
    const riverbed = new THREE.Mesh(riverbedGeometry, riverbedMaterial);
    riverbed.rotation.x = -Math.PI / 2;
    riverbed.position.y = -3;
    
    return riverbed;
}

const riverbed = createRiverbed();
scene.add(riverbed);

// Create water with procedural textures
const waterNormals = createRiverbedNormalMap(); // Reuse normal map for water
const causticsTexture = createCausticsTexture();

// Update water material for more realistic water
const river = new Water(riverGeometry, {
    textureWidth: 2048,
    textureHeight: 2048,
    waterNormals: waterNormals,
    sunDirection: sun,
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 2.5,
    fog: false,
    format: THREE.RGBAFormat,
    clipBias: 0.0,
    alpha: 0.8,
    reflectivity: 0.8,
    size: 4
});

// Initialize water uniforms
if (river.material && river.material.uniforms) {
    river.material.uniforms['time'].value = 0;
    river.material.uniforms['sunDirection'].value.copy(sun);
    river.material.uniforms['distortionScale'].value = 2.5;
    river.material.uniforms['size'].value = 4;
    
    // Add custom uniforms for caustics
    river.material.uniforms['causticsTex'] = { value: causticsTexture };
    river.material.uniforms['causticsScale'] = { value: 0.5 };
    river.material.uniforms['causticsSpeed'] = { value: 0.05 };
}

river.rotation.x = -Math.PI / 2;
river.position.y = -1.8;
scene.add(river);

// Enhanced foam particle system with varying sizes and behaviors
function createFoamParticles() {
    const particleCount = 3000; // Increased particle count
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3); // Add velocity for each particle
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Initialize positions with more concentration in rapids
        positions[i] = (Math.random() - 0.5) * riverWidth * 0.8;
        positions[i + 1] = Math.random() * 0.5; // Lower height for better water contact
        positions[i + 2] = (Math.random() - 0.5) * riverLength;
        
        // Initialize velocities
        velocities[i] = (Math.random() - 0.5) * 0.1;
        velocities[i + 1] = Math.random() * 0.05;
        velocities[i + 2] = -0.2 - Math.random() * 0.3;
        
        // Vary particle sizes more dramatically
        sizes[i/3] = 0.1 + Math.random() * 0.4;
        opacities[i/3] = 0.2 + Math.random() * 0.6;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particles.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        map: createParticleTexture()
    });
    
    return new THREE.Points(particles, particleMaterial);
}

// Create a more natural looking particle texture
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create water splash system
function createWaterSplash() {
    const splashCount = 1000;
    const splashGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(splashCount * 3);
    const velocities = new Float32Array(splashCount * 3);
    const lifetimes = new Float32Array(splashCount);
    const sizes = new Float32Array(splashCount);
    
    for (let i = 0; i < splashCount * 3; i += 3) {
        positions[i] = 0;
        positions[i + 1] = 0;
        positions[i + 2] = 0;
        
        velocities[i] = (Math.random() - 0.5) * 0.3;
        velocities[i + 1] = Math.random() * 0.5;
        velocities[i + 2] = (Math.random() - 0.5) * 0.3;
        
        lifetimes[i/3] = 0;
        sizes[i/3] = 0.05 + Math.random() * 0.15;
    }
    
    splashGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    splashGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    splashGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    splashGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const splashMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        map: createParticleTexture()
    });
    
    return new THREE.Points(splashGeometry, splashMaterial);
}

const foam = createFoamParticles();
const splash = createWaterSplash();
scene.add(foam);
scene.add(splash);

// Create canyon walls
const canyonMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.2
});

// Left wall
const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(riverLength, 100),
    canyonMaterial
);
leftWall.position.set(-riverWidth/2, 50, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(riverLength, 100),
    canyonMaterial
);
rightWall.position.set(riverWidth/2, 50, 0);
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

// Create kayaker
function createKayaker() {
    const kayakerGroup = new THREE.Group();
    
    // Create kayak body - scaled up
    const kayakBody = new THREE.Group();
    
    // Main hull shape - proper whitewater kayak profile (scaled up)
    const points = [];
    // Bottom profile points (bow to stern)
    points.push(new THREE.Vector3(0, 0, -9));      // Bow tip
    points.push(new THREE.Vector3(0, 1.2, -7.5));  // Bow rocker
    points.push(new THREE.Vector3(0, 1.5, -4.5));  // Front deck
    points.push(new THREE.Vector3(0, 1.2, 0));     // Center
    points.push(new THREE.Vector3(0, 1.5, 4.5));   // Back deck
    points.push(new THREE.Vector3(0, 1.2, 7.5));   // Stern rocker
    points.push(new THREE.Vector3(0, 0, 9));       // Stern tip

    // Create hull shape - wider in the middle
    const hullShape = new THREE.Shape();
    // Start at the bow
    hullShape.moveTo(0, -1.5);
    // Port side curve - more pronounced in middle
    hullShape.quadraticCurveTo(-2.5, 0, 0, 1.5);  // Increased width from -1.5 to -2.5
    // Starboard side curve - more pronounced in middle
    hullShape.quadraticCurveTo(2.5, 0, 0, -1.5);  // Increased width from 1.5 to 2.5

    // Extrude settings for the hull - adjusted for smoother transition
    const extrudeSettings = {
        steps: 50,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 12,
        extrudePath: new THREE.CatmullRomCurve3(points)
    };

    // Create hull geometry and material
    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066cc,  // Pyranha blue
        roughness: 0.5,
        metalness: 0.2
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    
    // Create cockpit - scaled up and wider
    const cockpitShape = new THREE.Shape();
    cockpitShape.ellipse(0, 0, 1.4, 0.9, 0, Math.PI * 2);  // Increased width to match wider hull
    
    const cockpitExtrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 4
    };
    
    const cockpitGeometry = new THREE.ExtrudeGeometry(cockpitShape, cockpitExtrudeSettings);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.rotation.x = -Math.PI / 2;
    cockpit.position.set(0, 1.5, 0);
    
    // Create cockpit rim - scaled up and wider
    const rimGeometry = new THREE.TorusGeometry(1.4, 0.12, 16, 32);  // Increased radius to match cockpit
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.6, 0);
    
    kayakBody.add(hull);
    kayakBody.add(cockpit);
    kayakBody.add(rim);
    kayakerGroup.add(kayakBody);
    
    // Create paddler - scaled up
    const paddlerGroup = new THREE.Group();
    
    // Torso - scaled up
    const torsoGeometry = new THREE.BoxGeometry(1.2, 2, 1);
    const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, 2.5, 0);
    paddlerGroup.add(torso);
    
    // Head - scaled up
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 3.8, 0);
    paddlerGroup.add(head);
    
    // Create paddle - scaled up
    const paddleGroup = new THREE.Group();
    
    // Shaft - thicker and longer
    const shaftGeometry = new THREE.CylinderGeometry(0.12, 0.12, 8, 12); // Doubled thickness, longer length
    const shaftMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.8,
        roughness: 0.2
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    paddleGroup.add(shaft);
    
    // Create oval blade shape
    const bladeShape = new THREE.Shape();
    const radiusX = 0.8;  // Width of oval
    const radiusY = 1.2;  // Length of oval
    
    // Draw oval shape
    for (let i = 0; i <= 360; i++) {
        const angle = (i * Math.PI) / 180;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        if (i === 0) {
            bladeShape.moveTo(x, y);
        } else {
            bladeShape.lineTo(x, y);
        }
    }
    
    const bladeGeometry = new THREE.ShapeGeometry(bladeShape);
    const bladeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000, // Black
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.DoubleSide // Visible from both sides
    });
    
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.position.y = 4; // Moved out to match longer shaft
    blade1.position.x = 0.15; // Increased offset for thicker shaft
    
    const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.position.y = -4; // Moved out to match longer shaft
    blade2.position.x = 0.15; // Increased offset for thicker shaft
    blade2.rotation.z = Math.PI; // Flip the bottom blade 180 degrees
    
    paddleGroup.add(blade1);
    paddleGroup.add(blade2);
    
    // Position paddle
    paddleGroup.position.set(0, 3.2, 0);
    paddleGroup.rotation.z = Math.PI / 2;
    
    paddlerGroup.add(paddleGroup);
    kayakerGroup.add(paddlerGroup);
    
    return kayakerGroup;
}

const kayaker = createKayaker();
scene.add(kayaker);

// Initial camera and kayaker position
const startPosition = new THREE.Vector3(0, 0, riverLength/2 - 20);
let kayakerPosition = new THREE.Vector3(0, 0, 0);
kayakerPosition.copy(startPosition);
kayaker.position.copy(startPosition);
kayaker.rotation.y = Math.PI; // Face into the scene

// Position camera behind kayaker
camera.position.set(0, 15, riverLength/2 + 10);
camera.lookAt(new THREE.Vector3(0, 0, -riverLength/2));

// Kayaker movement
const kayakerSpeed = 0.5; // Increased for better control
const waterFlowSpeed = 0.2; // Increased for better movement

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

    // Update sun and water
    const time = performance.now() * 0.001;
    
    // Subtle sun movement
    const phi = THREE.MathUtils.degToRad(90 - 2 + Math.sin(time * 0.1) * 2);
    const theta = THREE.MathUtils.degToRad(180 + Math.cos(time * 0.1) * 5);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    
    if (river.material && river.material.uniforms) {
        river.material.uniforms['sunDirection'].value.copy(sun);
        river.material.uniforms['time'].value = time * 0.3;
    }

    // Update water with more realistic movement
    if (river.material && river.material.uniforms) {
        const time = performance.now() * 0.001;
        river.material.uniforms['time'].value = time * 0.3; // Slower movement
        
        // Subtle distortion variation
        const baseDistortion = 2.5;
        const waveDistortion = Math.sin(time * 0.2) * 0.5 + Math.cos(time * 0.1) * 0.3;
        const rapidDistortion = Math.cos(time * 0.15) * 0.8;
        const totalDistortion = baseDistortion + waveDistortion + 
            (kayakerPosition.z < -200 && kayakerPosition.z > -300 || 
             kayakerPosition.z < -500 && kayakerPosition.z > -600 ? rapidDistortion : 0);
        
        river.material.uniforms['distortionScale'].value = totalDistortion;
        
        // Update caustics
        river.material.uniforms['causticsTex'].value.offset.y = time * 0.05;
        river.material.uniforms['causticsScale'].value = 0.5 + Math.sin(time * 0.2) * 0.1;
    }

    // Calculate wave height at kayaker's position
    const waveTime = performance.now() * 0.001;
    const kayakX = kayakerPosition.x;
    const kayakZ = kayakerPosition.z;
    
    // Complex wave height calculation based on multiple wave patterns
    let waveHeight = Math.sin(kayakX * 0.3 + waveTime * 0.5) * 0.8; // Base wave
    waveHeight += Math.sin(kayakZ * 0.2 + waveTime * 0.7) * 0.6; // Forward-back motion
    waveHeight += Math.cos(kayakX * 0.4 + kayakZ * 0.1 + waveTime) * 0.4; // Diagonal waves
    
    // Add more intense movement in rapids
    if (kayakZ < -200 && kayakZ > -300) {
        waveHeight *= 1.5;
        waveHeight += (Math.random() - 0.5) * 0.8;
    }
    if (kayakZ < -500 && kayakZ > -600) {
        waveHeight *= 2;
        waveHeight += (Math.random() - 0.5) * 1.2;
    }
    
    // Apply wave height to kayaker's y position and rotation
    kayakerPosition.y = waveHeight;
    
    // Calculate kayaker rotation based on wave slope
    const pitchAngle = Math.atan2(
        Math.cos(kayakZ * 0.2 + waveTime) * 0.2 + 
        Math.sin(kayakX * 0.3 + waveTime * 0.7) * 0.15,
        1
    );
    const rollAngle = Math.atan2(
        Math.sin(kayakX * 0.4 + waveTime) * 0.15 + 
        Math.cos(kayakZ * 0.3 + waveTime * 0.5) * 0.1,
        1
    );
    
    // Apply rotations to kayaker
    kayaker.rotation.set(
        pitchAngle, // Forward/backward tilt
        Math.PI, // Base rotation (facing into scene)
        rollAngle // Side-to-side roll
    );

    // Update kayaker position with water flow and momentum
    const flowStrength = 0.2 + Math.sin(waveTime * 0.5) * 0.05; // Varying flow speed
    kayakerPosition.z -= flowStrength * 2;

    // Apply user controls with momentum and wave influence
    if (keys.ArrowLeft) {
        kayakerPosition.x -= kayakerSpeed * (1 + Math.sin(waveTime) * 0.2);
    }
    if (keys.ArrowRight) {
        kayakerPosition.x += kayakerSpeed * (1 + Math.sin(waveTime) * 0.2);
    }
    if (keys.ArrowUp) {
        kayakerPosition.z -= kayakerSpeed * 2 * (1 + Math.cos(waveTime) * 0.15);
    }
    if (keys.ArrowDown) {
        kayakerPosition.z += kayakerSpeed * (1 + Math.cos(waveTime) * 0.15);
    }

    // Keep kayaker within bounds with wave influence
    kayakerPosition.x = Math.max(-riverWidth/2 + 2, Math.min(riverWidth/2 - 2, kayakerPosition.x));
    kayakerPosition.z = Math.max(-riverLength/2, Math.min(riverLength/2, kayakerPosition.z));

    kayaker.position.copy(kayakerPosition);

    // Update camera to follow kayaker with wave-influenced movement
    const cameraHeight = 20 + Math.sin(waveTime * 0.3) * 2; // Dynamic camera height
    const cameraDistance = 30 + Math.cos(waveTime * 0.4) * 3; // Dynamic camera distance
    
    camera.position.set(
        kayakerPosition.x + Math.sin(waveTime * 0.2) * 2, // Slight camera sway
        cameraHeight,
        kayakerPosition.z + cameraDistance
    );
    camera.lookAt(
        kayakerPosition.x,
        kayakerPosition.y, // Look at actual kayaker height
        kayakerPosition.z - 30
    );

    // Update foam particles
    const foamPositions = foam.geometry.attributes.position.array;
    const foamVelocities = foam.geometry.attributes.velocity.array;
    const foamSizes = foam.geometry.attributes.size.array;
    const foamOpacities = foam.geometry.attributes.opacity.array;
    
    for (let i = 0; i < foamPositions.length; i += 3) {
        // Update position based on velocity
        foamPositions[i] += foamVelocities[i];
        foamPositions[i + 1] += foamVelocities[i + 1];
        foamPositions[i + 2] += foamVelocities[i + 2];
        
        // Add wave influence
        foamPositions[i + 1] += Math.sin(foamPositions[i] * 0.3 + waveTime) * 0.02;
        
        // Increase turbulence in rapids
        if (foamPositions[i + 2] < -200 && foamPositions[i + 2] > -300) {
            foamPositions[i] += (Math.random() - 0.5) * 0.2;
            foamPositions[i + 1] += Math.random() * 0.1;
            foamOpacities[i/3] = Math.min(1, foamOpacities[i/3] + 0.1);
            foamSizes[i/3] = Math.min(0.8, foamSizes[i/3] + 0.05);
        }
        
        if (foamPositions[i + 2] < -500 && foamPositions[i + 2] > -600) {
            foamPositions[i] += (Math.random() - 0.5) * 0.3;
            foamPositions[i + 1] += Math.random() * 0.15;
            foamOpacities[i/3] = Math.min(1, foamOpacities[i/3] + 0.15);
            foamSizes[i/3] = Math.min(1, foamSizes[i/3] + 0.08);
        }
        
        // Reset particles that go out of bounds
        if (foamPositions[i + 2] < -riverLength/2 || 
            Math.abs(foamPositions[i]) > riverWidth/2 ||
            foamPositions[i + 1] > 2) {
            
            foamPositions[i] = (Math.random() - 0.5) * riverWidth * 0.8;
            foamPositions[i + 1] = Math.random() * 0.5;
            foamPositions[i + 2] = riverLength/2;
            
            foamVelocities[i] = (Math.random() - 0.5) * 0.1;
            foamVelocities[i + 1] = Math.random() * 0.05;
            foamVelocities[i + 2] = -0.2 - Math.random() * 0.3;
            
            foamSizes[i/3] = 0.1 + Math.random() * 0.4;
            foamOpacities[i/3] = 0.2 + Math.random() * 0.6;
        }
    }
    
    // Update splash particles
    const splashPositions = splash.geometry.attributes.position.array;
    const splashVelocities = splash.geometry.attributes.velocity.array;
    const splashLifetimes = splash.geometry.attributes.lifetime.array;
    
    // Create new splashes near kayaker in rapids
    if ((kayakerPosition.z < -200 && kayakerPosition.z > -300) ||
        (kayakerPosition.z < -500 && kayakerPosition.z > -600)) {
        for (let i = 0; i < 10; i++) {
            const index = Math.floor(Math.random() * splashPositions.length / 3) * 3;
            if (splashLifetimes[index/3] <= 0) {
                splashPositions[index] = kayakerPosition.x + (Math.random() - 0.5) * 4;
                splashPositions[index + 1] = kayakerPosition.y;
                splashPositions[index + 2] = kayakerPosition.z + (Math.random() - 0.5) * 4;
                
                splashVelocities[index] = (Math.random() - 0.5) * 0.3;
                splashVelocities[index + 1] = 0.2 + Math.random() * 0.3;
                splashVelocities[index + 2] = (Math.random() - 0.5) * 0.3;
                
                splashLifetimes[index/3] = 1.0;
            }
        }
    }
    
    // Update existing splashes
    for (let i = 0; i < splashLifetimes.length; i++) {
        if (splashLifetimes[i] > 0) {
            const idx = i * 3;
            splashPositions[idx] += splashVelocities[idx] * 0.5;
            splashPositions[idx + 1] += splashVelocities[idx + 1] * 0.5;
            splashPositions[idx + 2] += splashVelocities[idx + 2] * 0.5;
            
            splashVelocities[idx + 1] -= 0.02; // Gravity
            splashLifetimes[i] -= 0.02;
            
            splash.material.opacity = Math.max(0, splashLifetimes[i]);
        }
    }
    
    foam.geometry.attributes.position.needsUpdate = true;
    foam.geometry.attributes.size.needsUpdate = true;
    foam.geometry.attributes.opacity.needsUpdate = true;
    splash.geometry.attributes.position.needsUpdate = true;
    splash.material.opacity = Math.max(0.4, Math.min(0.8, splash.material.opacity));

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