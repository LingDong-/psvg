[![](examples/textanim.svg)](examples/textanim.psvg)

# PSVG - Programmable SVG

**[Doc](QUICKSTART.md) | [Playground](https://psvg.netlify.app/) | [Examples](examples/) | [NPM](https://www.npmjs.com/package/@lingdong/psvg)**

PSVG is an extension of the SVG (Scalable Vector Graphics) format that introduces programming language features like functions, control flows, and variables -- Instead of writing a program that draws a picture, write a picture that draws itself!

PSVG is compliant with XML and HTML specs, so it can be easily embedded in a webpage or edited with an XML editor.

This repo contains a [PSVG→SVG complier](src/psvg.ts) that transforms PSVG files to just regular SVG's. It can also automatically render all PSVG's on an HTML page when included as a `<script>`.

> Note: Experimental and under development, currently the compiler is not very friendly and might misbehave at times; Contributions/Issues welcome.

For example, define a recursive function that draws the Sierpiński's triangle:

```xml
<psvg width="300" height="260">

  <def-sierptri x1="{WIDTH/2}" y1="0" x2="{WIDTH}" y2="{HEIGHT}" x3="0" y3="{HEIGHT}" d="7">
    <path d="M{x1} {y1} L{x2} {y2} L{x3} {y3} z"/>
    <if false="{d}">
      <return/>
    </if>
    <sierptri x1="{x1}" y1="{y1}" x2="{(x1+x2)/2}" y2="{(y1+y2)/2}" x3="{(x3+x1)/2}" y3="{(y3+y1)/2}" d="{d-1}"/>
    <sierptri x1="{x2}" y1="{y2}" x2="{(x2+x3)/2}" y2="{(y2+y3)/2}" x3="{(x1+x2)/2}" y3="{(y1+y2)/2}" d="{d-1}"/>
    <sierptri x1="{x3}" y1="{y3}" x2="{(x3+x1)/2}" y2="{(y3+y1)/2}" x3="{(x2+x3)/2}" y3="{(y2+y3)/2}" d="{d-1}"/>
  </def-sierptri>

  <fill opacity="0.1"/>
  <sierptri/>

</psvg>
```

Which looks like this (after running it through the PSVG to SVG complier):

![](examples/sierpinski.svg)

Since PSVG is a superset of SVG, all the elements in SVG are also in PSVG, and all of them are programmable. For example, you can use a `for` loop to generate a bunch of gradients whose `stop`s are determined by a function of the index.

```xml
<var n="12"/>

<defs>
  <for i="0" true="{i<n}" step="1">
    <var t="{i/(n-1)}"/>
    <linearGradient id="grad{i}">
      <stop offset="0%"   stop-color="black"/>
      <stop offset="100%" stop-color="rgb(200,{FLOOR(LERP(0,255,t))},0)"/>
    </linearGradient>
  </for>
</defs>
```

Which will generate gradients with `id`s `grad0`, `grad1`, `grad2`, ... To use, simply write:

```xml
<rect fill="url(#grad7)"/>
```

The above is a simplified excerpt from [`examples/pythagoras.psvg`](examples/pythagoras.psvg), which utilizes this "gradient of gradient" to colorize a tree:

![](examples/pythagoras.svg)



To transform shapes in vanilla SVG, the "group" metaphor (`<g transform="...">`) is often used. In addition to groups, PSVG also introduces Processing/p5.js-like `pushMatrix()` `popMatrix()` metaphors. For example, from the same `examples/pythagoras.psvg` as above, the `<push></push>` tag combined with `<translate/>` `<roatate/>` are used to draw a fractal tree:

```xml
<def-pythtree w="" d="{depth}">
  <push>
    <fill color="url(#grad{depth-d})"/>
    <path d="M0 {w/2} L{w/2} 0 L{w/2} {-w} L{-w/2} {-w} L{-w/2} 0 z"/>
  </push>

  <if true="{d==0}">
    <return/>
  </if>
  <push>
    <translate x="{-w/4}" y="{-w-w/4}"/>
    <rotate deg="-45"/>
    <pythtree w="{w/SQRT(2)}" d="{d-1}"/>
  </push>
  <push>
    <translate x="{w/4}" y="{-w-w/4}"/>
    <rotate deg="45"/>
    <pythtree w="{w/SQRT(2)}" d="{d-1}"/>
  </push>
</def-pythtree>
```

You can have your own pick of degree or radians: `<rotate deg="45">` or `<rotate rad="{PI/4}"/>` are the same. You can also use `<scale x="2" y="2"/>` to scale subsequent drawings.

Similarly, styling can also be written as commands to effect subsequent draw calls:

```xml
<stroke color="red" cap="round"/>
<fill color="green"/>

<path d="...">
<polyline points="...">
```

In addition to simple fractals shown above, PSVG is also capable of implementing complex algorithms, as it's a full programming language. For example, an implementation of Poisson disk sampling described in [this paper](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf), [`examples/poisson.psvg`](examples/poisson.psvg):

![](examples/poisson.svg)


## The PSVG to SVG Compiler

A baseline PSVG to SVG complier is included in this repo. It is a very "quick-and-dirty" implementation that `eval()`s transpiled JavaScript. So for now, don't compile files you don't trust!

### As command-line tool

Install it globally via [`npm`](https://www.npmjs.com/)

<pre>
npm i -g <a href="http://npmjs.com/package/@lingdong/psvg">@lingdong/psvg</a>
</pre>

and use it with:

```
psvg input.svg > output.svg
```

For example, to compile the hilbert curve example in this repo:

```
psvg examples/hilbert.psvg > examples/hilbert.svg
```

or try it without installing via [`npx`](https://www.npmjs.com/package/npx) (comes together with npm)

```
npx -s @lingdong/psvg input.svg > output.svg
```

### For the browser

PSVG is also available for browser via CDN, or [directly download](http://unpkg.com/@lingdong/psvg)

```html
<script src="http://unpkg.com/@lingdong/psvg"></script>
```

By including the script, all the `<psvg>` elements on the webpage will be compiled to `<svg>` when the page loads. Again, don't include PSVG files that you don't trust.

### As a library

Install locally in your project via npm

```
npm i @lingdong/psvg
```

```js
import { compilePSVG } from "@lingdong/psvg"

console.log(compilePSVG("<psvg>...</psvg>"))
```

or

```js
const { compilePSVG } = require("@lingdong/psvg")

console.log(compilePSVG("<psvg>...</psvg>"))
```

Additionally, `parsePSVG()` `transpilePSVG()` and `evalPSVG()` which are individual steps of compilation are also exported.

In browsers, functions are exported under the global variable `PSVG`.

**Check out [QUICKSTART.md](QUICKSTART.md) for a quick introduction to the PSVG language.**

## Editor Support

Syntax highlighting and auto-completion can be configured for editors by:

### VS Code

Add the following lines to your `settings.json`. [details](https://code.visualstudio.com/docs/languages/overview#_can-i-map-additional-file-extensions-to-a-language)

```json
  "files.associations": {
    "*.psvg": "xml"
  }
```

### GitHub

To get highlighting for PSVG files in your repositories on GitHub, create `.gitattributes` file at the root of your repo with the following content. [details](https://github.com/github/linguist#using-gitattributes)

```ini
*.psvg linguist-language=SVG
```

### Other editors

Since PSVG is compliant with XML and HTML specs, you can always alias your language id to XML or SVG via the corresponding config on your editor.
