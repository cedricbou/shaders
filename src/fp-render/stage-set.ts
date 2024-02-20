import * as THREE from 'three';

import * as MESH from './actors';
import * as CONTROLS from './primitives';

import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

export type StageSetError = string;

type DefaultLighting = {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
};

/**
 * A TechnicalSet is a collection of technical assets used to render a 3D scene.
 * For exemple it includes, cameras, lights, and other technical assets.
 */
export class TechnicalSet {
  /**
   * The renderer used to render the set.
   */
  public readonly renderer: THREE.WebGLRenderer;

  /**
   * The scene used to render the set.
   */
  public readonly scene: THREE.Scene;

  /**
   * The master clock used to calculate the time elapsed since the last frame.
   */
  public readonly clock: THREE.Clock;

  /**
   * The uniforms used to update the shaders in the set.
   */
  public readonly uniforms: Record<string, THREE.IUniform>;

  /**
   * The size of the canvas in the set.
   * It is calculated from the renderer size.
   */
  public readonly screenSize: THREE.Vector2 = new THREE.Vector2();

  /**
   * The scale of the scene. It is used to position or size default assets.
   * You can set it to adapt default assets to the scale of your own set.
   *
   * By default, it assume the set is a box of size 10, centered on zero.
   *
   * As an example, the default camera will make sure to have a correct overview of the set.
   * Default light would be positionned accordingly to this scale.
   *
   *
   */
  public readonly scale: number;

  /**
   * The camera used to render the scene.
   *
   * By default the camera is a perspective camera with a field of view of 50° a near plane of 0.1 and a far plane of 100.
   * It is positionned at (2, 3, 5) and look at the origin (0, 0, 0).
   * It is scaled by the scale of the set.
   *
   * You can set a custom camera by using the withCamera method or by setting the camera property directly.
   * You can also use the withDefaultCamera method to reset the camera to its default value.
   */
  public camera: THREE.Camera;

  private _lighting: O.Option<DefaultLighting> = O.none;

  /**
   * The default lighting used to render the scene.
   *
   */
  public get lighting() {
    return this._lighting;
  }

  private set lighting(lighting: O.Option<DefaultLighting>) {
    this._lighting = lighting;
  }

  /**
   * The list of actors in the scene.
   */
  public readonly actors: Array<MESH.Actor> = [];

  /** A specific animator to update the uniforms.iTime value in the animation loop */
  private readonly shaderToyzUniformAnimator: CONTROLS.Animator;

  constructor(renderer: THREE.WebGLRenderer, scale: number = 1) {
    this.renderer = renderer;
    this.uniforms = CONTROLS.initShaderToyzUniforms();
    this.shaderToyzUniformAnimator = CONTROLS.shaderToyzAnimator(this.uniforms);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.scale = scale;

    // Set the size of the canvas in the set
    this.renderer.getSize(this.screenSize);

    this.camera = this.createDefaultCamera();
    this.positionDefaultCamera();
  }

  /**
   * Change the camera used to render the scene.
   * @param camera The camera to use to render the scene.
   * @returns this object to chain calls.
   */
  public withCamera(camera: THREE.Camera): TechnicalSet {
    this.camera = camera;
    return this;
  }

  /**
   * Change the camera used to render the scene to the default camera.
   * Default camera is a Perspective Camera set to have a field of view of 50°
   * It is positionned in front of the set, slightly above and to the right.
   * @returns this object to chain calls.
   */
  public withDefaultCamera(): TechnicalSet {
    this.camera = this.createDefaultCamera();
    this.positionDefaultCamera();
    return this;
  }

  /**
   * Helper methods to create the default camera @see camera
   * @see withDefaultCamera
   * @returns The default camera used to render the scene.
   */
  private createDefaultCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      this.screenSize.width / this.screenSize.height,
      0.1,
      100 * this.scale,
    );
    return camera;
  }

  /**
   * Helper method to position the default camera @see camera
   * The position is scaled according to the scale factor of the set.
   * @see withDefaultCamera
   */
  private positionDefaultCamera(): void {
    const position = new THREE.Vector3(2, 3, 5).multiplyScalar(this.scale);
    this.camera.position.copy(position);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Animate the scene according to the time elapsed since the last frame.
   * @param delta the time elapsed since the last frame.
   */
  public animate(delta: number): void {
    this.shaderToyzUniformAnimator(delta);
  }

  /**
   * Update an animation frame and render the set.
   */
  public animateAndRender(): void {
    this.animate(this.clock.getDelta());
    this.actors.forEach((actor) => {
      actor.animators.forEach((animator) => animator(this.clock.getDelta()));
    });
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Set up and start the animation loop
   */
  public startAnimationLoop(): void {
    const animateLoop = () => {
      this.animateAndRender();
      window.requestAnimationFrame(animateLoop);
    };

    this.clock.start();
    window.requestAnimationFrame(animateLoop);
  }

  /**
   * Add actor mesh to the scene and register its animators for the frame animation.
   * Note : changing the animators after adding it to the scene will update them, but
   * changing the mesh will not update the scene. You'll need to update the Material or
   * Geometry of the mesh to update the scene.
   *
   * This will evolute in the future to allow a more dynamic scene update. In the meantime,
   * the best practice is to avoid update the mesh or the animators list after adding it to the scene.
   *
   * @param actor The actor to add to the scene.
   * @returns this object to chain calls.
   */
  public withActor(actor: MESH.Actor): TechnicalSet {
    // TODO: An event bases system to manage change on actor and update the scene accordingly?
    this.scene.add(actor.mesh);
    this.actors.push(actor);
    return this;
  }

  /**
   * Add a default lighting to the scene.
   * @returns this object to chain calls.
   */
  public withDefaultLighting(): TechnicalSet {
    const ambient = new THREE.AmbientLight(THREE.Color.NAMES.lightyellow, 0.5);

    const directional = new THREE.DirectionalLight(
      THREE.Color.NAMES.floralwhite,
      0.5,
    );
    directional.position.set(-1, 3, 2);

    this.scene.add(ambient);
    this.scene.add(directional);

    this.lighting = O.some({ ambient, directional });

    return this;
  }
}

/** Allow creation of a webgl renderer from a canvas */
export function createRenderer(
  canvas: HTMLCanvasElement | undefined,
): E.Either<StageSetError, THREE.WebGLRenderer> {
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

/** Allow creation of a Technical Set in a fp-ts pipe, from a Renderer Either */
export function createTechnicalSet(
  scale: number = 1,
): (
  renderer: E.Either<StageSetError, THREE.WebGLRenderer>,
) => E.Either<StageSetError, TechnicalSet> {
  return F.flow(E.map((renderer) => new TechnicalSet(renderer, scale)));
}
