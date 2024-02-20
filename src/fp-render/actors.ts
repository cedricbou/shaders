import * as F from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

import * as THREE from 'three';

export class Actor {
  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.animators = [];
  }

  mesh: THREE.Mesh;
  animators: Array<(time: number) => void>;
  shader?: (uniforms: Record<string, THREE.IUniform>) => void;
}

const PHONG_DEFAULT_PARAMS: THREE.MeshPhongMaterialParameters = {
  emissive: 0x0,
  specular: 0x111111,
  shininess: 30,
  flatShading: false,
  fog: true,
};

const PHONG_RED_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xff0000,
});
const PHONG_YELLOW_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xffff00,
});
const PHONG_GREEN_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0x00ff00,
});
const PHONG_BLUE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0x0000ff,
});
const PHONG_PURPLE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xff00ff,
});
const PHONG_ORANGE_MATERIAL = new THREE.MeshPhongMaterial({
  ...PHONG_DEFAULT_PARAMS,
  color: 0xffa500,
});

const PREDIFINED_MATERIALS = [
  PHONG_RED_MATERIAL,
  PHONG_YELLOW_MATERIAL,
  PHONG_GREEN_MATERIAL,
  PHONG_BLUE_MATERIAL,
  PHONG_PURPLE_MATERIAL,
  PHONG_ORANGE_MATERIAL,
];

const randomPredefinedMaterial = function (): THREE.Material {
  return PREDIFINED_MATERIALS[
    Math.floor(Math.random() * PREDIFINED_MATERIALS.length)
  ];
};

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
 * Shade a mesh with a shader material.
 * Support only GLSL3 shaders.
 */
export const shade = function (
  vertxShader: string,
  fragShader: string,
): (_: O.Option<Actor>) => O.Option<Actor> {
  return F.flow(
    O.map((actor: Actor) => {
      actor.shader = (uniforms: Record<string, THREE.IUniform>) => {
        const shaderMaterial = new THREE.RawShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertxShader,
          fragmentShader: fragShader,
          glslVersion: THREE.GLSL3,
        });
        console.log(shaderMaterial);
        actor.mesh.material = shaderMaterial;
      };
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
