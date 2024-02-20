import { describe, expect, test, vi } from 'vitest';
import { mock, mockClear, mockReset } from 'vitest-mock-extended';

import * as STAGE from './stage-set';
import * as MESH from './Mesh';

import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as F from 'fp-ts/function';

vi.mock('three');

let three: typeof import('three');
let threeActual: typeof import('three');

three = await import('three');
threeActual = await vi.importActual<typeof import('three')>('three');

function getAndPrepareRendererMockForTechnicalSet() {
  // Initialize the technical set to be tested
  // Create a mock renderer with a size of 100x100
  const renderer = mock<THREE.WebGLRenderer>();
  renderer.getSize.mockImplementation((target: THREE.Vector2) => {
    target.set(1280, 1024);
    return target;
  });

  // Create a mock perspective camera to spy on default camera creation.
  vi.mocked(three.PerspectiveCamera).mockImplementation(() => {
    const mockCamera = mock<THREE.PerspectiveCamera>();
    Object.defineProperty(mockCamera, 'position', {
      value: new threeActual.Vector3(),
    });
    return mockCamera;
  });

  // Use the actual Vector3 to mock a new instance of Vector3
  vi.mocked(three.Vector3).mockImplementation((x, y, z) => {
    return new threeActual.Vector3(x, y, z);
  });

  // Use the actual Vector2 to mock a new instance of Vector2
  vi.mocked(three.Vector2).mockImplementation((x, y) => {
    return new threeActual.Vector2(x, y);
  });

  return renderer;
}

