/**
 * Import THREE, the 3D library we are going to use.
 */
import * as THREE from 'three';

import * as CONTROLS from './primitives/controls';

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
 * An animator function update a state according to time and user input.
 */
export type Animator = (time: number) => void;

/**
 * A TechnicalSet is a collection of technical assets used to render a 3D scene.
 * For exemple it includes, cameras, lights, and other technical assets.
 */
export type TechnicalSet = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;
  animators: Array<Animator>;
  clock: THREE.Clock;
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
 * Render the scene in the technical set.
 * TODO: This function is probably useless, we should remove it.
 */
export function renderScene(): (
  technicalSet: E.Either<string, TechnicalSet>,
) => E.Either<string, TechnicalSet> {
  return F.flow(
    E.map((set) => {
      console.log('rendering');
      set.renderer.render(set.scene, set.camera);
      return set;
    }),
  );
}

/**
 * Start an animation loop to render the scene in the technical set.
 */
export function startAnimationLoop(
  animate: () => void,
): (
  technicalSet: E.Either<string, TechnicalSet>,
) => E.Either<string, TechnicalSet> {
  return F.flow(
    E.map((set) => {
      const animateLoop = () => {
        animate();

        // TODO refactor this to use smaller functions

        // Loop over all animators
        const delta = set.clock.getDelta();
        set.animators.forEach((animator) => {
          animator(delta);
        });

        // Render the scene
        set.renderer.render(set.scene, set.camera);

        // Loop for the next frame
        requestAnimationFrame(animateLoop);
      };

      // Start the stage clock
      set.clock.start();

      // Start the animation loop
      requestAnimationFrame(animateLoop);
      return set;
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
export const createDefaultTechnicalSet: CreateTechnicalSet = (renderer) => {
  return F.pipe(
    renderer,
    E.map((renderer) => {
      const camera = new THREE.PerspectiveCamera(
        75,
        renderer.domElement.width / renderer.domElement.height,
        0.1,
        1000,
      );
      const scene = new THREE.Scene();

      // TODO: it is possible to return a TechnicalSet without a clock, and starting the clock crash. See how to solve this.
      const set: TechnicalSet = {
        renderer,
        camera,
        scene,
        animators: [],
        clock: new THREE.Clock(),
      };
      return set;
    }),
  );
};

/**
 * Update camera position in a technical set.
 */
export function updateCameraPosition(
  position: THREE.Vector3,
): (
  technicalSet: E.Either<string, TechnicalSet>,
) => E.Either<string, TechnicalSet> {
  return F.flow(
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
      CONTROLS.createOrbitControl(set.camera, set.renderer.domElement);
      return set;
    }),
  );
}

/**
 * Add a grid to the technical set.
 */
export function addDefaultGrid(
  technicalSet: E.Either<string, TechnicalSet>,
): E.Either<string, TechnicalSet> {
  return F.pipe(
    technicalSet,
    E.map((set) => {
      const grid = CONTROLS.createStageGrid(30);
      set.scene.add(grid);
      return set;
    }),
  );
}

/**
 * Add an animator to the technical set.
 */
export function addAnimator(
  animate: (time: number) => void,
): (
  technicalSet: E.Either<string, TechnicalSet>,
) => E.Either<string, TechnicalSet> {
  return F.flow(
    E.map((set) => {
      set.animators.push(animate);
      return set;
    }),
  );
}
