<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';

/**
 * Import THREE, the 3D library we are going to use.
 */
import * as THREE from 'three';

/**
 * Import fp-ts, a functional programming library for TypeScript.
 * We are going to use it to handle errors and to chain.
 */
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';

import * as STAGE from '../fp-render/stage-set';
import * as MESH from '../fp-render/actors';
import * as CONTROLS from '../fp-render/primitives';

/**
 * Import our shader code from assets, as string.
 */
import fragmentShader from '../assets/shaders/starrycube.frag.glsl?raw';
import vertexShader from '../assets/shaders/starrycube.vert.glsl?raw';

const props = defineProps<{
  forceError?: string;
}>();

const shaderScreen: Ref<HTMLCanvasElement | undefined> = ref();
const errorMsg: Ref<string | undefined> = ref();

onMounted(() => {
  const forceError = props.forceError;
  if (forceError) {
    errorMsg.value = forceError;
    return;
  }

  F.pipe(
    // Init the rendering pipleline and set.
    STAGE.createRenderer(shaderScreen.value),
    STAGE.createTechnicalSet(),
    // Fill in the set and start loop.
    E.map((set) => {
      set.withDefaultLighting();
      set.scene.add(CONTROLS.createStageGrid(10));

      CONTROLS.createOrbitControl(set.camera, set.renderer.domElement);

      const cube = new MESH.Actor(
        new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)),
      );

      cube.withShader(vertexShader, fragmentShader, set.uniforms);

      cube.mesh.position.z = 0;

      set.withActor(cube).startAnimationLoop();

      return set;
    }),
    // Manage Error message
    E.orElse((e: STAGE.StageSetError) => {
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
      claSTAGE="loading-error"
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
../fp-render/ThreeFunctionalSet../fp-render/StageSet
../fp-render/primitives/primitives ../fp-render/actors
