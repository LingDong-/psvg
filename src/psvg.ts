import { parsePSVG } from './parser';
import { PSVGFunc, transpilePSVG } from './transpiler';

export { parsePSVG, PSVGFunc, transpilePSVG };

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

if (typeof window !== 'undefined') {
  window.addEventListener('load', function () {
    const psvgs = document.getElementsByTagName('PSVG');
    for (let i = 0; i < psvgs.length; i++) {
      psvgs[i].outerHTML = compilePSVG(psvgs[i].outerHTML);
    }
  });
}
