import { expect, test } from 'vitest';
import * as CONTROLS from './controls';
import * as THREE from 'three';

test('create a 10 unit wide stage grid produce a default grid with 10 division, teal quadrant and green axis', () => {
  const grid = CONTROLS.createStageGrid(10);
  expect(grid).toBeDefined();
  expect(grid).toBeInstanceOf(THREE.GridHelper);

  // Geometry should reprensent a 10x10 grid, meaning 11x2 lines, each line has 2 vertices.
  expect(grid.geometry.getAttribute('position').array.length).toEqual(132);

  // TODO : Fix the below test to check colors.
  // Colors seems to be stored in the BufferGeometry object as color array.
  // expect(grid.material.color).toEqual(THREE.Color.NAMES.yellowgreen);
  //  expect(grid.material.linecolor).toEqual(THREE.Color.NAMES.teal);
});
