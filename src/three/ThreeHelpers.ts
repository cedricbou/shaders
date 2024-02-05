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
