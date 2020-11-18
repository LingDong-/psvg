#!/usr/bin/env node
'use strict'
const fs = require('fs')
const { compilePSVG } = require('../dist/psvg')

if (!process.argv[2]) {
  console.log('usage: psvg input.psvg > output.svg')
  process.exit()
}

console.log(compilePSVG(fs.readFileSync(process.argv[2]).toString()))
