import { describe, expect, test, vi } from 'vitest';

import * as MESH from './actors';

import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

import * as THREE from 'three';

describe('Create and mofify an actor', () => {
  let actor: MESH.Actor;
  let mesh: THREE.Mesh;

  beforeEach(() => {
    mesh = new THREE.Mesh();
    actor = new MESH.Actor(mesh);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test('should be able to create an actor', () => {
    expect(actor).toBeDefined();
    expect(actor).toBeInstanceOf(MESH.Actor);

    expect(actor.mesh).toBeDefined();
    expect(actor.mesh).toBeInstanceOf(THREE.Mesh);
    expect(actor.mesh).toBe(mesh);

    expect(actor.animators).toBeDefined();
    expect(actor.animators).toHaveLength(0);
  });

  test('should be able to set up a random material to an actor', () => {
    const chainedActor = actor.withRandomMaterial();

    expect(chainedActor).toBeDefined();
    expect(chainedActor).toBe(actor);

    expect(actor.mesh.material).toBeDefined();
    expect(MESH.PREDIFINED_MATERIALS).toContain(actor.mesh.material);
  });

  test('should be able to set up a shader to an actor', () => {
    const vertexShader = 'vertexShader';
    const fragmentShader = 'fragmentShader';

    const chainedActor = actor.withShader(vertexShader, fragmentShader, {
      iTime: { value: 10 },
    });

    expect(chainedActor).toBeDefined();
    expect(chainedActor).toBe(actor);

    expect(actor.mesh.material).toBeDefined();
    expect(actor.mesh.material).toBeInstanceOf(THREE.RawShaderMaterial);
    expect((actor.mesh.material as THREE.RawShaderMaterial).vertexShader).toBe(
      vertexShader,
    );
    expect(
      (actor.mesh.material as THREE.RawShaderMaterial).fragmentShader,
    ).toBe(fragmentShader);

    expect(
      (actor.mesh.material as THREE.RawShaderMaterial).uniforms.iTime.value,
    ).toBe(10);
  });
});

describe('Geometries and materials creation and modifiers', () => {
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
