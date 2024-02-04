<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';

/**
 * Import THREE, the 3D library we are going to use.
 */
import * as THREE from 'three';
import * as ADDONS from 'three/addons';

/**
 * Import fp-ts, a functional programming library for TypeScript.
 * We are going to use it to handle errors and to chain.
 */
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';

/**
 * TODO : challenge the usefulness of this lib.
 */
import { rendererInit } from './render/ThreeRenderer';

/**
 * Import our shader code from assets, as string.
 */
import fragmentShader from '../assets/shaders/starrycube.frag.glsl?raw';
import vertexShader from '../assets/shaders/starrycube.vert.glsl?raw';

const sceneParams = {
  cubeRotationStep: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3().random(),
    0.0,
  ),
  cubeTranslationStep: 0.0,
  cubeTranslationRange: 4,
};

type SceneParams = typeof sceneParams;

type SceneState = {
  cubeRotationCurrent: THREE.Quaternion;
  cubeTranslationCurrent: number;
  time: number;
};

const props = defineProps<{
  forceError?: string;
}>();

const shaderScreen: Ref<HTMLCanvasElement | undefined> = ref();
const errorMsg: Ref<string | undefined> = ref();

const createOrbitControl = function (
  camera: THREE.Camera,
): ADDONS.OrbitControls {
  const orbitControl = new ADDONS.OrbitControls(camera, shaderScreen.value);
  orbitControl.enableDamping = true;
  orbitControl.dampingFactor = 0.25;
  orbitControl.enableZoom = true;
  return orbitControl;
};

const createStageGrid = function (): THREE.GridHelper {
  const grid = new THREE.GridHelper(
    30,
    30,
    THREE.Color.NAMES.yellowgreen,
    THREE.Color.NAMES.teal,
  );
  return grid;
};

const createCamera = function (renderer: THREE.WebGLRenderer): THREE.Camera {
  const size = renderer.getSize(new THREE.Vector2());
  const camera = new THREE.PerspectiveCamera(
    55,
    size.width / size.height,
    0.1,
    1000,
  );
  camera.position.z = 10;
  camera.position.y = 5;
  camera.position.x = 3;
  camera.lookAt(0, 0, 0);
  return camera;
};

const createUniforms = function (): { [key: string]: THREE.IUniform } {
  return {
    iTime: { value: 0.0 },
  };
};

const createCube = function (uniforms: {
  [key: string]: THREE.IUniform;
}): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
  // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const shaderMaterial = new THREE.RawShaderMaterial({
    uniforms: uniforms,
    vertexShader,
    fragmentShader,
    glslVersion: THREE.GLSL3,
  });
  const cube = new THREE.Mesh(geometry, shaderMaterial);
  return cube;
};

const createLight = function (): THREE.Light {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 0, 5);
  return light;
};

const createScene = function ({
  camera,
  grid,
  light,
  cube,
}: {
  camera: THREE.Camera;
  grid: THREE.GridHelper;
  light: THREE.Light;
  cube: THREE.Mesh;
}): THREE.Scene {
  return new THREE.Scene().add(camera).add(grid).add(light).add(cube);
};

const initState = function (cube: THREE.Mesh): SceneState {
  return {
    cubeRotationCurrent: cube.quaternion,
    cubeTranslationCurrent: 0,
    time: performance.now(),
  };
};

const updateState = function (state: SceneState, params: SceneParams): void {
  // Translate the cube along the x axis using a sine function to have a smooth back and forth movement
  state.cubeTranslationCurrent += params.cubeTranslationStep;

  // Update cube rotation
  state.cubeRotationCurrent.multiplyQuaternions(
    state.cubeRotationCurrent,
    params.cubeRotationStep,
  );
};

const animate = function ({
  state,
  params,
  renderer,
  scene,
  camera,
  cube,
  uniforms,
}: {
  state: SceneState;
  params: SceneParams;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  cube: THREE.Mesh;
  uniforms: { [key: string]: THREE.IUniform };
}) {
  updateState(state, params);

  uniforms.iTime.value = (performance.now() - state.time) / 1000.0;

  // Update the cube position
  cube.position.x =
    Math.sin(state.cubeTranslationCurrent) * params.cubeTranslationRange;

  renderer.render(scene, camera);
};

onMounted(() => {
  const forceError = props.forceError;
  if (forceError) {
    errorMsg.value = forceError;
    return;
  }

  F.pipe(
    // Retrieve the canvas element
    shaderScreen.value,

    // Transform it to a WebGLRenderer
    rendererInit,
    E.bindTo('renderer'),

    // Init the scene params
    E.apS('params', E.of(sceneParams)),

    // Init the camera and controls
    E.bind('camera', ({ renderer }) => E.of(createCamera(renderer))),
    E.bind('controls', ({ camera }) => E.of(createOrbitControl(camera))),
    E.bind('grid', () => E.of(createStageGrid())),

    // Init a default light
    E.bind('light', () => E.of(createLight())),

    // Create a default cube
    E.bind('uniforms', () => E.of(createUniforms())),
    E.bind('cube', ({ uniforms }) => E.of(createCube(uniforms))),

    // Build the scene from the camera, light and cube.
    E.bind('scene', ({ camera, grid, light, cube }) =>
      E.of(createScene({ camera, grid, light, cube })),
    ),

    // Init the animation state for this scene.
    E.bind('state', ({ cube }) => E.of(initState(cube))),

    // Define the animation function.
    E.bind(
      'animate',
      ({ state, params, renderer, scene, camera, cube, uniforms }) =>
        E.of(() =>
          animate({ state, params, renderer, scene, camera, cube, uniforms }),
        ),
    ),

    // Set the animation loop
    E.bind('loop', ({ renderer, animate }) =>
      E.of(() => {
        renderer.setAnimationLoop(animate);
      }),
    ),

    // Start the loop
    E.map(({ loop }) => loop()),

    // If an error occured, diplay it on the screen instead of the canvas.
    E.orElse((e) => {
      errorMsg.value = e;
      return E.left(e);
    }),
  );
});
</script>

<template>
  <div id="shader-screen-lame">
    <div
      v-show="errorMsg !== undefined"
      id="shader-screen-loading-error"
      class="loading-error"
    >
      {{ errorMsg }}
    </div>
    <canvas
      id="shader-screen"
      ref="shaderScreen"
      width="1024"
      height="600"
    ></canvas>
  </div>
</template>

<style scoped>
.loading-error {
  font-size: 80px;
  color: #fff;
  text-align: center;
  -webkit-animation: glow 1s ease-in-out infinite alternate;
  -moz-animation: glow 1s ease-in-out infinite alternate;
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow:
      0 0 10px #fff,
      0 0 20px #fff,
      0 0 30px #e60073,
      0 0 40px #e60073,
      0 0 50px #e60073,
      0 0 60px #e60073,
      0 0 70px #e60073;
  }

  to {
    text-shadow:
      0 0 20px #fff,
      0 0 30px #ff4da6,
      0 0 40px #ff4da6,
      0 0 50px #ff4da6,
      0 0 60px #ff4da6,
      0 0 70px #ff4da6,
      0 0 80px #ff4da6;
  }
}
</style>
