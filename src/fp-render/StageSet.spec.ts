import { describe, expect, test, vi } from 'vitest';
import { any, mock } from 'vitest-mock-extended';
import {
  TechnicalSet,
  addAnimator,
  addDefaultGrid,
  addDefaultLight,
  addOrbitControl,
  createRenderer,
  createDefaultTechnicalSet,
  startAnimationLoop,
  renderScene,
} from './StageSet';

import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';
import { a } from 'vitest/dist/suite-ghspeorC.js';
import { aN } from 'vitest/dist/reporters-1evA5lom.js';

vi.mock('three');
vi.mock('three/addons');

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
  let addons: typeof import('three/addons');

  beforeEach(async () => {
    three = await import('three');
    addons = await import('three/addons');

    initialSet = E.right({
      scene: new three.Scene(),
      camera: new three.PerspectiveCamera(),
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
});

describe('Check animators behavior in the animation loop', () => {
  let initialSet: E.Either<string, TechnicalSet>;
  let three: typeof import('three');

  beforeEach(async () => {
    three = await import('three');

    let requestAnimationFrameCounter = 0;
    const requestAnimationFrame = vi.fn().mockImplementation((cb) => {
      requestAnimationFrameCounter++;
      if (requestAnimationFrameCounter < 10) {
        console.log(
          'requestAnimationFrameCounter',
          requestAnimationFrameCounter,
        );
        cb();
      }
    });

    vi.stubGlobal('window', {
      devicePixelRatio: 1,
      requestAnimationFrame: requestAnimationFrame,
    });

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);

    const context = mock<WebGL2RenderingContext>();

    const rect = mock<DOMRect>();
    rect.width = 100;
    rect.height = 100;

    const rectList = mock<DOMRectList>();
    rectList.item.mockReturnValue(rect);

    const canvas = mock<HTMLCanvasElement>();
    canvas.getContext.mockReturnValue(context);
    canvas.getClientRects.mockReturnValue(rectList);

    const renderer = mock<THREE.WebGLRenderer>();
    renderer.domElement = canvas;
    renderer.getSize.mockReturnValue(new three.Vector2(100, 100));
    vi.mocked(three.WebGLRenderer).mockReturnValue(mock<THREE.WebGLRenderer>());

    // Initialise the stage
    initialSet = F.pipe(
      canvas,
      createRenderer,
      createDefaultTechnicalSet,
      startAnimationLoop(renderScene),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('add an animator to the technical stage and check it is called in the animation loop', async () => {
    const animator = vi.fn();
    const set = expectRightTechnicalSet(addAnimator(animator)(initialSet));
    set.clock.getDelta = vi.fn(() => 0.1);

    expect(animator).toHaveBeenCalledTimes(1);
  });
});
