import * as THREE from 'three';
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';


export type RendererError = string;

export function rendererInit(canvas: HTMLCanvasElement | undefined): E.Either<RendererError, THREE.WebGLRenderer> {
    return F.pipe(
        E.Do,
        E.apS('canvas', E.fromNullable('canvas is not defined')(canvas)),
        E.bind('width', ({ canvas }) => E.right(canvas.width)),
        E.bind('height', ({ canvas }) => E.right(canvas.height)),
        E.bind('context', ({ canvas }) => E.fromNullable('Failed to get webgl2 context from canvas')(canvas.getContext('webgl2'))),
        E.map(({ width, height, context }) => {
            const renderer = new THREE.WebGLRenderer({ canvas, context });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio); // TODO: Is this needed?
            return renderer;
        })
    );
}
