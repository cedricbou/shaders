/**
 * Import THREE, the 3D library we are going to use.
 */
import * as THREE from 'three';

import { createOrbitControl } from './ThreeHelpers';

/**
 * Import fp-ts, a functional programming library for TypeScript.
 * We are going to use it to handle errors and to chain.
 */
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';

/**
 * A Scenery is a collection of static assets used to build a 3D scene.
 */
// export type Scenery = {};

/**
 * A TechnicalSet is a collection of technical assets used to render a 3D scene.
 * For exemple it includes, cameras, lights, and other technical assets.
 */
export type TechnicalSet = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;
};

/**
 * ActorsAndAction is a collection of dynamic assets used to animate a 3D scene.
 * Their characteristics and state depends on time and user input.
 */
// export type ActorsAndAction = {};

/**
 * Transform a Canvas to a WebGLRenderer
 */
export function createRenderer(
  canvas: HTMLCanvasElement | undefined,
): E.Either<string, THREE.WebGLRenderer> {
  return F.pipe(
    E.Do,
    E.apS('canvas', E.fromNullable('canvas is not defined')(canvas)),
    E.bind('context', ({ canvas }) =>
      E.fromNullable('Failed to get webgl2 context from canvas')(
        canvas.getContext('webgl2'),
      ),
    ),
    E.bind('rect', ({ canvas }) => {
      if (canvas.getClientRects().length === 0) {
        return E.left('no client rect found');
      }
      return E.right(canvas.getClientRects()[0]);
    }),
    E.map(({ rect, canvas, context }) => {
      const renderer = new THREE.WebGLRenderer({ canvas, context });
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(window.devicePixelRatio);
      return renderer;
    }),
  );
}

/**
 * A CreateTechnicalSet to initialize all technical assets
 */
export type CreateTechnicalSet = (
  renderer: E.Either<string, THREE.WebGLRenderer>,
) => E.Either<string, TechnicalSet>;

/**
 * Create a default TechnicalSet with a perspective camera and default scene.
 */
export const defaultTechnicalSet: CreateTechnicalSet = (renderer) => {
  return F.pipe(
    renderer,
    E.map((renderer) => {
      const camera = new THREE.PerspectiveCamera();
      const scene = new THREE.Scene();
      return { renderer, camera, scene };
    }),
  );
};

/**
 * Update camera position in a technical set.
 */
export function updateCameraPosition(
  technicalSet: E.Either<string, TechnicalSet>,
  position: THREE.Vector3,
): E.Either<string, TechnicalSet> {
  return F.pipe(
    technicalSet,
    E.map((set) => {
      set.camera.position.copy(position);
      return set;
    }),
  );
}

/**
 * Add a default light to the technical set.
 */
export function addDefaultLight(
  technicalSet: E.Either<string, TechnicalSet>,
): E.Either<string, TechnicalSet> {
  return F.pipe(
    technicalSet,
    E.map((set) => {
      const light = new THREE.AmbientLight(0xffffff);
      set.scene.add(light);
      return set;
    }),
  );
}

/**
 * Add an orbit control to the technical set.
 */
export function addOrbitControl(
  technicalSet: E.Either<string, TechnicalSet>,
): E.Either<string, TechnicalSet> {
  return F.pipe(
    technicalSet,
    E.map((set) => {
      createOrbitControl(set.camera, set.renderer.domElement);
      return set;
    }),
  );
}
