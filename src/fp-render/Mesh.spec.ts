import { describe, expect, test, vi } from 'vitest';
// import { mock } from 'vitest-mock-extended';

import * as MESH from './Mesh';

import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

import * as THREE from 'three';

describe('Geometries and materials creation and modifiers', () => {
  beforeEach(async () => {});

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('should be able to create a cube geometry with default parameters and scale it 5 times', () => {
    const sizeGeom = 2;
    const sizeScale = 5;
    F.pipe(
      sizeGeom,
      MESH.createCube,
      MESH.scale(sizeScale),
      O.map((mesh: THREE.Mesh) => {
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect((mesh.geometry as THREE.BoxGeometry).parameters.width).toBe(
          sizeGeom,
        );
        expect((mesh.geometry as THREE.BoxGeometry).parameters.depth).toBe(
          sizeGeom,
        );
        expect((mesh.geometry as THREE.BoxGeometry).parameters.height).toBe(
          sizeGeom,
        );
        expect(mesh.scale.x).toBe(sizeScale);
        expect(mesh.scale.y).toBe(sizeScale);
        expect(mesh.scale.z).toBe(sizeScale);

        expect(mesh.material).toBeDefined();
        expect(mesh.material).toBeInstanceOf(THREE.MeshPhongMaterial);
      }),
      O.getOrElse(() => {
        expect(true).toBe(false);
      }),
    );
  });
});
