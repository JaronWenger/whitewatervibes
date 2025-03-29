import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0xCCCCCC, 0.0005);

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;

// Add sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

// Set up sun
const sun = new THREE.Vector3();
const uniforms = sky.material.uniforms;
uniforms['turbidity'].value = 5;
uniforms['rayleigh'].value = 1;
uniforms['mieCoefficient'].value = 0.005;
uniforms['mieDirectionalG'].value = 0.7;

// Set sun position
const phi = THREE.MathUtils.degToRad(90 - 45);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
uniforms['sunPosition'].value.copy(sun);

// Lighting setup
const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(50, 100, 50);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 500;
mainLight.shadow.camera.left = -250;
mainLight.shadow.camera.right = 250;
mainLight.shadow.camera.top = 250;
mainLight.shadow.camera.bottom = -250;
scene.add(mainLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));

// Create terrain
const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
const positions = terrainGeometry.attributes.position.array;

// Generate gentle terrain
for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Create gentle hills
    let y = 0;
    y += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 20;
    y += Math.sin(x * 0.01) * Math.cos(z * 0.01) * 10;
    
    // Create lake basin
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    if (distanceFromCenter < 200) {
        y = Math.max(y, -5);
    }
    
    positions[i + 1] = y;
}

terrainGeometry.computeVertexNormals();
const terrainMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x3b2d1d,
    roughness: 0.8,
    metalness: 0.1,
    vertexColors: false
});

