# PSVG Quickstart Guide

PSVG is a very simple language that tries keep true to the "look and feel" of the SVG format from which it's derived. It's duck-typed; In fact, it does not have typing at all: As XML attributes, all values are just strings. As you apply operations to the values, they're interpreted to appropriate types: numbers, strings, or arrays. Terrible as that might sound (to proponents of strong type systems and fast languages, that is), it's so designed to play well with the rest of the SVG, while remaining expressive and concise.

## A PSVG file

The structure of a PSVG file is very much like that of an SVG file. Instead of wrapping everything with an `<svg>` tag, wrap everything with a `<psvg>` tag:

```xml
<psvg width="100" height="100" background="red">
...
<!--program/data goes here-->
...
</psvg>
```

As shown above, you can also assign a background color(or image/gradiant etc) for the file. `xmlns` can be ommitted. Any other attributes (e.g. `viewBox`) you specify will be also included in the `svg` tag of the compiled output.

## Variables

Varaibles are declared with `var` tag.

```xml
<var x="42">
```

Multiple variables can be declared in the same tag:

```xml
<var x="42" y="12"/>
```

Varaibales can be used anywhere to parameterize SVG drawings.

To do so, put them inside squiggly braces:

```xml
<var x="42" y="12"/>
<line x1="{x}" y1="{y}" x2="0" y2="0"/>
```

The squiggly braces basically means to "evaluate" what's inside, instead of taking the whole thing as a string verbatim. If you're using any variables, or doing math, you'll need squiggly braces to wrap them.

For example, the first `rect` below will be red, while the second will actually be green. (Just a demo! It'd be really confusing if you do it IRL).

```xml
<var red="green"/>
<rect x="0"  y="0" width="10" height="10" fill="red"/>
<rect x="10" y="0" width="10" height="10" fill="{red}"/>
```

In addition to use a variable for an entire field, variables can also be interpolated, sort of like JavaScript's `${}`:

```xml
<var r="200"/>
<var g="100"/>
<var b="10"/>
<rect width="10" height="10" fill="rgb({r},{g},{b})"/>
```

This is also handy for `path` `d`ata or `polyline` `points`:


```xml
<var x="42" y="12"/>
<path d="M {x} {y} L 0 0"/>
```

To modify a variable, use `asgn` (or `assign`, if you dislike the abbreviation):

```xml
<var x="42">
<asgn x="41"/>
<assign x="{x+1}"/>
```

If you're curious why `set` is not used as the intuitive assignment keyword, it's because SVG spec took it already.

## Control Flow

Simple if statements:

```xml
<if true="{x==42}">
  <!--do something-->
</if>
```

There's also a shorthand for `if not`:

```xml
<if false="{x==42}">
  <!-- x!=42 -->
</if>
```

If you need `else if` or `else`, the syntax is a little bit different, and might remind you of `switch` statements, or that `cond` in Lisp:

```xml
<if>
  <cond true="{x==1}">
    <!-- do something -->
  </cond>
  <cond true="{x==2}">
    <!-- do something -->
  </cond>
  <cond>
    <!-- do something -->
  </cond>
</if>
```

After reaching the first `cond` that evaluates to true, the block is executed and the rest are skipped. The last `cond` does not need to have a test, and will be executed if all the ones before are skipped.

For loops:

```xml
<for i="0" true="{i<10}" step="1">
  <!-- do the ith thing -->
</for>
```

Similar to `<if>`, the `true` attribute can also be replaced with say `false="{i>=10}"`. The `step` can be ommited.

While loops:

```xml
<while true="{x==42}">
  <!--do something-->
</while>
```

## Functions

To define a function called `foo`, make a tag called `def-foo` and put the implementation inside.

```xml
<def-foo x="0" y="0">
  <line x1="{x}" y1="{y}" x2="0" y2="0"/>
</def-foo>
```

The `0`s in `x="0" y="0"` are default values for parameters, you can also put empty string `x="" y=""` if you don't need them. But the `x` and `y` need to be there to declare the parameters.

To invoke a function, use it as if it's an SVG command:

```xml
<foo x="10" y="10" />
```

What if the function needs to return a value, to be used in some other calculations?

```xml
<def-add x="0" y="0">
  <return "{x+y}"/>
</def-add>
```

The conventional `fun(arg,arg,arg)` syntax from other programming languages can also be used to call a function:

```xml
<var z="{add(1,2)+3}">
```

## Math

Math operators work just like you might expect. You have `+` `-` `*` `/` etc. They mirror JavaScript's math behavior. You also get more advanced Math functions, like those found in JavaScript's `Math` object as builtin functions. Builtin functions in PSVG are all captalized, e.g.

```xml
<var x="{SIN(PI/2)+SQRT(3)}"/>
```

Beware that some XML tools doesn't like `<` `>` and `&` even when they're inside strings, so you might need to write `x &amp;&amp; y` instead of `x && y`, or `x &lt; y` instead of `x < y`.

## Arrays

Arrays in PSVG, as they're in SVG, are just strings with space or comma delimited values. 

```xml
<var arr="1 2 3 4 5 6 7"/>
<var brr="5,4,3,2,1"/>
```

A collection of builtins are provided to operate on arrays. These builtins are functional, meaning that they do not modify the input, and instead return new arrays.

- `CAT(arr1,arr2,val1,arr3,...)` concatenates arrays as well as values.
- `NTH(arr,n)` returns the nth element of the array.
- `COUNT(arr)` returns the length of the array.
- `UPDATE(arr,i,val)` returns a new array with the `i`th element replaced by `val`.
- `TAKE(arr,n)` and `DROP(arr,n)` can be used to slice the array.
- `MAP(arr,f)` and `FILTER(arr,f)` are the functional functions.
- `REV(arr)` reverses the array.
- `FILL(val,n)` generates an array of length `n` filled with `val`.

This makes it super easy to put an array of points in say a `path` or `polyline` element.

```xml
<var data="M 0 0 L 10 10"/>
<var data="CAT(data,'L',20,10)"/> <!-- adds a new point -->
<path d="{data}">
```

```xml
<var data="M 0 0 L 10 10"/>
<var data="UPDATE(data,1,20)"/> <!-- changes first x coord-->
<path d="{data}">
```

## Misc

In addition to math and array functions listed before, there're also a couple other builtins for convenience:

- `WIDTH` and `HEIGHT` are dimensions of current image.
- `MAPVAL(val,istart,istop,ostart,ostop)` maps a value to another range, like Processing/p5.js `map()`
- `CLAMP(val,lo,hi)` clamps a value within specified range.
- `RANDOM()` gives a random number between 0 and 1.
- `LERP(a,b,t)` linearly interpolates between `a` and `b` by parameter `t`


That's it! You now know all the basics of the PSVG language. Feel free to head over to `examples/` folder to learn by examples.

