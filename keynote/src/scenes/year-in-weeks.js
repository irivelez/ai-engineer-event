// year-in-weeks (calm-a, PAPER data): the whole story of Epoch AI's Capabilities Index frontier, then the
// last 11 weeks. The scene is built in ./year-in-weeks/scene.js; this entry feeds it Epoch's data file (src/data/eci-history.json),
// imported at build time (like beats.json), so nothing on screen is invented.
import eci from '../data/eci-history.json';
import { makeScene } from './year-in-weeks/scene.js';

export default makeScene(eci);
