import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import * as CONTROLS from './Controls';
import { OrbitControls } from 'three/addons';

vi.mock('three');

describe('createStageGrid', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('create a 10 unit wide stage grid produce a default grid with 10 division, teal quadrant and green axis', async () => {
    const three = await import('three');
    const color = ((await vi.importActual('three')) as typeof import('three'))
      .Color;

    const grid = CONTROLS.createStageGrid(10);

    expect(three.GridHelper).toHaveBeenCalledWith(
      10,
      10,
      color.NAMES.yellowgreen,
      color.NAMES.teal,
    );

    expect(grid).toBeDefined();
    expect(grid).toBeInstanceOf(three.GridHelper);
  });
});

describe('createOrbitControl', () => {
  test('createOrbitControl should return a new instance of OrbitControls with damping enabled', async () => {
    const three = (await vi.importActual('three')) as typeof import('three');

    const camera = new three.PerspectiveCamera();

    const domElement = mock<HTMLElement>();
    globalThis.document = mock<Document>();

    const orbitControl = CONTROLS.createOrbitControl(camera, domElement);

    expect(orbitControl).toBeDefined();
    expect(orbitControl).toBeInstanceOf(OrbitControls);
    expect(orbitControl.enableDamping).toBe(true);
    expect(orbitControl.dampingFactor).toBe(0.25);
    expect(orbitControl.enableZoom).toBe(true);
  });
});
