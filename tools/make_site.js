const fs = require('fs');
const path = require('path');
const examplePath = path.resolve(__dirname, '../examples');
const outPath = path.resolve(__dirname, '../site/index.html');

var exampleNames = fs
  .readdirSync(examplePath)
  .filter((x) => x.endsWith('.psvg'));
exampleNames.sort();
var exampleTexts = exampleNames.map((x) =>
  fs.readFileSync(path.join(examplePath, x)).toString()
);
var examples = {};
exampleNames.map((x, i) => (examples[x] = exampleTexts[i]));

let themeName = 'xq-light';

const html = String.raw;

let siteHTML = html`
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.css">
<link rel="stylesheet" href="https://codemirror.net/theme/${themeName}.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/edit/matchbrackets.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/comment/comment.min.js"></script>
<script src="https://codemirror.net/mode/xml/xml.js"></script>
<style>
  /* modify xq-light theme so strings don't look crazy red */
  .cm-s-xq-light span.cm-string { 
    color: rgb(200,50,10); 
  }

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
  #input {
    position:absolute;
    left:0px;
    top:50px;
    width:50%;
    height:calc(100% - 50px);
    border-right: 1px solid #bbb;
  }
  #output {
    position:absolute;
    left:50%;
    top:50px;
    width:50%;
    height:calc(100% - 50px);
  }
  #github {
    opacity:30%;
    position:absolute;
    right:9px;
    top:8px;
    cursor:pointer;
    z-index:1000;
  }
  #github:hover {
    opacity:50%;
  }
  #compile {
    position:absolute;
    left:calc(50% - 100px);
    top:4px;
    height:40px;
    width:200px;
  }
  #select {
    position:absolute;
    right:calc(50% + 10px);
    top:55px;
    z-index:999;
  }
  #auto-compile {
    position:absolute;
    left:calc(50% + 110px);
    top: 14px;
    height: 16px;
    width: 16px;
  }
  #auto-compile-label {
    position: absolute;
    left: calc(50% + 135px);
    top: 16px;
    line-height: 20px;
    font-family: sans-serif;
  }
  .CodeMirror {
    height: 100%;
  }
</style>
<body>
  <h1>PSVG</h1>
  <i style="font-size:13px;font-weight:lighter;">Programmable SVG format</i>
  <div id="input"></div>
  <div id="output"></div>
  <select id="select">
    ${Object.keys(examples)
      .map((x) => `<option value="${x}">${x}</option>`)
      .join('')}
  </select>
  
  <button id="compile">COMPILE</button>
  <input id="auto-compile" name="auto-compile" type="checkbox"></input>
  <label id="auto-compile-label" for="auto-compile">Auto</label>
  
  <a id="github" href="https://github.com/LingDong-/psvg" target="_blank">
    <svg fill="black" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" width="32" height="32" viewBox="0, 0, 32, 32">
      <path d="M15.999,-0 C7.163,-0 0,7.345 0,16.405 C0,23.653 4.584,29.802 10.942,31.972 C11.743,32.122 12.034,31.615 12.034,31.18 C12.034,30.792 12.021,29.759 12.013,28.391 C7.562,29.382 6.623,26.191 6.623,26.191 C5.895,24.296 4.846,23.791 4.846,23.791 C3.394,22.774 4.956,22.794 4.956,22.794 C6.562,22.91 7.407,24.485 7.407,24.485 C8.834,26.992 11.152,26.268 12.064,25.848 C12.209,24.788 12.622,24.065 13.079,23.655 C9.527,23.242 5.791,21.834 5.791,15.547 C5.791,13.757 6.415,12.292 7.438,11.145 C7.273,10.73 6.724,9.063 7.595,6.804 C7.595,6.804 8.938,6.363 11.995,8.486 C13.271,8.121 14.64,7.94 16,7.934 C17.359,7.94 18.728,8.121 20.006,8.486 C23.061,6.363 24.401,6.804 24.401,6.804 C25.275,9.063 24.726,10.73 24.561,11.145 C25.586,12.292 26.206,13.757 26.206,15.547 C26.206,21.85 22.465,23.236 18.9,23.642 C19.475,24.149 19.986,25.15 19.986,26.681 C19.986,28.873 19.967,30.643 19.967,31.18 C19.967,31.619 20.255,32.13 21.067,31.97 C27.42,29.796 32,23.651 32,16.405 C32,7.345 24.836,-0 15.999,-0"/>
    </svg>
  </a>

  <hr style="position: absolute;left:0px;top:40px;width:100%"/>
</body>
<script>
  ${fs
    .readFileSync(path.resolve(__dirname, '../dist/psvg.global.js'))
    .toString()}
</script>
<script>
  var themeName = "${themeName}";
  var examples = ${JSON.stringify(examples)}
  ${main.toString()}
  main();
</script>
`;

function main() {
  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const select = document.getElementById('select');
  const output = document.getElementById('output');
  const run = document.getElementById('compile');
  const auto = document.getElementById('auto-compile');

  const setExample = (name) => {
    select.value = name;
    CM.setValue(examples[name]);
    compile();
  };

  const compile = () => {
    output.innerHTML = PSVG.compilePSVG(CM.getValue());
  };
  const debouncedCompile = debounce(compile, 800);

  var CM = CodeMirror(document.getElementById('input'), {
    lineNumbers: true,
    matchBrackets: true,
    theme: themeName,
    mode: 'xml',
    extraKeys: {
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment',
      'Ctrl-Enter': compile,
      'Cmd-Enter': compile,
    },
  });

  CM.on('change', (_, e) => {
    if (auto.checked && e.origin !== 'setValue') {
      debouncedCompile();
    }
  });

  setExample('koch.psvg');
  select.onchange = () => setExample(select.value);
  run.onclick = compile;
}

fs.writeFileSync(outPath, siteHTML);
