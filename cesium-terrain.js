import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Initialize Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYjRhMWM5NS0yM2YxLTRkMmEtODdjOC00ZDc3YzE1ZjY2OWYiLCJpZCI6Mjg3NzE3LCJpYXQiOjE3NDI5NTU5NTB9.KzdPkV2kejI80V_6C_zB078v0MGWp8PnZeCjjG0whsM'; // You'll need to get this from cesium.com

// Create Cesium viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    imageryProvider: new Cesium.IonImageryProvider({ assetId: 3 }),
    baseLayerPicker: true,
    geocoder: true,
    homeButton: true,
    sceneModePicker: true,
    navigationHelpButton: true,
    animation: false,
    timeline: false,
    fullscreenButton: false
});

// Set the camera to Great Falls coordinates
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-77.25345, 38.99733, 1000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
    }
});

// Function to get terrain height at coordinates
export async function getTerrainHeight(longitude, latitude) {
    const positions = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [
        Cesium.Cartographic.fromDegrees(longitude, latitude)
    ]);
    return positions[0].height;
}

// Function to convert Cesium coordinates to Three.js coordinates
export function cesiumToThree(coordinates) {
    const cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height);
    return new THREE.Vector3(cartesian.x, cartesian.y, cartesian.z);
}

// Function to create river geometry based on actual terrain
export async function createRiverGeometry(riverWidth, riverLength, riverSegments) {
    const geometry = new THREE.PlaneGeometry(riverWidth, riverLength, riverSegments, riverSegments);
    const positions = geometry.attributes.position.array;
    
    // Get terrain data for Great Falls area
    const centerLat = 38.99733;
    const centerLon = -77.25345;
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Convert local coordinates to geographic coordinates
        const lat = centerLat + (z / 111320); // Approximate conversion
        const lon = centerLon + (x / (111320 * Math.cos(centerLat * Math.PI / 180)));
        
        // Get actual terrain height
        const height = await getTerrainHeight(lon, lat);
        
        positions[i + 1] = height;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
}

// Export viewer for camera synchronization
export { viewer }; 