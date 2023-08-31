#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { join, dirname } from 'https://deno.land/std@0.200.0/path/mod.ts';
import { ensureDirSync, walkSync } from 'https://deno.land/std@0.200.0/fs/mod.ts';
import postcss from 'https://deno.land/x/postcss@8.4.16/mod.js';
import autoprefixer from 'https://deno.land/x/postcss_autoprefixer@0.2.8/mod.js';
import { minifyHTML } from 'https://deno.land/x/minifier@v1.1.1/mod.ts';
import nesting from 'npm:postcss-nesting';
import csso from 'npm:postcss-csso';
import customProps from 'npm:postcss-custom-properties';
import propertyLookup from 'npm:postcss-property-lookup';
import calc from 'npm:postcss-calc';

const outPath = './publish';
const autoprefixerConfig = {
  overrideBrowsersList: [ '> 0.2%, not dead', 'last 3 versions' ]
};

const cssFiles = getDirContents('./css');
const htmlFiles = getDirContents('./html');

for (const file of cssFiles) {
  postcss([
    autoprefixer(autoprefixerConfig),
    nesting,
    csso({ comments: false }),
    customProps(),
    propertyLookup(),
    calc({ mediaQueries: true, selectors: true })
  ])
    .process(file.contents, { from: file.inPath, to: file.outPath })
    .then(result => {
      const outPath = result.opts.to!;

      ensureDirSync(dirname(outPath))

      Deno.writeTextFile(outPath, result.css);
      
      if(result.map)
        Deno.writeTextFile(outPath + '.map', result.map.toString());
    });
}

for (const file of htmlFiles) {
  ensureDirSync(dirname(file.outPath))
  Deno.writeTextFile(file.outPath, minifyHTML(file.contents, { minifyCSS: true, minifyJS: true }))
}

function getDirContents(path: string): ProcessableFile[] {
  ensureDirSync(path);

  const result = new Array<ProcessableFile>;
  
  for (const entry of walkSync(path)) {
    if(entry.isFile)
      result.push({
        inPath: entry.path,
        outPath: join(outPath, entry.path),
        contents: Deno.readTextFileSync(entry.path),
      });
  }

  return result;
}

interface ProcessableFile {
  inPath: string,
  outPath: string,
  readonly contents: string
}