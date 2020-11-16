interface PSVGElement {
  tagName:string;
  children:PSVGElement[];
  attributes:Record<string,string>;
  innerHTML:string;
}
interface PSVGFunc {
  name:string;
  args:string[];
}

function parsePSVG(str:string) : PSVGElement[] {
  str = str.replace(/<!--[^\0]*?-->/gm,"");
  let i : number = 0;
  let elts : PSVGElement[]=[];
  while (i <= str.length){
    if (str[i] == "<"){
      let j = i+1;
      let j0 = -1;
      let j1 = -1;
      let quote = false;
      let lvl = 0;
      function parseElement():void{
        function getTagName(open:string){
          return open.trim().split(" ")[0];
        }
        function getAttributes(open:string){
          // oneliner doesn't work for safari:
          // return Object['fromEntries'](Array['from'](open.split(" ").slice(1).join(" ")['matchAll'](/(^| )([^ ]+?)\="([^"]*)"/g)).map((x:string)=>x.slice(2)));
          
          // stupid polyfill for safari:
          let thing1:any = open.split(" ").slice(1).join(" ");
          let thing2:any = thing1['matchAll'];
          if (!thing2){
            thing2 = function(re:any){let ms = [];let m:any;while(1) {m =re.exec(thing1);if(m)ms.push(m);else break;}return ms;}
          }else{
            thing2 = function(re:any){return thing1.matchAll(re)}
          }
          if (!Object['fromEntries']){
            Object['fromEntries']=function(a:any){var o:any={};a.map((x:any)=>o[x[0]]=x[1]);return o}
          }
          return Object['fromEntries'](Array['from'](thing2(/(^| )([^ ]+?)\="([^"]*)"/g)).map((x:string)=>x.slice(2)));
        }
        if (j0 != -1){
          let open = str.slice(i+1,j0-1);
          let body = str.slice(j0,j1);
          // let close = str.slice(j1,j+1);
          let elt : PSVGElement = {
            tagName: getTagName(open),
            attributes: getAttributes(open),
            children: parsePSVG(body),
            innerHTML: body,
          };
          elts.push(elt);
        }else{
          let open = str.slice(i+1,j);
          let elt : PSVGElement = {
            tagName: getTagName(open),
            attributes: getAttributes(open),
            children: [],
            innerHTML:"",
          }
          elts.push(elt);
        }
      }
      while (j <= str.length){
        if (str[j]=='\\'){
          j++;
        }
        if (str[j]=='"'){
          quote = !quote;
        }
        if (!quote){
          if (str[j] == ">" && lvl == 0 && j0 == -1){
            j0 = j+1;
          }

          if (str[j] == "<"){
            if (str[j+1] == "/"){
              lvl--;
              if (lvl == -1){
                j1 = j;
              }
              while(str[j] != ">"){
                j++;
              }
              if (lvl == -1){
                parseElement();
                i = j;
                break;
              }
            }else{
              lvl++;
            }
          }else if (str[j] == "/" && str[j+1]==">"){
            lvl--;
            if (lvl == -1){
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


function transpilePSVG(prgm:PSVGElement[]):string{
  let funcs : Record<string,PSVGFunc> = {};
  function __val(x:string):any{
    if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)){
      return parseFloat(x);
    }
    if (x==`true` || x==`false`){
      return x==`true`;
    }
    
    let hascm = x['includes'](',');
    if (hascm){
      x = x.replace(/, */g,',');
      let hasws = x['includes'](' ');
      var y = __tolist(x);
      if (!hasws){
        y['allCommas']=true;
      }
      return y;
    }
    if (x['includes'](' ')){
      return __tolist(x);
    }
    return x;
  }
  function __makelist(x:any[]):any[]{
    x.toString = function(){return x.join(x['allCommas']?',':' ');};
    return x;
  }
  function __tolist(s:string):any[]{
    return __makelist(s.replace(/,/g,' ').split(" ").filter(x=>x.length).map(__val));
  }

  let builtins : Record<string,string> = {
    NTH:(function(x:any[]|string,i:number):any{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return x[i];
    }).toString(),
    TAKE:(function(x:any[]|string,n:number):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return __makelist(x.slice(0,n));
    }).toString(),
    DROP:(function(x:any[]|string,n:number):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return __makelist(x.slice(n));
    }).toString(),
    UPDATE:(function(x:any[]|string,i:number,y:any):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      let z = x.slice();
      z[i]=y;
      return __makelist(z);
    }).toString(),
    MAP:(function(x:any[]|string,f:(x:any)=>any):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return __makelist(x.map(y=>f(__val(y))));
    }).toString(),
    FILTER:(function(x:any[]|string,f:(x:any)=>any):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return __makelist(x.filter(y=>f(__val(y))));
    }).toString(),
    COUNT:(function(x:any[]|string):number{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return x.length;
    }).toString(),
    CAT:(function(...args:any):any[]{
      return __makelist([].concat(...args.filter((y:any)=>y.toString().length).map(
        (x:any)=>(typeof x=='string')?__tolist(x):x
      )));
    }).toString(),
    REV:(function(x:any[]|string):any[]{
      if (typeof x == 'string'){
        x = __tolist(x);
      }
      return __makelist(x.slice().reverse());
    }).toString(),
    FILL:(function(x:any,n:number):any[]{
      return __makelist(new Array(n)['fill'](x));
    }).toString(),

    LERP:(function(x:number,y:number,t:number):number{
      return x*(1-t)+y*t;
    }).toString(),
    CLAMP:(function(x:number,lo:number,hi:number):number{
      [lo,hi]=[Math.min(lo,hi),Math.max(lo,hi)];
      return Math.min(Math.max(x,lo),hi);
    }).toString(),
    MAPVAL:(function(x:number,istart:number,istop:number,ostart:number,ostop:number):number{
      return ostart + (ostop - ostart) * ((x - istart) / (istop - istart));
    }).toString(),
  }
  Object.getOwnPropertyNames(Math).map(x=>builtins[x.toUpperCase()]=`Math["${x}"]`);

  return __val.toString()+";"+__tolist.toString()+";"+__makelist.toString()+";"+Object['entries'](builtins).map((x:string[])=>"const "+x[0]+"="+x[1]).join(";")+";let __out='';"+transpilePSVGList(prgm)+";"+"__out;";
  
  function transpilePSVGList(prgm:PSVGElement[]):string{

    let out : string = "";
    let groups = 0;

    function transpileValue(x:string):string{
      x = x.trim();
      x = x.replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/&quot;/g,'"');
      if (x['startsWith']("{") && x['endsWith']("}") && (x.match(/{|}/g) || []).length==2){
        return x.slice(1,-1);
      }
      if (new RegExp(/^[+-]?(\d+([.]\d*)?([eE][+-]?\d+)?|[.]\d+([eE][+-]?\d+)?)$/g).test(x)){
        return x;
      }
      // crappy safari doesn't support lookbehind yet
      // return '__val(`'+x.replace(/(?<!\\)\{/g,"${") + "`)";
      return '__val(`'+x.replace(/([^\\]|^)\{/g,'$1${') + "`)";
    }
    for (var i = 0; i < prgm.length; i++){
      if (prgm[i].tagName.toUpperCase() == "PSVG"){
        let w = transpileValue(prgm[i].attributes.width??"100");
        let h = transpileValue(prgm[i].attributes.height??"100");
        out += `__out+=\`<svg xmlns="http://www.w3.org/2000/svg" width="\${${w}}" height="\${${h}}" `;
        for (var k in prgm[i].attributes){
          if (!(["width","height","background"]['includes'](k))){
            out += `${k}="\${${transpileValue(prgm[i].attributes[k])}}" `
          }
        }
        out += ">`;";
        out += `const WIDTH=${w};const HEIGHT=${h};`;
        if (prgm[i].attributes.background){
          out += `__out+=\`<rect x="0" y="0" width="\${${w}}" height="\${${h}}" fill="\${${transpileValue(prgm[i].attributes.background)}}"/>\`;`
        }
        out += transpilePSVGList(prgm[i].children);
        out += `__out+='</svg>';`;
      }else if (prgm[i].tagName.toUpperCase()['startsWith']("DEF-")){
        let name = prgm[i].tagName.split("-").slice(1).join("-");
        funcs[name]={name,args:Object.keys(prgm[i].attributes)};
        out += `function ${name}(${Object['entries'](prgm[i].attributes).map((x:string[])=>x[0]+"="+transpileValue(x[1]))}){`;
        out += transpilePSVGList(prgm[i].children);
        out += `};`;
      }else if (prgm[i].tagName.toUpperCase() == "IF"){
        if (Object.keys(prgm[i].attributes).length==0){
          for (var j = 0; j < prgm[i].children.length; j++){
            if (j != 0){
              out += "else ";
            }
            if (prgm[i].children[j].attributes.true){
              out += `if (${transpileValue(prgm[i].children[j].attributes.true)})`;
            }else if (prgm[i].children[j].attributes.false){
              out += `if (!(${transpileValue(prgm[i].children[j].attributes.false)}))`;
            }
            out += "{";
            out += transpilePSVGList(prgm[i].children[j].children);
            out += "}"
          }
          out += ";";
        }else{
          if (prgm[i].attributes.true){
            out += `if (${transpileValue(prgm[i].attributes.true)}){`;
          }else if (prgm[i].attributes.false){
            out += `if (!(${transpileValue(prgm[i].attributes.false)})){`;
          }
          out += transpilePSVGList(prgm[i].children);
          out += "};"
        }
      }else if (prgm[i].tagName.toUpperCase() == "PUSH"){
        out += transpilePSVGList(prgm[i].children);
      }else if (prgm[i].tagName.toUpperCase() == "TRANSLATE"){
        out += `__out+=\`<g transform="translate(\${${transpileValue(prgm[i].attributes.x)}} \${${transpileValue(prgm[i].attributes.y)}})">\`;`
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "ROTATE"){
        if (prgm[i].attributes.rad){
          out += `__out+=\`<g transform="rotate(\${(${transpileValue(prgm[i].attributes.rad)})*180/Math.PI})">\`;`
        }else{
          out += `__out+=\`<g transform="rotate(\${${transpileValue(prgm[i].attributes.deg)}})">\`;`
        }
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "STROKE"){
        out += "__out+=`<g ";
        for (var k in prgm[i].attributes){
          out += `${{
            color:"stroke",
            value:"stroke",
            width:"stroke-width",
            weight:"stroke-width",
            opacity:"stroke-opacity",
            cap:"stroke-linecap",
            join:"stroke-linejoin",
            dash:"stroke-dasharray",
            dashoffset:"stroke-dashoffset",
            miterlimit:"stroke-miterlimit",
          }[k]}="\${${transpileValue(prgm[i].attributes[k])}}" `
        }
        out += ">`;";
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "FILL"){
        out += "__out+=`<g ";
        for (var k in prgm[i].attributes){
          out += `${{
            color:"fill",
            value:"fill",
            opacity:"fill-opacity",
            rule:"fill-rule",
          }[k]}="\${${transpileValue(prgm[i].attributes[k])}}" `
        }
        out += ">`;";
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "FONT"){
        out += "__out+=`<g ";
        for (var k in prgm[i].attributes){
          out += `${{
            family:"font-family",
            font:"font-family",
            style:"font-style",
            variant:"font-variant",
            stretch:"font-stretch",
            size:"font-size",
            anchor:"text-anchor",
            weight:"font-weight",
            decoration:"text-decoration",
          }[k]}="\${${transpileValue(prgm[i].attributes[k])}}" `
        }
        out += ">`;";
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "SCALE"){
        out += `__out+=\`<g transform="scale(\${${transpileValue(prgm[i].attributes.x)}} \${${transpileValue(prgm[i].attributes.y)}})">\`;`
        groups++;
      }else if (prgm[i].tagName.toUpperCase() == "VAR"){
        for (var k in prgm[i].attributes){
          out += `let ${k}=${transpileValue(prgm[i].attributes[k])};`
        }
      }else if (prgm[i].tagName.toUpperCase() == "ASGN" || prgm[i].tagName.toUpperCase() == "ASSIGN"){
        for (var k in prgm[i].attributes){
          out += `${k}=${transpileValue(prgm[i].attributes[k])};`
        }
      }else if (prgm[i].tagName.toUpperCase() == "RETURN"){
        for (var j = 0; j < groups; j++){
          out += "__out+='</g>';"
        }
        if (prgm[i].attributes.value){
          out += `return ${transpileValue(prgm[i].attributes.value)};`;
        }else{
          out += `return;`;
        }
      }else if (prgm[i].tagName.toUpperCase() == "FOR"){
        let name : string;
        for (var k in prgm[i].attributes){
          
          if (!(["true","false","step"]['includes'](k))){
            name = k;
            break;
          }
        }
        let step : string = prgm[i].attributes['step']??"1";

        out += `for (let ${name}=${transpileValue(prgm[i].attributes[name])};`;
        if (prgm[i].attributes.true){
          out += `${transpileValue(prgm[i].attributes.true)};`;
        }else{
          out += `!(${transpileValue(prgm[i].attributes.false)});`;
        }
        out += `${name}+=${transpileValue(step)}){`
        out += transpilePSVGList(prgm[i].children);
        out += "};";

      }else if (prgm[i].tagName.toUpperCase() == "WHILE"){
        if (prgm[i].attributes.true){
          out += `while (${transpileValue(prgm[i].attributes.true)}){`;
        }else{
          out += `while (!(${transpileValue(prgm[i].attributes.false)})){`;
        }
        out += transpilePSVGList(prgm[i].children);
        out += "};";

      }else if (prgm[i].tagName in funcs){
        out += prgm[i].tagName+"(";
        let args = funcs[prgm[i].tagName].args;
        for (var j = 0; j < args.length; j++){
          let v = prgm[i].attributes[args[j]];
          out += v===undefined?"undefined":transpileValue(v);
          out += ",";
        }
        out += ");"
      }else{
        out += "__out+=`<"+prgm[i].tagName+" ";
        for (var k in prgm[i].attributes){
          out += `${k}="\${${transpileValue(prgm[i].attributes[k])}}" `;
        }
        let needInner = ["TEXT","STYLE"]['includes'](prgm[i].tagName.toUpperCase());
        if (prgm[i].children.length || needInner){
          out += ">`;";
          out += transpilePSVGList(prgm[i].children);
          if (needInner){
            out += "__out+=`"+prgm[i].innerHTML.replace(/`/g,"/`").replace(/<.*?>/g,"")+"`;";
          }
          out += "__out+='</"+prgm[i].tagName+">';";
        }else{
          out += "/>`;";
        }
      }
    }
    for (var i = 0; i < groups; i++){
      out += "__out+='</g>';"
    }
    return out;
  }
}

function evalPSVG(js:string):any{
  return Function(`"use strict";${js};return __out;`)();
}

function compilePSVG(psvg:string):any{
  let prgm = parsePSVG(psvg);
  // console.dir(prgm,{depth:null});
  let js = transpilePSVG(prgm);
  // console.log(js);
  return evalPSVG(js);
}


/*@ts-ignore*/
/*@ts-ignore*/if (typeof module != 'undefined') {
/*@ts-ignore*/  if (!module.parent){
/*@ts-ignore*/    const fs = require('fs');
/*@ts-ignore*/    if (!process.argv[2]){console.log("usage: psvg input.psvg > output.svg");process.exit()}
/*@ts-ignore*/    console.log(compilePSVG(fs.readFileSync(process.argv[2]).toString()));
/*@ts-ignore*/  }else{
/*@ts-ignore*/    module.exports = {parsePSVG,transpilePSVG,evalPSVG,compilePSVG};
/*@ts-ignore*/  }
/*@ts-ignore*/}else{
/*@ts-ignore*/  window.addEventListener('load',function(){
/*@ts-ignore*/    const psvgs = document.getElementsByTagName("PSVG");
/*@ts-ignore*/    for (let i = 0; i < psvgs.length; i++){
/*@ts-ignore*/      psvgs[i].outerHTML = compilePSVG(psvgs[i].outerHTML);
/*@ts-ignore*/    }
/*@ts-ignore*/  })
/*@ts-ignore*/}
/*@ts-ignore*/
