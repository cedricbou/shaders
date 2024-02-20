import * as THREE from 'three';
import * as ADDONS from 'three/addons';

export const createOrbitControl = function (
  camera: THREE.Camera,
  domElement: HTMLElement,
): ADDONS.OrbitControls {
  const orbitControl = new ADDONS.OrbitControls(camera, domElement);
  orbitControl.enableDamping = true;
  orbitControl.dampingFactor = 0.25;
  orbitControl.enableZoom = true;
  return orbitControl;
};

export const createStageGrid = function (size: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(
    size,
    size,
    THREE.Color.NAMES.yellowgreen,
    THREE.Color.NAMES.teal,
  );
  return grid;
};

/**
 * An animator function update a state according to time and user input.
 */
export type Animator = (delta: number) => void;

/**
 * Returns default uniforms, with preinitialized uniform variable in ShaderToy standard.
 */
export function initShaderToyzUniforms(): Record<string, THREE.IUniform> {
  return {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    iMouse: { value: new THREE.Vector4() },
  };
}

/**
 * An animator function to update shader toys type uniforms according to time.
 */
export function shaderToyzAnimator(
  uniforms: Record<string, THREE.IUniform>,
): Animator {
  return function (delta: number) {
    uniforms.iTime.value = delta;
  };
}
