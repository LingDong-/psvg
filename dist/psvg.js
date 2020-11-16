function parsePSVG(str) {
    var i = 0;
    var elts = [];
    var _loop_1 = function () {
        if (str[i] == "<") {
            var j_1 = i + 1;
            var j0_1 = -1;
            var j1_1 = -1;
            var quote = false;
            var lvl = 0;
            function parseElement() {
                function getTagName(open) {
                    return open.trim().split(" ")[0];
                }
                function getAttributes(open) {
                    return Object['fromEntries'](Array['from'](open.split(" ").slice(1).join(" ")['matchAll'](/(^| )(.*?)\="([^"]*)"/g)).map(function (x) { return x.slice(2); }));
                }
                if (j0_1 != -1) {
                    var open_1 = str.slice(i + 1, j0_1 - 1);
                    var body = str.slice(j0_1, j1_1);
                    // let close = str.slice(j1,j+1);
                    var elt = {
                        tagName: getTagName(open_1),
                        attributes: getAttributes(open_1),
                        children: parsePSVG(body)
                    };
                    elts.push(elt);
                }
                else {
                    var open_2 = str.slice(i + 1, j_1);
                    var elt = {
                        tagName: getTagName(open_2),
                        attributes: getAttributes(open_2),
                        children: []
                    };
                    elts.push(elt);
                }
            }
            while (j_1 <= str.length) {
                if (str[j_1] == '\\') {
                    j_1++;
                }
                if (str[j_1] == '"') {
                    quote = !quote;
                }
                if (!quote) {
                    if (str[j_1] == ">" && lvl == 0 && j0_1 == -1) {
                        j0_1 = j_1 + 1;
                    }
                    if (str[j_1] == "<") {
                        if (str[j_1 + 1] == "/") {
                            lvl--;
                            if (lvl == -1) {
                                j1_1 = j_1;
                            }
                            while (str[j_1] != ">") {
                                j_1++;
                            }
                            if (lvl == -1) {
                                parseElement();
                                i = j_1;
                                break;
                            }
                        }
                        else {
                            lvl++;
                        }
                    }
                    else if (str[j_1] == "/" && str[j_1 + 1] == ">") {
                        lvl--;
                        if (lvl == -1) {
                            parseElement();
                            i = j_1;
                            break;
                        }
                    }
                }
                j_1++;
            }
        }
        i++;
    };
    while (i <= str.length) {
        _loop_1();
    }
    return elts;
}
function transpilePSVG(prgm) {
    var funcs = {};
    function __val(x) {
        if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)) {
            return parseFloat(x);
        }
        if (x == "true" || x == "false") {
            return x == "true";
        }
        var hascm = x['includes'](',');
        if (hascm) {
            x = x.replace(/, */g, ',');
            var hasws = x['includes'](' ');
            var y = __tolist(x);
            if (!hasws) {
                y['allCommas'] = true;
            }
            return y;
        }
        if (x['includes'](' ')) {
            return __tolist(x);
        }
        return x;
    }
    function __makelist(x) {
        x.toString = function () { return x.join(x['allCommas'] ? ',' : ' '); };
        return x;
    }
    function __tolist(s) {
        return __makelist(s.replace(/,/g, ' ').split(" ").filter(function (x) { return x.length; }).map(__val));
    }
    var builtins = {
        NTH: (function (x, i) {
            return x[i];
        }).toString(),
        TAKE: (function (x, n) {
            return __makelist(x.slice(0, n));
        }).toString(),
        DROP: (function (x, n) {
            return __makelist(x.slice(n));
        }).toString(),
        UPDATE: (function (x, i, y) {
            var z = x.slice();
            z[i] = y;
            return __makelist(z);
        }).toString(),
        MAP: (function (x, f) {
            return __makelist(x.map(function (y) { return f(__val(y)); }));
        }).toString(),
        FILTER: (function (x, f) {
            return __makelist(x.filter(function (y) { return f(__val(y)); }));
        }).toString(),
        COUNT: (function (x) {
            return x.length;
        }).toString(),
        CAT: (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __makelist([].concat.apply([], args.filter(function (y) { return y.toString().length; })));
        }).toString(),
        REV: (function (x) {
            return __makelist(x.slice().reverse());
        }).toString(),
        FILL: (function (x, n) {
            return __makelist(new Array(n)['fill'](x));
        }).toString()
    };
    Object.getOwnPropertyNames(Math).map(function (x) { return builtins[x.toUpperCase()] = "Math[\"" + x + "\"]"; });
    return __val.toString() + ";" + __tolist.toString() + ";" + __makelist.toString() + ";" + Object['entries'](builtins).map(function (x) { return "const " + x[0] + "=" + x[1]; }).join(";") + ";let __out='';" + transpilePSVGList(prgm) + ";" + "__out;";
    function transpilePSVGList(prgm) {
        var _a, _b, _c;
        var out = "";
        var groups = 0;
        function transpileValue(x) {
            x = x.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
            if (x['startsWith']("{") && x['endsWith']("}") && (x.match(/{|}/g) || []).length == 2) {
                return x.slice(1, -1);
            }
            if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)) {
                return x;
            }
            return '__val(`' + x.replace(/(?<!\\)\{/g, "${") + "`)";
        }
        for (var i = 0; i < prgm.length; i++) {
            if (prgm[i].tagName.toUpperCase() == "PSVG") {
                var w = transpileValue((_a = prgm[i].attributes.width) !== null && _a !== void 0 ? _a : "100");
                var h = transpileValue((_b = prgm[i].attributes.height) !== null && _b !== void 0 ? _b : "100");
                out += "__out+=`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${" + w + "}\" height=\"${" + h + "}\" ";
                for (var k in prgm[i].attributes) {
                    if (!(["width", "height", "background"]['includes'](k))) {
                        out += k + "=\"${" + transpileValue(prgm[i].attributes[k]) + "}\" ";
                    }
                }
                out += ">`;";
                out += "const WIDTH=" + w + ";const HEIGHT=" + h + ";";
                if (prgm[i].attributes.background) {
                    out += "__out+=`<rect x=\"0\" y=\"0\" width=\"${" + w + "}\" height=\"${" + h + "}\" fill=\"${" + transpileValue(prgm[i].attributes.background) + "}\"/>`;";
                }
                out += transpilePSVGList(prgm[i].children);
                out += "__out+='</svg>';";
            }
            else if (prgm[i].tagName.toUpperCase()['startsWith']("DEF-")) {
                var name_1 = prgm[i].tagName.split("-").slice(1).join("-");
                funcs[name_1] = { name: name_1, args: Object.keys(prgm[i].attributes) };
                out += "function " + name_1 + "(" + Object['entries'](prgm[i].attributes).map(function (x) { return x[0] + "=" + transpileValue(x[1]); }) + "){";
                out += transpilePSVGList(prgm[i].children);
                out += "};";
            }
            else if (prgm[i].tagName.toUpperCase() == "IF") {
                if (Object.keys(prgm[i].attributes).length == 0) {
                    for (var j = 0; j < prgm[i].children.length; j++) {
                        if (j != 0) {
                            out += "else ";
                        }
                        if (prgm[i].children[j].attributes["true"]) {
                            out += "if (" + transpileValue(prgm[i].children[j].attributes["true"]) + ")";
                        }
                        else if (prgm[i].children[j].attributes["false"]) {
                            out += "if (!(" + transpileValue(prgm[i].children[j].attributes["false"]) + "))";
                        }
                        out += "{";
                        out += transpilePSVGList(prgm[i].children[j].children);
                        out += "}";
                    }
                    out += ";";
                }
                else {
                    if (prgm[i].attributes["true"]) {
                        out += "if (" + transpileValue(prgm[i].attributes["true"]) + "){";
                    }
                    else if (prgm[i].attributes["false"]) {
                        out += "if (!(" + transpileValue(prgm[i].attributes["false"]) + ")){";
                    }
                    out += transpilePSVGList(prgm[i].children);
                    out += "};";
                }
            }
            else if (prgm[i].tagName.toUpperCase() == "PUSH") {
                out += transpilePSVGList(prgm[i].children);
            }
            else if (prgm[i].tagName.toUpperCase() == "TRANSLATE") {
                out += "__out+=`<g transform=\"translate(${" + transpileValue(prgm[i].attributes.x) + "} ${" + transpileValue(prgm[i].attributes.y) + "})\">`;";
                groups++;
            }
            else if (prgm[i].tagName.toUpperCase() == "ROTATE") {
                if (prgm[i].attributes.rad) {
                    out += "__out+=`<g transform=\"rotate(${(" + transpileValue(prgm[i].attributes.rad) + ")*180/Math.PI})\">`;";
                }
                else {
                    out += "__out+=`<g transform=\"rotate(${" + transpileValue(prgm[i].attributes.deg) + "})\">`;";
                }
                groups++;
            }
            else if (prgm[i].tagName.toUpperCase() == "STROKE") {
                out += "__out+=`<g ";
                for (var k in prgm[i].attributes) {
                    out += {
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
                    }[k] + "=\"${" + transpileValue(prgm[i].attributes[k]) + "}\" ";
                }
                out += ">`;";
                groups++;
            }
            else if (prgm[i].tagName.toUpperCase() == "FILL") {
                out += "__out+=`<g ";
                for (var k in prgm[i].attributes) {
                    out += {
                        color: "fill",
                        value: "fill",
                        opacity: "fill-opacity",
                        rule: "fill-rule"
                    }[k] + "=\"${" + transpileValue(prgm[i].attributes[k]) + "}\" ";
                }
                out += ">`;";
                groups++;
            }
            else if (prgm[i].tagName.toUpperCase() == "SCALE") {
                out += "__out+=`<g transform=\"scale(${" + transpileValue(prgm[i].attributes.x) + "} ${" + transpileValue(prgm[i].attributes.y) + "})\">`;";
                groups++;
            }
            else if (prgm[i].tagName.toUpperCase() == "VAR") {
                for (var k in prgm[i].attributes) {
                    out += "let " + k + "=" + transpileValue(prgm[i].attributes[k]) + ";";
                }
            }
            else if (prgm[i].tagName.toUpperCase() == "ASGN" || prgm[i].tagName.toUpperCase() == "ASSIGN") {
                for (var k in prgm[i].attributes) {
                    out += k + "=" + transpileValue(prgm[i].attributes[k]) + ";";
                }
            }
            else if (prgm[i].tagName.toUpperCase() == "RETURN") {
                if (prgm[i].attributes.value) {
                    out += "return " + transpileValue(prgm[i].attributes.value) + ";";
                }
                else {
                    out += "return;";
                }
            }
            else if (prgm[i].tagName.toUpperCase() == "FOR") {
                var name_2 = void 0;
                for (var k in prgm[i].attributes) {
                    if (!(["true", "false", "step"]['includes'](k))) {
                        name_2 = k;
                        break;
                    }
                }
                var step = (_c = prgm[i].attributes['step']) !== null && _c !== void 0 ? _c : "1";
                out += "for (let " + name_2 + "=" + transpileValue(prgm[i].attributes[name_2]) + ";";
                if (prgm[i].attributes["true"]) {
                    out += transpileValue(prgm[i].attributes["true"]) + ";";
                }
                else {
                    out += "!(" + transpileValue(prgm[i].attributes["false"]) + ");";
                }
                out += name_2 + "+=" + transpileValue(step) + "){";
                out += transpilePSVGList(prgm[i].children);
                out += "};";
            }
            else if (prgm[i].tagName.toUpperCase() == "WHILE") {
                if (prgm[i].attributes["true"]) {
                    out += "while (" + transpileValue(prgm[i].attributes["true"]) + "){";
                }
                else {
                    out += "while (!(" + transpileValue(prgm[i].attributes["false"]) + ")){";
                }
                out += transpilePSVGList(prgm[i].children);
                out += "};";
            }
            else if (prgm[i].tagName in funcs) {
                out += prgm[i].tagName + "(";
                var args = funcs[prgm[i].tagName].args;
                for (var j = 0; j < args.length; j++) {
                    var v = prgm[i].attributes[args[j]];
                    out += v === undefined ? "undefined" : transpileValue(v);
                    out += ",";
                }
                out += ");";
            }
            else {
                out += "__out+=`<" + prgm[i].tagName + " ";
                for (var k in prgm[i].attributes) {
                    out += k + "=\"${" + transpileValue(prgm[i].attributes[k]) + "}\" ";
                }
                if (prgm[i].children.length) {
                    out += ">`;";
                    out += transpilePSVGList(prgm[i].children);
                    out += "__out+='</" + prgm[i].tagName + ">';";
                }
                else {
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
    return Function("\"use strict\";" + js + ";return __out;")();
}
function compilePSVG(psvg) {
    var prgm = parsePSVG(psvg);
    var js = transpilePSVG(prgm);
    return evalPSVG(js);
}
/*@ts-ignore*/
/*@ts-ignore*/ if (typeof module != 'undefined') {
    /*@ts-ignore*/ if (!module.parent) {
        /*@ts-ignore*/ var fs = require('fs');
        /*@ts-ignore*/ if (!process.argv[2]) {
            console.log("usage: psvg input.psvg > output.svg");
            process.exit();
        }
        /*@ts-ignore*/ console.log(compilePSVG(fs.readFileSync(process.argv[2]).toString()));
        /*@ts-ignore*/ }
    else {
        /*@ts-ignore*/ module.exports = { parsePSVG: parsePSVG, transpilePSVG: transpilePSVG, evalPSVG: evalPSVG, compilePSVG: compilePSVG };
        /*@ts-ignore*/ }
    /*@ts-ignore*/ }
else {
    /*@ts-ignore*/ window.addEventListener('load', function () {
        /*@ts-ignore*/ var psvgs = document.getElementsByTagName("PSVG");
        /*@ts-ignore*/ for (var i = 0; i < psvgs.length; i++) {
            /*@ts-ignore*/ psvgs[i].outerHTML = compilePSVG(psvgs[i].outerHTML);
            /*@ts-ignore*/ }
        /*@ts-ignore*/ 
    });
    /*@ts-ignore*/ }
/*@ts-ignore*/