describe('The technical set', () => {
  let set: STAGE.TechnicalSet;

  beforeEach(async () => {
    const renderer = getAndPrepareRendererMockForTechnicalSet();
    set = new STAGE.TechnicalSet(renderer, 100);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('should have a perspective default camera properly positionned with scale', async () => {
    expect(three.PerspectiveCamera).toHaveBeenCalledWith(
      75,
      1.25,
      0.1,
      100 * 100,
    );

    expect(set.camera.position).toEqual(
      new three.Vector3(2, 3, 5).multiplyScalar(100),
    );
    expect(set.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  test('should have a default empty scene', async () => {
    expect(three.Scene).toHaveBeenCalledOnce();
    expect(three.Scene).toHaveBeenCalledWith();
    expect(set.scene).toBeDefined();
    expect(set.scene).toBeInstanceOf(three.Scene);
  });

  test('should have a default clock', async () => {
    expect(three.Clock).toHaveBeenCalledOnce();
    expect(three.Clock).toHaveBeenCalledWith();
    expect(set.clock).toBeDefined();
    expect(set.clock).toBeInstanceOf(three.Clock);
  });

  test('should have a default scale of 100', async () => {
    expect(set.scale).toBe(100);
  });

  test('should have a default uniforms with iTime set to 0', async () => {
    expect(set.uniforms).toBeDefined();
    expect(set.uniforms).toHaveProperty('iTime');
    expect(set.uniforms.iTime.value).toBe(0);
  });

  test('should be able to change the camera and set back to the default camera', async () => {
    const camera = new three.PerspectiveCamera();
    set.withCamera(camera);
    expect(set.camera).toBe(camera);

    vi.mocked(three.PerspectiveCamera).mockClear();

    const mockedCamera = new three.PerspectiveCamera();
    const mockedCameraConstuctor = vi
      .mocked(three.PerspectiveCamera)
      .mockReturnValue(mockedCamera);

    set.withDefaultCamera();

    expect(mockedCameraConstuctor).toHaveBeenCalledWith(
      75,
      1.25,
      0.1,
      100 * 100,
    );
    expect(set.camera).toBe(mockedCamera);

    expect(set.camera.position).toEqual(
      new three.Vector3(2, 3, 5).multiplyScalar(100),
    );

    expect(set.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  test('should update uniforms on animate', async () => {
    expect(set.uniforms.iTime.value).toBe(0);
    set.animate(0.2);
    expect(set.uniforms.iTime.value).toBe(0.2);
    set.animate(0.5);
    expect(set.uniforms.iTime.value).toBe(0.5);
  });

  test('should animate a frame and call render on animateAndRender', async () => {
    set.animate = vi.fn();

    Object.defineProperty(set, 'clock', {
      value: { getDelta: vi.fn(() => 0.99) },
    });

    set.animateAndRender();

    expect(set.animate).toHaveBeenCalledOnce();
    expect(set.animate).toHaveBeenCalledWith(0.99);
    expect(set.renderer.render).toHaveBeenCalledOnce();
    expect(set.renderer.render).toHaveBeenCalledWith(set.scene, set.camera);
  });

  test('should setup default lighting to the scene withDefaultLighting', async () => {
    const mockedAmbientLight = new three.AmbientLight();
    const mockedDirectionalLight = new three.DirectionalLight();

    const directionLightPosition = new threeActual.Vector3();

    Object.defineProperty(mockedDirectionalLight, 'position', {
      value: directionLightPosition,
    });

    const mockedAmbientLightConstructor = vi
      .mocked(three.AmbientLight)
      .mockReturnValue(mockedAmbientLight);

    const mockedDirectionalLightConstructor = vi
      .mocked(three.DirectionalLight)
      .mockReturnValue(mockedDirectionalLight);

    const chainedSet = set.withDefaultLighting();

    expect(O.isSome(set.lighting)).toBe(true);

    F.pipe(
      set.lighting,
      O.map((lighting) => {
        expect(lighting.ambient).toBeDefined();
        expect(lighting.ambient).toBeInstanceOf(three.AmbientLight);
        expect(lighting.ambient).toBe(mockedAmbientLight);

        expect(lighting.directional).toBeDefined();
        expect(lighting.directional).toBeInstanceOf(three.DirectionalLight);
        expect(lighting.directional).toBe(mockedDirectionalLight);

        return lighting;
      }),
    );

    expect(set.scene.add).toHaveBeenCalledTimes(2);
    expect(set.scene.add).toHaveBeenCalledWith(mockedAmbientLight);
    expect(set.scene.add).toHaveBeenCalledWith(mockedDirectionalLight);

    expect(directionLightPosition).toEqual(new threeActual.Vector3(-1, 3, 2));

    expect(mockedAmbientLightConstructor).toHaveBeenCalledWith(
      three.Color.NAMES.lightyellow,
      0.5,
    );

    expect(mockedDirectionalLightConstructor).toHaveBeenCalledWith(
      three.Color.NAMES.floralwhite,
      0.5,
    );

    expect(chainedSet).toBe(set);
  });

  test('should add an actor to the set withActor', async () => {
    const actor = new MESH.Actor(new three.Mesh());
    const chainedSet = set.withActor(actor);

    expect(set.scene.add).toHaveBeenCalledOnce();
    expect(set.scene.add).toHaveBeenCalledWith(actor.mesh);
    expect(set.actors).toContain(actor);
    expect(chainedSet).toBe(set);
  });

  test('should animate and render all animators and actors from the set', async () => {
    Object.defineProperty(set, 'clock', {
      value: { getDelta: vi.fn(() => 0.99) },
    });

    const actor = new MESH.Actor(new three.Mesh());
    const animator = vi.fn();

    actor.animators.push(animator);

    set.withActor(actor).animateAndRender();

    expect(animator).toHaveBeenCalledOnce();
    expect(animator).toHaveBeenCalledWith(0.99);
    expect(set.uniforms.iTime.value).toBe(0.99);
    expect(set.renderer.render).toHaveBeenCalledOnce();
    expect(set.renderer.render).toHaveBeenCalledWith(set.scene, set.camera);
  });
});

describe('create a renderer fp-ts style', () => {
  let mockedRenderer = mock<THREE.WebGLRenderer>();
  let mockedCanvas = mock<HTMLCanvasElement>();

  function mockValidCanvasAndRenderer() {
    vi.stubGlobal('window', {
      devicePixelRatio: 1,
    });

    // Code needs a canvas to create a renderer.
    const width = 200;
    const height = 100;

    const context = mock<WebGL2RenderingContext>();

    const rect = mock<DOMRect>();

    rect.width = width;
    rect.height = height;

    const rectList = mock<DOMRectList>();
    rectList.item.mockReturnValue(rect);

    mockedCanvas.getContext.mockReturnValue(context);
    mockedCanvas.getClientRects.mockReturnValue(rectList);
    mockedCanvas.width = rect.width;
    mockedCanvas.height = rect.height;

    // Mock webgl renderer with a canvas of size 100x100.
    mockedRenderer.domElement = mockedCanvas;
    vi.mocked(three.WebGLRenderer).mockReturnValue(mockedRenderer);
  }

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();

    mockClear(mockedRenderer);
    mockClear(mockedCanvas);
    mockReset(mockedRenderer);
    mockReset(mockedCanvas);
  });

  test('creating a renderer with empty canvas.getClientRects() should fail and return an error either', async () => {
    const canvas = mock<HTMLCanvasElement>();
    const rectList = mock<DOMRectList>();
    rectList.item.mockReturnValue(null);
    Object.defineProperty(rectList, 'length', {
      get: () => {
        return 0;
      },
    });
    canvas.getClientRects.mockReturnValue(rectList);
    canvas.getContext.mockReturnValue(mock<WebGL2RenderingContext>());

    const renderer = mock<THREE.WebGLRenderer>();
    renderer.domElement = canvas;
    vi.mocked(three.WebGLRenderer).mockReturnValue(renderer);

    const set = STAGE.createRenderer(canvas);

    expect(E.isLeft(set)).toBe(true);
    E.fold(
      (error) => expect(error).toBe('no client rect found'),
      (value) => expect(value).toBeUndefined(),
    )(set);
  });

  test('creating renderer with a failing canvas.getContext() should fail and return an error either', async () => {
    const canvas = mock<HTMLCanvasElement>();
    canvas.getClientRects.mockReturnValue(mock<DOMRectList>());
    canvas.getContext.mockReturnValue(null);

    const renderer = mock<THREE.WebGLRenderer>();
    renderer.domElement = canvas;
    vi.mocked(three.WebGLRenderer).mockReturnValue(renderer);

    const set = STAGE.createRenderer(canvas);
    expect(E.isLeft(set)).toBe(true);
    E.fold(
      (error) => expect(error).toBe('Failed to get webgl2 context from canvas'),
      (value) => expect(value).toBeUndefined(),
    )(set);
  });

  test('creating renderer with proper canvas and webglcontext should return a valid WebGLRenderer', async () => {
    mockValidCanvasAndRenderer();

    const set = STAGE.createRenderer(mockedCanvas);
    expect(E.isRight(set)).toBe(true);
    E.fold(
      (error) => expect(error).toBeUndefined(),
      (value: THREE.WebGLRenderer) => {
        expect(value).toBe(mockedRenderer);
        expect(value.domElement).toBe(mockedCanvas);
        expect(three.WebGLRenderer).toHaveBeenCalledTimes(1);
        expect(three.WebGLRenderer).toHaveBeenCalledWith({
          canvas: value.domElement,
          context: value.domElement.getContext('webgl2'),
        });
      },
    )(set);
  });

  test('creating a technical set with a renderer should return a valid TechnicalSet', async () => {
    const mockedRenderer = getAndPrepareRendererMockForTechnicalSet();

    const eitherSet = F.pipe(
      E.right(mockedRenderer),
      STAGE.createTechnicalSet(),
    );

    expect(E.isRight(eitherSet)).toBe(true);
    E.fold(
      (error) => expect(error).toBeUndefined(),
      (value: STAGE.TechnicalSet) => {
        expect(value).toBeInstanceOf(STAGE.TechnicalSet);
        expect(value.renderer).toBe(mockedRenderer);
      },
    )(eitherSet);
  });
});
