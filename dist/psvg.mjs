// psvg.ts
function parsePSVG(str) {
  str = str.replace(/<!--[^\0]*?-->/gm, "");
  let i = 0;
  const elts = [];
  while (i <= str.length) {
    if (str[i] == "<") {
      let j = i + 1;
      let bodyStart = -1;
      let bodyEnd = -1;
      let quote = false;
      let lvl = 0;
      function parseElement() {
        function getTagName(open) {
          return open.trim().split(" ")[0].trimEnd();
        }
        function getAttributes(open) {
          const attrsStr = open.split(" ").slice(1).join(" ");
          const matchAll = attrsStr.matchAll || ((re) => {
            const ms = [];
            while (1) {
              const m = re.exec(attrsStr);
              if (m)
                ms.push(m);
              else
                break;
            }
            return ms;
          });
          const fromEntries = Object.fromEntries || ((a) => {
            const o = {};
            a.map(([key, value]) => o[key] = value);
            return o;
          });
          return fromEntries(Array["from"](matchAll(/(^| )([^ ]+?)\="([^"]*)"/g)).map((x) => x.slice(2)));
        }
        if (bodyStart != -1) {
          const open = str.slice(i + 1, bodyStart - 1);
          const body = str.slice(bodyStart, bodyEnd);
          const elt = {
            tagName: getTagName(open),
            attributes: getAttributes(open),
            children: parsePSVG(body),
            innerHTML: body
          };
          elts.push(elt);
        } else {
          const open = str.slice(i + 1, j);
          const elt = {
            tagName: getTagName(open),
            attributes: getAttributes(open),
            children: [],
            innerHTML: ""
          };
          elts.push(elt);
        }
      }
      while (j <= str.length) {
        if (str[j] == "\\") {
          j++;
        }
        if (str[j] == '"') {
          quote = !quote;
        }
        if (!quote) {
          if (str[j] == ">" && lvl == 0 && bodyStart == -1) {
            bodyStart = j + 1;
          }
          if (str[j] == "<") {
            if (str[j + 1] == "/") {
              lvl--;
              if (lvl == -1) {
                bodyEnd = j;
              }
              while (str[j] != ">") {
                j++;
              }
              if (lvl == -1) {
                parseElement();
                i = j;
                break;
              }
            } else {
              lvl++;
            }
          } else if (str[j] == "/" && str[j + 1] == ">") {
            lvl--;
            if (lvl == -1) {
              parseElement();
              i = j;
              break;
            }
          }
        }
        j++;
      }
    }
    i++;
  }
  return elts;
}
function transpilePSVG(prgm) {
  let funcs = {};
  function __val(x) {
    if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)) {
      return parseFloat(x);
    }
    if (x == `true` || x == `false`) {
      return x == `true`;
    }
    let hascm = x["includes"](",");
    if (hascm) {
      x = x.replace(/, */g, ",");
      let hasws = x["includes"](" ");
      var y = __tolist(x);
      if (!hasws) {
        y["allCommas"] = true;
      }
      return y;
    }
    if (x["includes"](" ")) {
      return __tolist(x);
    }
    return x;
  }
  function __makelist(x) {
    x.toString = function() {
      return x.join(x["allCommas"] ? "," : " ");
    };
    return x;
  }
  function __tolist(s) {
    return __makelist(s.replace(/,/g, " ").split(" ").filter((x) => x.length).map(__val));
  }
  let builtins = {
    NTH: function(x, i) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return x[i];
    }.toString(),
    TAKE: function(x, n) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return __makelist(x.slice(0, n));
    }.toString(),
    DROP: function(x, n) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return __makelist(x.slice(n));
    }.toString(),
    UPDATE: function(x, i, y) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      let z = x.slice();
      z[i] = y;
      return __makelist(z);
    }.toString(),
    MAP: function(x, f) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return __makelist(x.map((y) => f(__val(y))));
    }.toString(),
    FILTER: function(x, f) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return __makelist(x.filter((y) => f(__val(y))));
    }.toString(),
    COUNT: function(x) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return x.length;
    }.toString(),
    CAT: function(...args) {
      return __makelist([].concat(...args.filter((y) => y.toString().length).map((x) => typeof x == "string" ? __tolist(x) : x)));
    }.toString(),
    REV: function(x) {
      if (typeof x == "string") {
        x = __tolist(x);
      }
      return __makelist(x.slice().reverse());
    }.toString(),
    FILL: function(x, n) {
      return __makelist(new Array(n)["fill"](x));
    }.toString(),
    LERP: function(x, y, t) {
      return x * (1 - t) + y * t;
    }.toString(),
    CLAMP: function(x, lo, hi) {
      [lo, hi] = [Math.min(lo, hi), Math.max(lo, hi)];
      return Math.min(Math.max(x, lo), hi);
    }.toString(),
    MAPVAL: function(x, istart, istop, ostart, ostop) {
      return ostart + (ostop - ostart) * ((x - istart) / (istop - istart));
    }.toString()
  };
  Object.getOwnPropertyNames(Math).map((x) => builtins[x.toUpperCase()] = `Math["${x}"]`);
  return __val.toString() + ";" + __tolist.toString() + ";" + __makelist.toString() + ";" + Object["entries"](builtins).map((x) => "const " + x[0] + "=" + x[1]).join(";") + ";let __out='';" + transpilePSVGList(prgm) + ";__out;";
  function transpilePSVGList(prgm2) {
    var _a, _b, _c;
    let out = "";
    let groups = 0;
    function transpileValue(x) {
      x = x.trim();
      x = x.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      if (x["startsWith"]("{") && x["endsWith"]("}") && (x.match(/{|}/g) || []).length == 2) {
        return x.slice(1, -1);
      }
      if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)) {
        return x;
      }
      return "__val(`" + x.replace(/([^\\]|^)\{/g, "$1${") + "`)";
    }
    for (var i = 0; i < prgm2.length; i++) {
      if (prgm2[i].tagName.toUpperCase() == "PSVG") {
        let w = transpileValue((_a = prgm2[i].attributes.width) != null ? _a : "100");
        let h = transpileValue((_b = prgm2[i].attributes.height) != null ? _b : "100");
        out += `__out+=\`<svg xmlns="http://www.w3.org/2000/svg" width="\${${w}}" height="\${${h}}" `;
        for (var k in prgm2[i].attributes) {
          if (!["width", "height", "background"]["includes"](k)) {
            out += `${k}="\${${transpileValue(prgm2[i].attributes[k])}}" `;
          }
        }
        out += ">`;";
        out += `const WIDTH=${w};const HEIGHT=${h};`;
        if (prgm2[i].attributes.background) {
          out += `__out+=\`<rect x="0" y="0" width="\${${w}}" height="\${${h}}" fill="\${${transpileValue(prgm2[i].attributes.background)}}"/>\`;`;
        }
        out += transpilePSVGList(prgm2[i].children);
        out += `__out+='</svg>';`;
      } else if (prgm2[i].tagName.toUpperCase()["startsWith"]("DEF-")) {
        let name = prgm2[i].tagName.split("-").slice(1).join("-");
        funcs[name] = {name, args: Object.keys(prgm2[i].attributes)};
        out += `function ${name}(${Object["entries"](prgm2[i].attributes).map((x) => x[0] + "=" + transpileValue(x[1]))}){`;
        out += transpilePSVGList(prgm2[i].children);
        out += `};`;
      } else if (prgm2[i].tagName.toUpperCase() == "IF") {
        if (Object.keys(prgm2[i].attributes).length == 0) {
          for (var j = 0; j < prgm2[i].children.length; j++) {
            if (j != 0) {
              out += "else ";
            }
            if (prgm2[i].children[j].attributes.true) {
              out += `if (${transpileValue(prgm2[i].children[j].attributes.true)})`;
            } else if (prgm2[i].children[j].attributes.false) {
              out += `if (!(${transpileValue(prgm2[i].children[j].attributes.false)}))`;
            }
            out += "{";
            out += transpilePSVGList(prgm2[i].children[j].children);
            out += "}";
          }
          out += ";";
        } else {
          if (prgm2[i].attributes.true) {
            out += `if (${transpileValue(prgm2[i].attributes.true)}){`;
          } else if (prgm2[i].attributes.false) {
            out += `if (!(${transpileValue(prgm2[i].attributes.false)})){`;
          }
          out += transpilePSVGList(prgm2[i].children);
          out += "};";
        }
      } else if (prgm2[i].tagName.toUpperCase() == "PUSH") {
        out += transpilePSVGList(prgm2[i].children);
      } else if (prgm2[i].tagName.toUpperCase() == "TRANSLATE") {
        out += `__out+=\`<g transform="translate(\${${transpileValue(prgm2[i].attributes.x)}} \${${transpileValue(prgm2[i].attributes.y)}})">\`;`;
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "ROTATE") {
        if (prgm2[i].attributes.rad) {
          out += `__out+=\`<g transform="rotate(\${(${transpileValue(prgm2[i].attributes.rad)})*180/Math.PI})">\`;`;
        } else {
          out += `__out+=\`<g transform="rotate(\${${transpileValue(prgm2[i].attributes.deg)}})">\`;`;
        }
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "STROKE") {
        out += "__out+=`<g ";
        for (var k in prgm2[i].attributes) {
          out += `${{
            color: "stroke",
            value: "stroke",
            width: "stroke-width",
            weight: "stroke-width",
            opacity: "stroke-opacity",
            cap: "stroke-linecap",
            join: "stroke-linejoin",
            dash: "stroke-dasharray",
            dashoffset: "stroke-dashoffset",
            miterlimit: "stroke-miterlimit"
          }[k]}="\${${transpileValue(prgm2[i].attributes[k])}}" `;
        }
        out += ">`;";
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "FILL") {
        out += "__out+=`<g ";
        for (var k in prgm2[i].attributes) {
          out += `${{
            color: "fill",
            value: "fill",
            opacity: "fill-opacity",
            rule: "fill-rule"
          }[k]}="\${${transpileValue(prgm2[i].attributes[k])}}" `;
        }
        out += ">`;";
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "FONT") {
        out += "__out+=`<g ";
        for (var k in prgm2[i].attributes) {
          out += `${{
            family: "font-family",
            font: "font-family",
            style: "font-style",
            variant: "font-variant",
            stretch: "font-stretch",
            size: "font-size",
            anchor: "text-anchor",
            weight: "font-weight",
            decoration: "text-decoration"
          }[k]}="\${${transpileValue(prgm2[i].attributes[k])}}" `;
        }
        out += ">`;";
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "SCALE") {
        out += `__out+=\`<g transform="scale(\${${transpileValue(prgm2[i].attributes.x)}} \${${transpileValue(prgm2[i].attributes.y)}})">\`;`;
        groups++;
      } else if (prgm2[i].tagName.toUpperCase() == "VAR") {
        for (var k in prgm2[i].attributes) {
          out += `let ${k}=${transpileValue(prgm2[i].attributes[k])};`;
        }
      } else if (prgm2[i].tagName.toUpperCase() == "ASGN" || prgm2[i].tagName.toUpperCase() == "ASSIGN") {
        for (var k in prgm2[i].attributes) {
          out += `${k}=${transpileValue(prgm2[i].attributes[k])};`;
        }
      } else if (prgm2[i].tagName.toUpperCase() == "RETURN") {
        for (var j = 0; j < groups; j++) {
          out += "__out+='</g>';";
        }
        if (prgm2[i].attributes.value) {
          out += `return ${transpileValue(prgm2[i].attributes.value)};`;
        } else {
          out += `return;`;
        }
      } else if (prgm2[i].tagName.toUpperCase() == "FOR") {
        let name;
        for (var k in prgm2[i].attributes) {
          if (!["true", "false", "step"]["includes"](k)) {
            name = k;
            break;
          }
        }
        let step = (_c = prgm2[i].attributes["step"]) != null ? _c : "1";
        out += `for (let ${name}=${transpileValue(prgm2[i].attributes[name])};`;
        if (prgm2[i].attributes.true) {
          out += `${transpileValue(prgm2[i].attributes.true)};`;
        } else {
          out += `!(${transpileValue(prgm2[i].attributes.false)});`;
        }
        out += `${name}+=${transpileValue(step)}){`;
        out += transpilePSVGList(prgm2[i].children);
        out += "};";
      } else if (prgm2[i].tagName.toUpperCase() == "WHILE") {
        if (prgm2[i].attributes.true) {
          out += `while (${transpileValue(prgm2[i].attributes.true)}){`;
        } else {
          out += `while (!(${transpileValue(prgm2[i].attributes.false)})){`;
        }
        out += transpilePSVGList(prgm2[i].children);
        out += "};";
      } else if (prgm2[i].tagName in funcs) {
        out += prgm2[i].tagName + "(";
        let args = funcs[prgm2[i].tagName].args;
        for (var j = 0; j < args.length; j++) {
          let v = prgm2[i].attributes[args[j]];
          out += v === void 0 ? "undefined" : transpileValue(v);
          out += ",";
        }
        out += ");";
      } else {
        out += "__out+=`<" + prgm2[i].tagName + " ";
        for (var k in prgm2[i].attributes) {
          out += `${k}="\${${transpileValue(prgm2[i].attributes[k])}}" `;
        }
        let needInner = ["TEXT", "STYLE"]["includes"](prgm2[i].tagName.toUpperCase());
        if (prgm2[i].children.length || needInner) {
          out += ">`;";
          out += transpilePSVGList(prgm2[i].children);
          if (needInner) {
            out += "__out+=`" + prgm2[i].innerHTML.replace(/`/g, "/`").replace(/<.*?>/g, "") + "`;";
          }
          out += "__out+='</" + prgm2[i].tagName + ">';";
        } else {
          out += "/>`;";
        }
      }
    }
    for (var i = 0; i < groups; i++) {
      out += "__out+='</g>';";
    }
    return out;
  }
}
function evalPSVG(js) {
  return Function(`"use strict";${js};return __out;`)();
}
function compilePSVG(psvg) {
  let prgm = parsePSVG(psvg);
  let js = transpilePSVG(prgm);
  return evalPSVG(js);
}
if (typeof window !== "undefined") {
  window.addEventListener("load", function() {
    const psvgs = document.getElementsByTagName("PSVG");
    for (let i = 0; i < psvgs.length; i++) {
      psvgs[i].outerHTML = compilePSVG(psvgs[i].outerHTML);
    }
  });
}
export {
  compilePSVG,
  evalPSVG,
  parsePSVG,
  transpilePSVG
};
