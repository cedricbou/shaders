import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

import * as THREE from 'three';

const randomPredefinedMaterial = function (): THREE.Material {
  return PREDIFINED_MATERIALS[
    Math.floor(Math.random() * PREDIFINED_MATERIALS.length)
  ];
};

export class Actor {
  public readonly mesh: THREE.Mesh;

  public readonly animators: Array<(time: number) => void>;

  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.animators = [];
  }

  public withRandomMaterial(): Actor {
    this.mesh.material = randomPredefinedMaterial();
    return this;
  }

  public withAnimator(
    animator: (mesh: THREE.Mesh) => (time: number) => void,
  ): Actor {
    this.animators.push(animator(this.mesh));
    return this;
  }

  public withShader(
    vertexShader: string,
    fragmentShader: string,
    uniforms: Record<string, THREE.IUniform>,
  ): Actor {
    const shaderMaterial = new THREE.RawShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      glslVersion: THREE.GLSL3,
    });

    this.mesh.material = shaderMaterial;
    return this;
  }
}

export const PHONG_DEFAULT_PARAMS: THREE.MeshPhongMaterialParameters = {
  emissive: 0x0,
  specular: 0x111111,
  shininess: 30,
  flatShading: false,
  fog: true,
};

export const PHONG_RED_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xff0000,
});

export const PHONG_YELLOW_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xffff00,
});

export const PHONG_GREEN_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0x00ff00,
});

export const PHONG_BLUE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0x0000ff,
});

export const PHONG_PURPLE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xff00ff,
});

export const PHONG_ORANGE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xffa500,
});

export const PREDIFINED_MATERIALS = [
  PHONG_RED_MATERIAL,
  PHONG_YELLOW_MATERIAL,
  PHONG_GREEN_MATERIAL,
  PHONG_BLUE_MATERIAL,
  PHONG_PURPLE_MATERIAL,
  PHONG_ORANGE_MATERIAL,
];

/**
 * Create a default Cube mesh with a random predefined material.
 * @param size the initial size of the cube.
 * @returns a task that resolves to a cube mesh.
 */
export const createCube = function (size = 1): O.Option<Actor> {
  return O.of(
    new Actor(
      new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        randomPredefinedMaterial(),
      ),
    ),
  );
};

/**
 * Scale a mesh to a given size, it modifies in-place the mesh scale property.
 * @param size the size to scale the mesh.
 * @returns a task that resolves to the scaled mesh.
 */
export const scale = function (
  size: number,
): (_: O.Option<Actor>) => O.Option<Actor> {
  return F.flow(
    O.map((actor: Actor) => {
      actor.mesh.scale.set(size, size, size);
      return actor;
    }),
  );
};

/**
 * Add an animator to animate this mesh.
 */
export const animate = function (
  animator: (actor: Actor) => (time: number) => void,
): (_: O.Option<Actor>) => O.Option<Actor> {
  return F.flow(
    O.map((actor: Actor) => {
      actor.animators.push(animator(actor));
      return actor;
    }),
  );
};
