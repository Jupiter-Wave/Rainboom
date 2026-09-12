import {writeFileSync} from 'node:fs';
import {page} from './html.mjs';
writeFileSync('dist/index.html', page('<script src=game.js></script>'));
console.log('html ok');
