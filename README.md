# PSVG - Programmable SVG

**[Doc](QUICKSTART.md) | [Playground]() | [Examples](examples/)**

PSVG is an extension of the SVG (Scalable Vector Graphics) format that introduces programming language features like functions, control flows, and variables -- Instead of writing a program that draws a picture, write a picture that draws itself!

PSVG is compliant with XML and HTML specs, so it can be easily embeded in a webpage or edited with an XML editor.

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

You can have your own pick of degree or radians: `<rotate deg="45">` or `<rotate rad="{PI/8}"/>` are the same. You can also use `<scale x="2" y="2"/>` to scale subsequent drawings.

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

### As commandline tool

Grab `dist/psvg.js` and run

```
node psvg.js path/to/input.psvg > path/to/out.svg
```

For example, to compile the hilbert curve example in this repo:

```
node dist/psvg.js examples/hilbert.psvg > examples/hibert.svg
```

Alternatively you can use things like the shebang trick, `pkg` tool, bash alias etc. to make it appear as an executable, and:

```
psvg input.svg > output.svg
```

The original source code is all in one file, `psvg.ts`, so you can also use `ts-node` to run that directly instead (or recompile with `tsc` to make sure you get the absolutely newest version).

### For the browser

```html
<script src="psvg.js"></script>
```

By including the script, all the `<psvg>` elements on the webpage will be compiled to `<svg>` when the page loads. Again, don't include PSVG files that you don't trust.

### As a library

In node:

```js
const {compilePSVG} = require("./psvg");
console.log(compilePSVG("<psvg>...</psvg>"));
```

Additionally, `parsePSVG()` `transpilePSVG()` and `evalPSVG()` which are individual steps of compilation are also exported.

In browser, `compilePSVG` and others are available globally. 

**Check out [QUICKSTART.md](QUICKSTART.md) for a quick introduction to the PSVG language.**