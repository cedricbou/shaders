<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import * as THREE from 'three';
import { rendererInit } from './render/ThreeRenderer';
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';

import fragmentShader from '../assets/shaders/starrycube.frag.glsl?raw';
import vertexShader from '../assets/shaders/starrycube.vert.glsl?raw';

const sceneParams = {
  cubeRotationStep: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3().random(),
    0.01,
  ),
  cubeTranslationStep: 0.015,
  cubeTranslationRange: 4,
};

type SceneParams = typeof sceneParams;

type SceneState = {
  cubeRotationCurrent: THREE.Quaternion;
  cubeTranslationCurrent: number;
};

const props = defineProps<{
  forceError?: string;
}>();

const shaderScreen: Ref<HTMLCanvasElement | undefined> = ref();
const errorMsg: Ref<string | undefined> = ref();

const createCamera = function (renderer: THREE.WebGLRenderer): THREE.Camera {
  const size = renderer.getSize(new THREE.Vector2());
  const camera = new THREE.PerspectiveCamera(
    55,
    size.width / size.height,
    0.1,
    1000,
  );
  camera.position.z = 8;
  return camera;
};

const createCube = function (): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
  // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const shaderMaterial = new THREE.RawShaderMaterial({
    uniforms: {},
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
  light,
  cube,
}: {
  camera: THREE.Camera;
  light: THREE.Light;
  cube: THREE.Mesh;
}): THREE.Scene {
  return new THREE.Scene().add(camera).add(light).add(cube);
};

const initState = function (cube: THREE.Mesh): SceneState {
  return {
    cubeRotationCurrent: cube.quaternion,
    cubeTranslationCurrent: 0,
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
}: {
  state: SceneState;
  params: SceneParams;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  cube: THREE.Mesh;
}) {
  updateState(state, params);

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

    // Init the camera
    E.bind('camera', ({ renderer }) => E.of(createCamera(renderer))),

    // Init a default light
    E.bind('light', () => E.of(createLight())),

    // Create a default cube
    E.bind('cube', () => E.of(createCube())),

    // Build the scene from the camera, light and cube.
    E.bind('scene', ({ camera, light, cube }) =>
      E.of(createScene({ camera, light, cube })),
    ),

    // Init the animation state for this scene.
    E.bind('state', ({ cube }) => E.of(initState(cube))),

    // Define the animation function.
    E.bind('animate', ({ state, params, renderer, scene, camera, cube }) =>
      E.of(() => animate({ state, params, renderer, scene, camera, cube })),
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
