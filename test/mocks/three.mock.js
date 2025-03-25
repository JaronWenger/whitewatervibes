// Mock Three.js classes and methods
export const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  fog: undefined
};

export const mockCamera = {
  position: { set: vi.fn() },
  lookAt: vi.fn(),
  aspect: 1,
  updateProjectionMatrix: vi.fn()
};

export const mockRenderer = {
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  setClearColor: vi.fn(),
  render: vi.fn(),
  domElement: document.createElement('canvas'),
  toneMapping: 0,
  toneMappingExposure: 1
};

export const mockTextureLoader = {
  load: vi.fn((url, onLoad) => {
    const texture = {
      wrapS: 0,
      wrapT: 0,
      repeat: { set: vi.fn() }
    };
    if (onLoad) onLoad(texture);
    return texture;
  })
};

export const mockVector3 = {
  set: vi.fn(),
  copy: vi.fn(),
  add: vi.fn(),
  normalize: vi.fn()
};

// Mock Three.js module
const THREE = {
  Scene: vi.fn(() => mockScene),
  PerspectiveCamera: vi.fn(() => mockCamera),
  WebGLRenderer: vi.fn(() => mockRenderer),
  TextureLoader: vi.fn(() => mockTextureLoader),
  Vector3: vi.fn(() => mockVector3),
  PlaneGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  Mesh: vi.fn(),
  Group: vi.fn(() => ({ add: vi.fn(), position: { set: vi.fn() } })),
  RepeatWrapping: 0,
  ACESFilmicToneMapping: 0
};

export default THREE; 