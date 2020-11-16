const fs = require('fs');
var exampleNames = fs.readdirSync('../examples').filter(x=>x.endsWith(".psvg"));
exampleNames.sort();
var exampleTexts = exampleNames.map(x=>fs.readFileSync('../examples/'+x).toString())
var examples = {};
exampleNames.map((x,i)=>examples[x]=exampleTexts[i]);

let themeName = "xq-light"

let html=`
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.css">
<link rel="stylesheet" href="https://codemirror.net/theme/${themeName}.css">
<style>
/* modify xq-light theme so strings don't look crazy red */
.cm-s-xq-light span.cm-string { color: rgb(200,50,10); }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/edit/matchbrackets.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/comment/comment.min.js"></script>
<script src="https://codemirror.net/mode/xml/xml.js"></script>
<style>
  body{
    margin:4px;
    margin-left:10px;
    overflow:hidden;
  }
  h1{
    margin:0px;
    font-size:20px;
    font-weight: lighter;
    letter-spacing:10px;
    font-family: sans-serif;
  }
</style>
<style>.CodeMirror { height: 100%; }</style>
<body>
  <h1>PSVG</h1>
  <i style="font-size:13px;font-weight:lighter;">Programmable SVG format</i>
  <div id="c" style="position:absolute;left:0px;top:50px;width:50%;height:calc(100% - 50px);"></div>
  <div id="o" style="position:absolute;left:50%;top:50px;width:50%;height:calc(100% - 50px);"></div>
  <select id="s" style="position:absolute;right:calc(50% + 10px);top:55px;z-index:999;">
    ${
      Object.keys(examples).map(x=>`<option value="${x}">${x}</option>`).join("")
    }
  </select>
  
  <button id="r" style="position:absolute;left:calc(50% - 100px);top:4px;height:40px;width:200px;">COMPILE</button>
  <hr style="position: absolute;left:0px;top:40px;width:100%"/>
</body>
<script>
  ${fs.readFileSync("../dist/psvg.js").toString()}
</script>
<script>
  var themeName = "${themeName}";
  var examples = ${JSON.stringify(examples)}
  ${main.toString()}
  main();
</script>
`;


function main(){
  var CM = CodeMirror(document.getElementById("c"), {
    lineNumbers:true,
    matchBrackets: true,
    theme:themeName,
    mode:  "xml",
    extraKeys:{
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment'
    }
  });

  CM.setValue(examples["koch.psvg"]);
  document.getElementById('o').innerHTML = compilePSVG(examples["koch.psvg"]);
  document.getElementById('s').value = "koch.psvg";
  document.getElementById('s').onchange = function(){
    CM.setValue(examples[document.getElementById('s').value]);
    document.getElementById('r').onclick();
  }

  document.getElementById('r').onclick = function(){
    document.getElementById('o').innerHTML = compilePSVG(CM.getValue());
  }
}


fs.writeFileSync("../site/index.html",html);