import { evalPSVG, compilePSVG } from './compiler';

export { parsePSVG } from './parser';
export { PSVGFunc, transpilePSVG } from './transpiler';
export { evalPSVG, compilePSVG };

if (typeof window !== 'undefined') {
  window.addEventListener('load', function () {
    const psvgs = document.getElementsByTagName('PSVG');
    for (let i = 0; i < psvgs.length; i++) {
      psvgs[i].outerHTML = compilePSVG(psvgs[i].outerHTML);
    }
  });
}
