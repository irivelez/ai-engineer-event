// thermometers (calm-a, PAPER data): how we measure the frontier. The scene is built in ./thermometers/scene.js;
// this entry feeds it trend-research's data file (src/data/thermometers.json), imported at build time like
// beats.json, so every instrument, reading, date and chip on screen comes from that file.
import data from '../data/thermometers.json';
import { makeThermo } from './thermometers/scene.js';

export default makeThermo(data);
