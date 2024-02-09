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

import * as SS from '../fp-render/StageSet';

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

  // Initialise the stage
  const stage = F.pipe(
    SS.createRenderer(shaderScreen.value),
    SS.createDefaultTechnicalSet,
    SS.updateCameraPosition(new THREE.Vector3(3, 5, 10)),
    SS.addDefaultLight,
    SS.addDefaultGrid,
    SS.addOrbitControl,
    SS.startAnimationLoop,
  );

  // Test animations ?
  // Add the cube to the scene

  // TODO : create helper functions for this and try quaternions rotation
  // TODO : then add shader material animated with uniforms

  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.5,
    metalness: 0.5,
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const rotatingCube: SS.Animator = function (time: number) {
    cube.rotation.x += 0.1 * time;
    cube.rotation.y += 0.1 * time;
  };

  // Test scene
  F.pipe(
    stage,
    SS.addAnimator(rotatingCube),
    E.fold(
      (error) => {
        errorMsg.value = error;
      },
      (stage) => {
        console.log('Stage initialised! {}', stage);

        stage.scene.add(cube);

        // Add the sphere to the scene
        const sphereGeometry = new THREE.SphereGeometry(1.5);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: 0x0000ff,
          roughness: 0.3,
          metalness: 0.8,
        });
        stage.scene.add(
          new THREE.Mesh(sphereGeometry, sphereMaterial).translateOnAxis(
            new THREE.Vector3(1, 1, -1),
            2,
          ),
        );
      },
    ),
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
../fp-render/ThreeFunctionalSet../fp-render/StageSet
