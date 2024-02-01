<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue'
import * as THREE from 'three'
import { rendererInit } from './render/ThreeRenderer';
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';


const props = defineProps({
    forceError: String
})

const shaderScreen: Ref<HTMLCanvasElement | undefined> = ref();
const errorMsg: Ref<string | undefined> = ref();

const createCamera = function (renderer: THREE.WebGLRenderer): THREE.Camera {
    const size = renderer.getSize(new THREE.Vector2());
    const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.z = 5;
    return camera;
}

const createCube = function (): THREE.Mesh {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material);
    return cube;
}

const createLight = function (): THREE.Light {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 5);
    return light;
}

const createQuaternion = function (): THREE.Quaternion {
    const randomAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(randomAxis, 0.01);
    return quaternion;
}

const createScene = function ({ camera, light, cube }: { camera: THREE.Camera, light: THREE.Light, cube: THREE.Mesh }): THREE.Scene {
    return new THREE.Scene()
        .add(camera)
        .add(light)
        .add(cube);
}

const animate = function ({ cube, quaternion, renderer, scene, camera }: { cube: THREE.Mesh, quaternion: THREE.Quaternion, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera }) {
    cube.quaternion.multiplyQuaternions(quaternion, cube.quaternion);
    renderer.render(scene, camera);
}

onMounted(() => {
    const forceError = props.forceError;
    if (forceError) {
        errorMsg.value = forceError;
        return;
    }

    F.pipe(
        shaderScreen.value,
        rendererInit,
        E.bindTo('renderer'),
        E.bind('camera', ({ renderer }) => E.of(createCamera(renderer))),
        E.bind('light', () => E.of(createLight())),
        E.bind('cube', () => E.of(createCube())),
        E.bind('scene', ({ camera, light, cube }) => E.of(createScene({ camera, light, cube }))),
        E.bind('quaternion', () => E.of(createQuaternion())),
        E.bind('animate', ({ cube, quaternion, renderer, scene, camera }) => E.of(() => animate({ cube, quaternion, renderer, scene, camera }))),
        E.bind('loop', ({ renderer, animate }) => E.of(() => {
            renderer.setAnimationLoop(animate);
        })),
        E.map(({ loop }) => loop()),
        E.orElse((e) => { errorMsg.value = e; return E.left(e); }),
    );
});


</script>

<template>
    <div id="shader-screen-lame">
        <div id="shader-screen-loading-error" class="loading-error" v-show="errorMsg !== undefined">{{ errorMsg }}</div>
        <canvas ref="shaderScreen" id="shader-screen" width="800" height="600"></canvas>
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
        text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073;
    }

    to {
        text-shadow: 0 0 20px #fff, 0 0 30px #ff4da6, 0 0 40px #ff4da6, 0 0 50px #ff4da6, 0 0 60px #ff4da6, 0 0 70px #ff4da6, 0 0 80px #ff4da6;
    }
}
</style>