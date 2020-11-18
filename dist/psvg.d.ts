interface PSVGElement {
    tagName: string;
    children: PSVGElement[];
    attributes: Record<string, string>;
    innerHTML: string;
}
interface PSVGFunc {
    name: string;
    args: string[];
}
declare function parsePSVG(str: string): PSVGElement[];
declare function transpilePSVG(prgm: PSVGElement[]): string;
declare function evalPSVG(js: string): any;
declare function compilePSVG(psvg: string): any;

export { PSVGElement, PSVGFunc, compilePSVG, evalPSVG, parsePSVG, transpilePSVG };
