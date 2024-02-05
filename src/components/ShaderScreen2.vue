<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';

/**
 * Import THREE, the 3D library we are going to use.
 */
// import * as THREE from 'three';

/**
 * Import fp-ts, a functional programming library for TypeScript.
 * We are going to use it to handle errors and to chain.
 */
// import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';

import * as TF from '../three/ThreeFunctionalSet';

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

  const set = F.pipe(
    TF.createRenderer(shaderScreen.value),
    TF.defaultTechnicalSet,
    // TF.updateCameraPosition(new Vector3(3, 5, 10)),
  );

  return set;
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