const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Create lake with improved shader
const lakeGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
const lakeMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uWavesAmplitude: { value: 0.5 },
        uWavesSpeed: { value: 0.5 },
        uWavesFrequency: { value: 0.1 },
        uWavesPersistence: { value: 0.5 },
        uWavesLacunarity: { value: 2.0 },
        uWavesIterations: { value: 4.0 },
        uOpacity: { value: 0.9 },
        uTroughColor: { value: new THREE.Color(0x0064b5) },
        uSurfaceColor: { value: new THREE.Color(0x0077ff) },
        uPeakColor: { value: new THREE.Color(0x00a2ff) },
        uPeakThreshold: { value: 0.1 },
        uPeakTransition: { value: 0.05 },
        uTroughThreshold: { value: -0.1 },
        uTroughTransition: { value: 0.05 },
        uFresnelScale: { value: 0.5 },
        uFresnelPower: { value: 2.0 },
        uEnvironmentMap: { value: new THREE.CubeTextureLoader().load([
            'px.jpg', 'nx.jpg',
            'py.jpg', 'ny.jpg',
            'pz.jpg', 'nz.jpg'
        ]) }
    },
    vertexShader: `
        precision highp float;
        uniform float uTime;
        uniform float uWavesAmplitude;
        uniform float uWavesSpeed;
        uniform float uWavesFrequency;
        uniform float uWavesPersistence;
        uniform float uWavesLacunarity;
        uniform float uWavesIterations;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        vec4 permute(vec4 x) {
            return mod(((x * 34.0) + 1.0) * x, 289.0);
        }

        vec3 permute(vec3 x) {
            return mod(((x * 34.0) + 1.0) * x, 289.0);
        }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
            m = m * m;
            m = m * m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        float getElevation(float x, float z) {
            vec2 pos = vec2(x, z);
            float elevation = 0.0;
            float amplitude = 1.0;
            float frequency = uWavesFrequency;
            vec2 p = pos.xy;

            for(float i = 0.0; i < uWavesIterations; i++) {
                float noiseValue = snoise(p * frequency + uTime * uWavesSpeed);
                elevation += amplitude * noiseValue;
                amplitude *= uWavesPersistence;
                frequency *= uWavesLacunarity;
            }

            elevation *= uWavesAmplitude;
            return elevation;
        }

        void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            float elevation = getElevation(modelPosition.x, modelPosition.z);
            modelPosition.y += elevation;

            float eps = 0.001;
            vec3 tangent = normalize(vec3(eps, getElevation(modelPosition.x - eps, modelPosition.z) - elevation, 0.0));
            vec3 bitangent = normalize(vec3(0.0, getElevation(modelPosition.x, modelPosition.z - eps) - elevation, eps));
            vec3 objectNormal = normalize(cross(tangent, bitangent));

            vNormal = objectNormal;
            vWorldPosition = modelPosition.xyz;

            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
    `,
    fragmentShader: `
        precision highp float;
        uniform float uOpacity;
        uniform vec3 uTroughColor;
        uniform vec3 uSurfaceColor;
        uniform vec3 uPeakColor;
        uniform float uPeakThreshold;
        uniform float uPeakTransition;
        uniform float uTroughThreshold;
        uniform float uTroughTransition;
        uniform float uFresnelScale;
        uniform float uFresnelPower;
        uniform samplerCube uEnvironmentMap;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
            vec3 reflectedDirection = reflect(viewDirection, vNormal);
            reflectedDirection.x = -reflectedDirection.x;

            vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDirection);

            float fresnel = uFresnelScale * pow(1.0 - clamp(dot(viewDirection, vNormal), 0.0, 1.0), uFresnelPower);

            float elevation = vWorldPosition.y;

            float peakFactor = smoothstep(uPeakThreshold - uPeakTransition, uPeakThreshold + uPeakTransition, elevation);
            float troughFactor = smoothstep(uTroughThreshold - uTroughTransition, uTroughThreshold + uTroughTransition, elevation);

            vec3 mixedColor1 = mix(uTroughColor, uSurfaceColor, troughFactor);
            vec3 mixedColor2 = mix(mixedColor1, uPeakColor, peakFactor);

            vec3 finalColor = mix(mixedColor2, reflectionColor.rgb, fresnel);

            gl_FragColor = vec4(finalColor, uOpacity);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide
});

const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
lake.rotation.x = -Math.PI / 2;
lake.position.y = -0.05;
scene.add(lake);

// Create trees
function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2F10 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Tree top
    const topGeometry = new THREE.ConeGeometry(3, 6, 8);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5A27 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 7;
    top.castShadow = true;
    top.receiveShadow = true;
    treeGroup.add(top);
    
    treeGroup.position.set(x, 0, z);
    return treeGroup;
}

// Add more trees around the lake
const treePositions = [];
const lakeRadius = 200;
const treeCount = 40;

// Generate trees in a circle around the lake
for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2;
    const radius = lakeRadius + 20 + Math.random() * 30; // Random distance from lake edge
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    treePositions.push({ x, z });
}

// Add some random trees in the background
for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = lakeRadius + 100 + Math.random() * 200;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    treePositions.push({ x, z });
}

treePositions.forEach(pos => {
    scene.add(createTree(pos.x, pos.z));
});

// Create kayak (fallback model)
function createKayak() {
    const kayakGroup = new THREE.Group();
    
    // Kayak body
    const kayakGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    const kayakMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const kayak = new THREE.Mesh(kayakGeometry, kayakMaterial);
    kayak.rotation.z = Math.PI / 2;
    kayak.castShadow = true;
    kayak.receiveShadow = true;
    kayakGroup.add(kayak);
    
    // Paddle
    const paddleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle.position.set(0, 1, 2);
    paddle.rotation.x = Math.PI / 4;
    paddle.castShadow = true;
    paddle.receiveShadow = true;
    kayakGroup.add(paddle);
    
    return kayakGroup;
}

// Load kayaker model
const loader = new GLTFLoader();
let kayaker;
let mixer; // Animation mixer for the model

loader.load(
    './models/scene.glb',
    function (gltf) {
        kayaker = gltf.scene;
        kayaker.scale.set(1.0, 1.0, 1.0);
        kayaker.position.set(0, 0.1, 0);
        kayaker.rotation.y = Math.PI;
        scene.add(kayaker);
        
        // Enable shadows for the kayaker
        kayaker.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        // Try to find and animate the paddle
        kayaker.traverse((node) => {
            if (node.isMesh && node.name.toLowerCase().includes('paddle')) {
                console.log('Found paddle:', node.name);
                // Store reference to paddle for animation
                kayaker.paddle = node;
            }
        });
    },
    // Progress callback
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // Error callback
    function (error) {
        console.warn('Error loading kayaker model, using fallback kayak:', error);
        kayaker = createKayak();
        kayaker.position.set(0, 0.05, 0);
        scene.add(kayaker);
    }
);

// User controls for kayaking
const kayakSpeed = 0.5;
const rotationSpeed = 0.08;
let kayakVelocity = new THREE.Vector3();
let kayakRotation = 0;
let targetRotation = 0;
const rotationLerpFactor = 0.15;
let rotationVelocity = 0;
const rotationAcceleration = 0.15;
const maxRotationSpeed = 0.08;

// Add forward movement parameters
let forwardVelocity = 0;
const maxSpeed = 0.5;
const acceleration = 0.02; // Slower acceleration for smoother movement
const deceleration = 0.02; // Same as acceleration for consistent feel

// Track active keys
const activeKeys = new Set();

document.addEventListener('keydown', (event) => {
    activeKeys.add(event.key);
    updateMovement();
});

document.addEventListener('keyup', (event) => {
    activeKeys.delete(event.key);
    updateMovement();
});

// Update movement based on active keys
function updateMovement() {
    // Handle forward/backward movement with smooth acceleration/deceleration
    if (activeKeys.has('ArrowDown')) {
        forwardVelocity = Math.min(forwardVelocity + acceleration, maxSpeed);
    } else if (activeKeys.has('ArrowUp')) {
        forwardVelocity = Math.max(forwardVelocity - acceleration, -maxSpeed);
    } else {
        // Smoothly decelerate to stop when no keys are pressed
        if (forwardVelocity > 0) {
            forwardVelocity = Math.max(0, forwardVelocity - deceleration);
        } else if (forwardVelocity < 0) {
            forwardVelocity = Math.min(0, forwardVelocity + deceleration);
        }
    }
    
    // Handle rotation with smooth acceleration/deceleration
    if (activeKeys.has('ArrowLeft')) {
        rotationVelocity = Math.min(rotationVelocity + rotationAcceleration, maxRotationSpeed);
    } else if (activeKeys.has('ArrowRight')) {
        rotationVelocity = Math.max(rotationVelocity - rotationAcceleration, -maxRotationSpeed);
    } else {
        // Simply stop rotation when no keys are pressed
        rotationVelocity = 0;
    }
}

// Camera follow settings
const cameraOffset = new THREE.Vector3(0, 6, 8);
const cameraLerpFactor = 0.2;

// Update camera position and target
function updateCamera() {
    if (!kayaker) return;
    
    // Calculate target position (slightly above kayaker)
    const targetPosition = kayaker.position.clone().add(new THREE.Vector3(0, 4, 0));
    
    // Calculate camera position based on kayaker's rotation and offset
    const cameraPosition = kayaker.position.clone()
        .add(new THREE.Vector3(
            Math.sin(kayaker.rotation.y) * cameraOffset.z,
            cameraOffset.y,
            Math.cos(kayaker.rotation.y) * cameraOffset.z
        ));
    
    // Smoothly move camera
    camera.position.lerp(cameraPosition, cameraLerpFactor);
    
    // Make camera look at kayaker
    camera.lookAt(targetPosition);
}

// Create fish
function createFish() {
    const fishGroup = new THREE.Group();
    
    // Fish body
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        metalness: 0.8,
        roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    fishGroup.add(body);
    
    // Fish tail
    const tailGeometry = new THREE.ConeGeometry(0.3, 1, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        metalness: 0.8,
        roughness: 0.2
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.x = -0.5;
    tail.rotation.z = Math.PI / 2;
    tail.castShadow = true;
    tail.receiveShadow = true;
    fishGroup.add(tail);
    
    return fishGroup;
}

// Create multiple fish
const fishCount = 5;
const fish = [];
const fishSettings = [];

for (let i = 0; i < fishCount; i++) {
    const newFish = createFish();
    scene.add(newFish);
    fish.push(newFish);
    
    // Random position around the lake
    const angle = Math.random() * Math.PI * 2;
    const radius = 100 + Math.random() * 80;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    newFish.position.set(x, -0.1, z);
    
    // Random settings for each fish
    fishSettings.push({
        jumpHeight: 2 + Math.random() * 2,
        jumpSpeed: 1 + Math.random() * 0.5,
        jumpOffset: Math.random() * Math.PI * 2,
        swimSpeed: 0.5 + Math.random() * 0.5,
        swimRadius: radius,
        swimAngle: angle
    });
}

// Add wave function for kayaker bobbing
function getWaveHeight(x, z, time) {
    // Match water shader parameters exactly
    const amplitude = 0.5; // Match uWavesAmplitude
    const frequency = 0.1; // Match uWavesFrequency
    const speed = 0.5; // Match uWavesSpeed
    const persistence = 0.5; // Match uWavesPersistence
    const lacunarity = 2.0; // Match uWavesLacunarity
    const iterations = 4.0; // Match uWavesIterations
    
    let elevation = 0.0;
    let currentAmplitude = 1.0;
    let currentFrequency = frequency;
    
    // Use the same wave calculation as the water shader
    for (let i = 0; i < iterations; i++) {
        const noiseValue = Math.sin(x * currentFrequency + time * speed) * 
                          Math.cos(z * currentFrequency + time * speed);
        elevation += currentAmplitude * noiseValue;
        currentAmplitude *= persistence;
        currentFrequency *= lacunarity;
    }
    
    // Scale the elevation to match water shader
    elevation *= amplitude;
    
    // Ensure minimum height above water
    return Math.max(0.05, elevation + 0.05);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    // Update water shader
    lakeMaterial.uniforms.uTime.value = time;
    
    // Update kayaker position and rotation
    if (kayaker) {
        // Apply smooth rotation with easing
        targetRotation += rotationVelocity;
        kayakRotation += (targetRotation - kayakRotation) * rotationLerpFactor;
        kayaker.rotation.y = kayakRotation;
        
        // Calculate movement direction based on rotation
        const moveDirection = new THREE.Vector3(
            Math.sin(kayakRotation),
            0,
            Math.cos(kayakRotation)
        );
        
        // Apply velocity with smooth acceleration/deceleration
        kayaker.position.add(moveDirection.multiplyScalar(forwardVelocity));
        
        // Keep kayaker within lake bounds
        const distanceFromCenter = kayaker.position.length();
        if (distanceFromCenter > 190) {
            kayaker.position.normalize().multiplyScalar(190);
        }
        
        // Add wave-based bobbing motion
        const waveHeight = getWaveHeight(kayaker.position.x, kayaker.position.z, time);
        kayaker.position.y = waveHeight;
        
        // Add slight rotation to match wave motion
        kayaker.rotation.x = Math.sin(time * 0.5) * 0.05; // Reduced rotation
        kayaker.rotation.z = Math.sin(time * 0.5) * 0.02; // Reduced rotation

        // Try to animate the paddle if it exists
        if (kayaker.paddle) {
            // Calculate paddle stroke phase
            const strokePhase = (time * 2.0) % 1;
            
            // Calculate paddle rotation based on stroke phase
            let paddleRotation;
            if (strokePhase < 0.5) {
                // Forward stroke
                paddleRotation = Math.PI / 4 + (strokePhase * 2) * (Math.PI / 3 - Math.PI / 6);
            } else {
                // Recovery stroke
                paddleRotation = Math.PI / 4 + Math.PI / 3 - ((strokePhase - 0.5) * 2) * (Math.PI / 3 - Math.PI / 6);
            }
            
            // Apply paddle rotation
            kayaker.paddle.rotation.x = paddleRotation;
            
            // Add slight wrist movement for more natural feel
            kayaker.paddle.rotation.z = Math.sin(time * 4) * 0.1;
        }
    }
    
    // Update fish positions
    fish.forEach((fish, index) => {
        const settings = fishSettings[index];
        
        // Jumping motion
        const jumpY = Math.sin(time * settings.jumpSpeed + settings.jumpOffset) * settings.jumpHeight;
        fish.position.y = -0.1 + jumpY;
        
        // Swimming motion
        settings.swimAngle += settings.swimSpeed * 0.01;
        fish.position.x = Math.cos(settings.swimAngle) * settings.swimRadius;
        fish.position.z = Math.sin(settings.swimAngle) * settings.swimRadius;
        
        // Make fish face direction of movement
        fish.rotation.y = settings.swimAngle + Math.PI / 2;
        
        // Add tail wagging
        fish.children[1].rotation.y = Math.sin(time * 5) * 0.3;
    });
    
    // Update camera
    updateCamera();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// Start animation
animate();

// Remove OrbitControls since we're using custom cameras
controls.dispose(); 