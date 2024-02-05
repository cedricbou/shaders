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
import { createPrinter } from 'typescript';


/**
 * A Scenery is a collection of static assets used to build a 3D scene.
 */
export type Scenery = {

};

/**
 * A TechnicalSet is a collection of technical assets used to render a 3D scene.
 * For exemple it includes, cameras, lights, and other technical assets.
 */
export type TechnicalSet = {
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
};

/**
 * ActorsAndAction is a collection of dynamic assets used to animate a 3D scene.
 * Their characteristics and state depends on time and user input.
 */
export type ActorsAndAction = {

};

/**
 * A CreateTechnicalSet to initialize all technical assets
 */
export type CreateTechnicalSet = (canvas: HTMLCanvasElement | undefined) => E.Either<string, TechnicalSet>;

export type TechnicalSetWithCamera = (set: TechnicalSet) => (camera: THREE.PerspectiveCamera) => TechnicalSet;

export const withPerspectiveCamera: TechnicalSetWithCamera = (set) => (camera) => {
    return { ...set, camera: camera };
}

export const defaultTechnicalSet: CreateTechnicalSet = (canvas) => {
    return F.pipe(
        E.Do,
        E.apS('canvas', E.fromNullable('canvas is not defined')(canvas)),
        E.bind('context', ({ canvas }) =>
            E.fromNullable('Failed to get webgl2 context from canvas')(
                canvas.getContext('webgl2'),
            ),
        ),
        E.map(({ canvas, context }) => {
            const renderer = new THREE.WebGLRenderer({ canvas, context });
            const width = canvas.getClientRects()[0].width;
            const height = canvas.getClientRects()[0].height;
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio); // TODO: Is this needed?
            return { renderer: renderer } as TechnicalSet;
        }),
    );
}


const c = F.pipe(
    document.getElementById('canvas') as HTMLCanvasElement,
    defaultTechnicalSet,
    E.map((set) => { return withPerspectiveCamera(set)(new THREE.PerspectiveCamera()); }),
);

console.log(typeof c);


/**{
    return F.pipe(
        E.Do,
        E.apS('canvas', E.fromNullable('canvas is not defined')(canvas)),
        E.bind('width', ({ canvas }) => E.right(canvas.width)),
        E.bind('height', ({ canvas }) => E.right(canvas.height)),
        E.bind('context', ({ canvas }) =>
            E.fromNullable('Failed to get webgl2 context from canvas')(
                canvas.getContext('webgl2'),
            ),
        ),
        E.map(({ width, height, context }) => {
            const renderer = new THREE.WebGLRenderer({ canvas, context });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio); // TODO: Is this needed?
            return renderer;
        }),
    );
}; */