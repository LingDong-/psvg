const fs = require('fs');
const path = require('path');
const { compilePSVG } = require('../dist/psvg');
const examplePath = path.resolve(__dirname, '../examples');

const overwrite = process.argv[2]||false;

const examples = fs.readdirSync(examplePath).filter((x) => x.endsWith('.psvg'));

for (const example of examples) {
  console.log(`compiling ${example}...`);
  const filepath = path.join(examplePath, example);
  const outpath = filepath.replace(/\.psvg$/, '.svg');
  if (fs.existsSync(outpath) && !overwrite) {
    console.log(`skipped.`);
    continue;
  }
  const psvg = fs.readFileSync(filepath, 'utf-8');
  const svg = compilePSVG(psvg);

  fs.writeFileSync(filepath.replace(/\.psvg$/, '.svg'), svg, 'utf-8');
}


var md="# Gallery\nPSVG `examples/` showcase! You can also fiddle with these examples on the online [Playground](https://psvg.netlify.app/). \n\n";
for (const example of examples) {
  if (example.includes("helloworld")){
    continue; // redundent with textanim and not as cool
  }
  const svg = example.replace(/\.psvg$/,'.svg');
  const filepath = path.join(examplePath, example);
  const com = fs.readFileSync(filepath).toString().split("-->").map(x=>x.trim()).filter(x=>x.startsWith('<!--')).join(' -->\n')+' -->\n';
  md+=`\n## [${example}](${example}) → [${svg}](${svg})\n\n`;
  md+=`![${svg}](${svg})\n\n`;
  md+="```xml\n"+com+"```\n\n";
}
fs.writeFileSync(path.join(examplePath,"README.md"),md,'utf-8');