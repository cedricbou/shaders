import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import {
  TechnicalSet,
  addAnimator,
  addDefaultGrid,
  addDefaultLight,
  addOrbitControl,
  createRenderer,
  createDefaultTechnicalSet,
  startAnimationLoop,
  updateCameraPosition,
  addMesh,
} from './StageSet';

import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

vi.mock('three');
vi.mock('three/addons');

/**
 * Returns the real import of the module.
 */
const importActualThree = async function () {
  return await vi.importActual<typeof import('three')>('three');
};

/**
 * Expect a right either to contain a valid technical set.
 * @param eitherSet the either to expect.
 * @returns the technical set contained in the either.
 * @throws an error if the either is not right.
 */
const expectRightTechnicalSet = function (
  eitherSet: E.Either<string, TechnicalSet>,
): TechnicalSet {
  expect(E.isRight(eitherSet)).toBe(true);

  const set: TechnicalSet = E.getOrElseW(() => {
    throw new Error('No valid technical set found');
  })(eitherSet);

  return set;
};

describe('StageSet modifiers', () => {
  let initialSet: E.Either<string, TechnicalSet>;
  let three: typeof import('three');
  let threeActual: typeof import('three');
  let addons: typeof import('three/addons');

  beforeEach(async () => {
    three = await import('three');
    threeActual = await importActualThree();
    addons = await import('three/addons');

    const camera = new three.PerspectiveCamera();
    Object.defineProperty(camera, 'position', {
      get: () => new three.Vector3(0, 0, 0),
    });

    initialSet = E.right({
      scene: new three.Scene(),
      camera: camera,
      renderer: new three.WebGLRenderer(),
      animators: [],
      clock: new three.Clock(),
    } as TechnicalSet);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('should be able to add a default light to the technical set', async () => {
    const set = expectRightTechnicalSet(addDefaultLight(initialSet));
    expect(three.AmbientLight).toHaveBeenCalledTimes(1);
    expect(set.scene.add).toHaveBeenCalledTimes(1);
    expect(set.scene.add).toHaveBeenCalledWith(expect.any(three.AmbientLight));
  });

  test('should be able to add orbit controls to the technical set', async () => {
    const set = expectRightTechnicalSet(addOrbitControl(initialSet));
    expect(addons.OrbitControls).toHaveBeenCalledTimes(1);
    expect(addons.OrbitControls).toHaveBeenCalledWith(
      set.camera,
      set.renderer.domElement,
    );
  });

  test('should be able to declare a grid in the technical set', async () => {
    const set = expectRightTechnicalSet(addDefaultGrid(initialSet));
    expect(three.GridHelper).toHaveBeenCalledTimes(1);
    expect(set.scene.add).toHaveBeenCalledTimes(1);
    expect(set.scene.add).toHaveBeenCalledWith(expect.any(three.GridHelper));
  });

  test('should be able to add an animator to the technical set', async () => {
    const animator = vi.fn();
    const set = expectRightTechnicalSet(addAnimator(animator)(initialSet));
    expect(set.animators).toContain(animator);
    expect(set.animators.length).toBe(1);
  });

  test('should be able to modify camera position from the technical set', async () => {
    const positionTarget = new threeActual.Vector3(1, 2, 3);
    const set = expectRightTechnicalSet(
      updateCameraPosition(positionTarget)(initialSet),
    );
    expect(set.camera.position.copy).toHaveBeenCalledTimes(1);
    expect(set.camera.position.copy).toHaveBeenCalledWith(positionTarget);
  });

  test('should be able to add a task Mesh to the technical set', async () => {
    const mesh = O.some(new three.Mesh());
    const set = expectRightTechnicalSet(addMesh(mesh)(initialSet));
    expect(set.scene.add).toHaveBeenCalledTimes(1);
    expect(set.scene.add).toHaveBeenCalledWith(expect.any(three.Mesh));
  });
});

describe('Check animators behavior in the animation loop', () => {
  let initialSet: E.Either<string, TechnicalSet>;
  let three: typeof import('three');

  function mockCanvas() {
    const width = 200;
    const height = 100;

    const context = mock<WebGL2RenderingContext>();

    const rect = mock<DOMRect>();
    rect.width = width;
    rect.height = height;

    const rectList = mock<DOMRectList>();
    rectList.item.mockReturnValue(rect);

    const canvas = mock<HTMLCanvasElement>();
    canvas.getContext.mockReturnValue(context);
    canvas.getClientRects.mockReturnValue(rectList);
    canvas.width = rect.width;
    canvas.height = rect.height;

    return canvas;
  }

  function mockWindow() {
    let requestAnimationFrameCounter = 0;
    const requestAnimationFrame = vi.fn().mockImplementation((cb) => {
      requestAnimationFrameCounter++;
      if (requestAnimationFrameCounter <= 10) {
        cb();
      }
    });

    vi.stubGlobal('window', {
      devicePixelRatio: 1,
      requestAnimationFrame: requestAnimationFrame,
    });

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
  }

  beforeEach(async () => {
    three = await import('three');

    // Code needs a window (DOMWindow) for requestAnimationFrame and devicePixelRatio.
    mockWindow();

    // Code needs a canvas to create a renderer.
    const canvas = mockCanvas();

    // Mock webgl renderer with a canvas of size 100x100.
    const renderer = mock<THREE.WebGLRenderer>();
    renderer.domElement = canvas;
    vi.mocked(three.WebGLRenderer).mockReturnValue(renderer);

    // Initialise the stage
    initialSet = F.pipe(canvas, createRenderer, createDefaultTechnicalSet);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('creating a default technical set should trigger proper renderer creation', async () => {
    const set = expectRightTechnicalSet(initialSet);

    expect(three.WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(three.WebGLRenderer).toHaveBeenCalledWith({
      canvas: set.renderer.domElement,
      context: set.renderer.domElement.getContext('webgl2'),
    });
  });

  test('creating a default technical set should return a correctly initialised technical set', async () => {
    const set = expectRightTechnicalSet(initialSet);
    expect(set.camera).toBeDefined();
    expect(set.camera).toBeInstanceOf(three.PerspectiveCamera);
    expect(three.PerspectiveCamera).toHaveBeenCalledTimes(1);
    expect(three.PerspectiveCamera).toHaveBeenCalledWith(75, 2, 0.1, 1000);

    expect(set.renderer).toBeDefined();

    expect(set.scene).toBeDefined();
    expect(set.scene).toBeInstanceOf(three.Scene);

    expect(set.clock).toBeDefined();
    expect(set.clock).toBeInstanceOf(three.Clock);

    expect(set.animators).toBeDefined();
    expect(set.animators).toBeInstanceOf(Array);
    expect(set.animators.length).toBe(0);
  });

  test('add an animator to the technical stage and check it is called in the animation loop', async () => {
    const animator = vi.fn();

    expectRightTechnicalSet(
      F.pipe(
        initialSet,
        E.chain((set) => {
          set.clock.getDelta = vi.fn(() => 0.1);
          return E.right(set);
        }),
        addAnimator(animator),
        startAnimationLoop,
      ),
    );

    expect(animator).toHaveBeenCalledTimes(10);
    expect(animator).toHaveBeenNthCalledWith(1, 0.1);
    expect(animator).toHaveBeenNthCalledWith(5, 0.1);
    expect(animator).toHaveBeenLastCalledWith(0.1);
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

    const set = createRenderer(canvas);
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

    const set = createRenderer(canvas);
    expect(E.isLeft(set)).toBe(true);
    E.fold(
      (error) => expect(error).toBe('Failed to get webgl2 context from canvas'),
      (value) => expect(value).toBeUndefined(),
    )(set);
  });
});
