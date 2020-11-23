import { parsePSVG } from './parser';
import { transpilePSVG } from './transpiler';

export function evalPSVG(js: string): string {
  return Function(`"use strict";${js};return __out;`)();
}

export function compilePSVG(psvg: string): string {
  let prgm = parsePSVG(psvg);
  // console.dir(prgm,{depth:null});
  let js = transpilePSVG(prgm);
  // console.log(js);
  return evalPSVG(js);
}
