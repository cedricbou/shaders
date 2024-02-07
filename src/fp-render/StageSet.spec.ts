import { describe, expect, test, vi, expectTypeOf } from 'vitest';
import { TechnicalSet, addDefaultLight } from './StageSet';
import * as E from 'fp-ts/lib/Either';

vi.mock('three');

/**
 * Helper function to facilitate the import of the actual three module.
 * @returns a promise of the actual three module.
 */
const importActualThree = async function (): Promise<typeof import('three')> {
  return await vi.importActual('three');
};

describe('StageSet modifiers', () => {
  let initialSet: E.Either<string, TechnicalSet>;
  let three: typeof import('three');

  beforeEach(async () => {
    three = await import('three');

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
    three.AmbientLight = (await importActualThree()).AmbientLight;

    const eitherSet = addDefaultLight(initialSet);
    expect(E.isRight(eitherSet)).toBe(true);

    const set: TechnicalSet = E.getOrElseW(() => {
      throw new Error('This should not happen');
    })(eitherSet);

    expect(set.scene.add).toHaveBeenCalledTimes(1);

    // TODO: there should be a way to test with mock type instead of the actual AmbientLight
    expect(set.scene.add).toHaveBeenCalledWith(expect.any(three.AmbientLight));
  });
});
