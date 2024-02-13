import { describe, expect, test, vi } from 'vitest';

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
      O.map((actor) => {
        expect(actor).toBeDefined();
        expect(actor).toBeInstanceOf(MESH.Actor);
        expect(actor.mesh).toBeDefined();
        expect(actor.mesh).toBeInstanceOf(THREE.Mesh);
        expect(actor.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(
          (actor.mesh.geometry as THREE.BoxGeometry).parameters.width,
        ).toBe(sizeGeom);
        expect(
          (actor.mesh.geometry as THREE.BoxGeometry).parameters.depth,
        ).toBe(sizeGeom);
        expect(
          (actor.mesh.geometry as THREE.BoxGeometry).parameters.height,
        ).toBe(sizeGeom);
        expect(actor.mesh.scale.x).toBe(sizeScale);
        expect(actor.mesh.scale.y).toBe(sizeScale);
        expect(actor.mesh.scale.z).toBe(sizeScale);

        expect(actor.mesh.material).toBeDefined();
        expect(actor.mesh.material).toBeInstanceOf(THREE.MeshPhongMaterial);
      }),
      O.getOrElse(() => {
        expect(true).toBe(false);
      }),
    );
  });

  test('should be able to add animation to an actor', () => {
    const sizeGeom = 2;
    const sizeScale = 5;

    const animate = vi.fn();
    const actorAnimate = vi.fn().mockImplementation(() => animate);

    F.pipe(
      sizeGeom,
      MESH.createCube,
      MESH.scale(sizeScale),
      MESH.animate(actorAnimate),
      O.map((actor) => {
        expect(actor).toBeDefined();
        expect(actor).toBeInstanceOf(MESH.Actor);
        expect(actor.mesh).toBeDefined();
        expect(actor.mesh).toBeInstanceOf(THREE.Mesh);
        expect(actor.mesh.geometry).toBeDefined();
        expect(actor.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(actor.mesh.material).toBeDefined();
        expect(actor.mesh.material).toBeInstanceOf(THREE.MeshPhongMaterial);
        expect(actor.animators).toBeDefined();
        expect(actor.animators).toHaveLength(1);
        expect(actor.animators[0]).toBe(animate);
        expect(actorAnimate).toBeCalledTimes(1);
        expect(actorAnimate).toBeCalledWith(actor);
      }),
      O.getOrElse(() => {
        expect(true).toBe(false);
      }),
    );
  });
});
