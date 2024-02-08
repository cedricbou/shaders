import { describe, expect, test, vi } from 'vitest';
import {
  TechnicalSet,
  addDefaultGrid,
  addDefaultLight,
  addOrbitControl,
} from './StageSet';

import * as E from 'fp-ts/lib/Either';

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
});
