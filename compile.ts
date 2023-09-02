#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

import { join, dirname, basename } from 'https://deno.land/std@0.200.0/path/mod.ts';
import { ensureDirSync, walkSync, copySync } from 'https://deno.land/std@0.200.0/fs/mod.ts';
import postcss from 'https://deno.land/x/postcss@8.4.16/mod.js';
import autoprefixer from 'https://deno.land/x/postcss_autoprefixer@0.2.8/mod.js';
import { minifyHTML } from 'https://deno.land/x/minifier@v1.1.1/mod.ts';
import nesting from 'npm:postcss-nesting';
import csso from 'npm:postcss-csso';
import customPropsResolver from 'npm:postcss-custom-properties';
import existingPropertyLookup from 'npm:postcss-property-lookup';
import calc from 'npm:postcss-calc';
import importUrl from 'npm:postcss-partial-import';
import mixins from 'npm:postcss-mixins';

const publishPath = './publish';
const browserlist = ['> 0.5%', 'not dead', 'last 3 versions'];

ensureDirSync(publishPath);
Deno.removeSync(publishPath, { recursive: true });
const cssFiles = getDirContents('./css');
const htmlFiles = getDirContents('./html', './');
ensureDirSync('./assets');
copySync('./assets', join(publishPath, 'assets'));

for (const file of cssFiles) {
  await postcss([
    importUrl({  }),
    mixins(),
    existingPropertyLookup(),
    nesting,
    autoprefixer({ overrideBrowsersList: browserlist }),
    customPropsResolver(),
    calc({ mediaQueries: true, selectors: true }),
    csso({ comments: false })
  ])
    .process(file.contents, { from: file.inPath, to: file.outPath })
    .then(result => {
      const outPath = result.opts.to!;

      ensureDirSync(dirname(outPath))

      Deno.writeTextFile(outPath, result.css);

      if (result.map)
        Deno.writeTextFile(outPath + '.map', result.map.toString());
    });
}

for (const file of htmlFiles) {
  ensureDirSync(dirname(file.outPath))
  Deno.writeTextFile(file.outPath, minifyHTML(file.contents, { minifyCSS: true, minifyJS: true }))
}

function getDirContents(path: string, outPath?: string): ProcessableFile[] {
  ensureDirSync(path);

  const result = new Array<ProcessableFile>;

  for (const entry of walkSync(path)) {
    if (entry.isFile)
      result.push({
        inPath: entry.path,
        outPath: join(publishPath, outPath ? join(outPath, entry.name) : join('assets', entry.path)),
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