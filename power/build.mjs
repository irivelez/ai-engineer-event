import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (name, encoding) => readFile(path.join(dir, name), encoding);
const data = async (name, mime) => 'data:' + mime + ';base64,' + (await read(name)).toString('base64');
const fonts = [
  ['Geist', 'Geist-Variable.woff2', 'normal'],
  ['Geist Mono', 'GeistMono-Variable.woff2', 'normal'],
  ['Newsreader', 'NewsreaderItalic-Variable.woff2', 'italic']
];
const type = await Promise.all(fonts.map(async ([family, name, style]) =>
  "@font-face{font-family:'" + family + "';font-style:" + style + ";font-weight:100 900;font-display:swap;src:url('" +
  await data('art/fonts/' + name, 'font/woff2') + "') format('woff2');}"
));
const art = await data('art/switch.jpg', 'image/jpeg');
const posters = {};
for (const id of ['flow','solar','orbit','close','flow0','flow1','flow2']) {
  posters[id] = await data('art/' + id + '.jpg', 'image/jpeg');
}
const assets = ":root{--hero:url('" + art + "')}";
const [stage,figures,shell,threeLicense,geistLicense,newsreaderLicense] = await Promise.all([
  read('src/stage.css','utf8'),read('src/figures.css','utf8'),read('src/shell.html','utf8'),
  read('art/LICENSE-Three.txt','utf8'),read('art/fonts/OFL-Geist.txt','utf8'),read('art/fonts/OFL-Newsreader.txt','utf8')
]);
const library = await esbuild.build({
  entryPoints: [path.join(dir,'src/app.js')], bundle:true,write:false,minify:true,target:['es2021'],
  format:'iife', legalComments:'inline', define:{ __POSTERS__:JSON.stringify(posters) }
});
const styles = [...type, assets, stage, figures].join('\n');
const code = library.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const licenses = '\n<!--\n' + [threeLicense,geistLicense,newsreaderLicense].map(s=>s.replaceAll('--','—')).join('\n\n') + '\n-->\n';
const result = shell.replace('/*__STYLE__*/',()=>styles).replace('/*__JAVASCRIPT__*/',()=>code).replace('</html>',()=>licenses+'</html>');
await writeFile(path.join(dir,'index.html'),result);
console.log('Built the self-contained keynote (' + (Buffer.byteLength(result)/1024/1024).toFixed(2) + ' MiB).');
