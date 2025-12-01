const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.resolve(__dirname, 'src/styles.css'), 'utf8');

postcss([tailwindcss, autoprefixer])
  .process(css, { from: path.resolve(__dirname, 'src/styles.css') })
  .then(result => {
    fs.writeFileSync(path.resolve(__dirname, 'public/output.css'), result.css);
    if (result.map) fs.writeFileSync(path.resolve(__dirname, 'public/output.css.map'), result.map.toString());
  });