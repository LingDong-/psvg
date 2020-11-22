const fs = require('fs');
const path = require('path');
const { compilePSVG } = require('../dist/psvg');
const examplePath = path.resolve(__dirname, '../examples');

const examples = fs.readdirSync(examplePath).filter((x) => x.endsWith('.psvg'));

for (const example of examples) {
  console.log(`compiling ${example}...`);
  const filepath = path.join(examplePath, example);
  const psvg = fs.readFileSync(filepath, 'utf-8');
  const svg = compilePSVG(psvg);

  fs.writeFileSync(filepath.replace(/\.psvg$/, '.svg'), svg, 'utf-8');
}
