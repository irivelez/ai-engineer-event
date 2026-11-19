import { scenes, sources, routeSteps } from './story.js';
import { mountFigure } from './figures.js';
import { createWorld } from './world.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const page = $('presentation');
const reader = $('reader');
const film = new URLSearchParams(location.search).has('film');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const posterOnly = new URLSearchParams(location.search).has('still');
const posters = __POSTERS__;
const starts = [];
const duration = scenes.reduce((time, scene) => {
  starts.push(time);
  return time + scene.seconds;
}, 0);
const clock = seconds => Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
const pad = n => String(n).padStart(2, '0');
const plain = s => s.replace(/<[^>]+>/g, '');
const playIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.5 17 10 5 17.5z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h4v14H4zm8 0h4v14h-4z"/></svg>';
const worlds = new Set(['flow','solar','orbit','close']);
let index = -1;
let elapsed = 0;
let playing = false;
let reduced = motion.matches;
let world, worldUnavailable = posterOnly;
let step = -1, panel = 'sources', lastClock = '', lastTimestamp = null, visualTime = 0, lastDraw = -1;
let launchButton = null;

root.dataset.film = String(film);
root.dataset.motion = reduced ? 'reduce' : 'full';

function announce(value) {
  $('announcer').textContent = value;
}
function button(label, handler, attributes = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = label;
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  el.addEventListener('click', handler);
  return el;
}
function installNavigation() {
  scenes.forEach((scene, i) => {
    const mark = button('', () => jump(i), { 'aria-label': 'Go to ' + scene.name, title: scene.name });
    $('rail').append(mark);
  });
  routeSteps.forEach(([name, description], i) => {
    const el = button(name, () => { pause(); setRoute(i); }, { title: description, 'aria-label': name + '. ' + description });
    $('route').append(el);
  });
}

function setRoute(value) {
  if (index < 0 || scenes[index].id !== 'flow' || step === value) return;
  step = value;
  [...$('route').children].forEach((el, i) => el.setAttribute('aria-pressed', String(i === step)));
  world?.setStep(step);
  const image = posters['flow' + step] || posters.flow;
  if (image && $('poster').src !== image) $('poster').src = image;
}
function stillView() {
  $('world').hidden = true;
  $('poster').hidden = false;
  $('illustration-label').textContent = 'Illustrative model';
}
function mountWorld(id, instant) {
  const active = worlds.has(id);
  $('world-pane').hidden = !active;
  $('route').hidden = id !== 'flow';
  $('figure').hidden = active || id === 'cover';
  world?.setVisible(active);
  if (!active) return;
  $('poster').src = posters[id];
  $('world-pane').setAttribute('role', 'group');
  const descriptions = {
    flow: 'Illustration of a power plant, pylons, a substation and a server hall connected by electric lines.',
    solar: 'Illustrative model of tilted solar panels beside a computing facility.',
    orbit: 'Illustrative spacecraft with solar panels, processors and a radio link above Earth.',
    close: 'Illustrative copper switch blade closing onto its electric contact.'
  };
  $('world-pane').setAttribute('aria-label', descriptions[id]);
  try {
    if (worldUnavailable) { stillView(); return; }
    $('world').hidden = false;
    if (!world) world = createWorld($('world'));
    world.setReducedMotion(reduced);
    world.setScene(id, instant);
    world.resize();
    world.renderFrame(0);
    $('poster').hidden = true;
  } catch {
    worldUnavailable = true;
    world?.dispose(); world = undefined;
    stillView();
  }
}
$('world').addEventListener('webglcontextlost', event => {
  event.preventDefault();
  worldUnavailable = true;
  world?.setVisible(false);
  stillView();
});
$('world').addEventListener('webglcontextrestored', () => {
  if (posterOnly) return;
  world?.dispose(); world = undefined; worldUnavailable = false;
  if (worlds.has(scenes[index].id)) mountWorld(scenes[index].id, true);
});

function fillAdditional(scene) {
  const extra = $('extra');
  extra.replaceChildren();
  if (scene.id === 'cover') {
    const byline = document.createElement('div');
    byline.className = 'byline';
    byline.textContent = 'Irina Vélez';
    extra.append(byline);
  }
  if (scene.signal) {
    const items = document.createElement('div'); items.className = 'readout';
    scene.signal.forEach(([value, label]) => {
      const pair = document.createElement('div');
      const number = document.createElement('strong'); number.textContent = value;
      const detail = document.createElement('span'); detail.textContent = label;
      pair.append(number, detail); items.append(pair);
    });
    extra.append(items);
  }
  if (scene.stat) {
    const block = document.createElement('div'); block.className = 'stat';
    const value = document.createElement('strong'); value.textContent = scene.stat[0];
    const label = document.createElement('span'); label.textContent = scene.stat[1];
    block.append(value, label); extra.append(block);
  }
  if (scene.after) {
    const after = document.createElement('p'); after.className = 'after'; after.textContent = scene.after; extra.append(after);
  }
  if (scene.quote) {
    const quote = document.createElement('blockquote');
    const words = document.createElement('p'); words.textContent = scene.quote;
    const author = document.createElement('cite'); author.textContent = scene.by;
    quote.append(words, author); extra.append(quote);
  }
}

function selectScene(i, {instant = false, hash = true} = {}) {
  if (i < 0 || i >= scenes.length) return;
  const old = index; index = i; step = -1; visualTime = 0; lastDraw = -1;
  const scene = scenes[i];
  page.dataset.chapter = scene.id;
  page.dataset.theme = scene.dark ? 'dark' : 'paper';
  $('section-name').textContent = scene.section;
  $('chapter-title').innerHTML = scene.title;
  $('intro').textContent = scene.intro;
  fillAdditional(scene);
  $('chapter-name').textContent = scene.name;
  $('chapter-count').textContent = pad(i+1) + ' / ' + pad(scenes.length);
  document.querySelector('.film-folio').textContent = scene.name + '   ' + pad(i+1) + ' / ' + pad(scenes.length);
  $('previous').disabled = i === 0;
  $('next').disabled = i === scenes.length-1;
  $('source-line').textContent = scene.sourceLabel;
  $('source-line').setAttribute('aria-label', 'Read sources for ' + scene.name);
  $('illustration-label').textContent = worlds.has(scene.id) ? 'Illustrative model' : (scene.id === 'cover' ? 'Evidence as of 19 Nov 2026' : '');
  [...$('rail').children].forEach((b,j) => {
    b.classList.toggle('past', j<i);
    if(j===i) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current');
  });
  mountWorld(scene.id, instant);
  mountFigure($('figure'), scene.id);
  if (scene.id === 'flow') setRoute(0);
  if (!film) {
    page.classList.remove('arrive');
    if (!instant && !reduced) { void page.offsetWidth; page.classList.add('arrive'); }
    if (hash && location.hash !== '#' + scene.id) {
      try { history.replaceState(null,'','#'+scene.id); } catch { /* File viewers can disable history updates. */ }
    }
    if (old !== i) { announce(scene.name + ', chapter ' + (i+1) + ' of ' + scenes.length); window.scrollTo(0,0); }
  }
}
function paintPlay() {
  const replay = !playing && elapsed >= duration;
  $('play').innerHTML = (playing ? pauseIcon : playIcon) + '<span>' + (playing ? 'Pause' : replay ? 'Replay' : 'Play') + '</span>';
  $('play').setAttribute('aria-label', playing ? 'Pause timed presentation' : replay ? 'Replay presentation' : 'Play timed presentation');
  $('play').setAttribute('aria-pressed',String(playing));
}
function paintClock() {
  const display = clock(elapsed) + ' / ' + clock(duration);
  if (display !== lastClock) { $('time').textContent = display; lastClock=display; }
}
function pause() { if(playing) { playing = false; paintPlay(); } }
function jump(i) {
  if (i<0 || i>=scenes.length) return;
  pause(); elapsed=starts[i]; selectScene(i); paintClock(); paintPlay();
}
function togglePlay() {
  if (playing) { pause(); return; }
  if (elapsed >= duration) { elapsed=0; selectScene(0); }
  playing = true; lastTimestamp=null; paintPlay();
}
function position(t, animate, forFilm) {
  elapsed = Math.min(duration, Math.max(0,t));
  let next = 0;
  while (next+1 < starts.length && elapsed >= starts[next+1]) next++;
  if (next !== index) selectScene(next, {instant: !animate,hash:!forFilm});
  const local = elapsed - starts[next];
  if (scenes[index].id==='flow') setRoute(Math.min(2,Math.floor(local/(scenes[index].seconds/3))));
  return local;
}
function paintWorld(t) {
  if(scenes[index].id==='cover') {
    const zoom = reduced ? 1 : 1 + Math.min(1,t/scenes[0].seconds)*.032;
    $('hero-image').style.setProperty('--hero-zoom',String(zoom));
  } else if(!worldUnavailable && world && worlds.has(scenes[index].id)) {
    try { world.renderFrame(t); }
    catch { worldUnavailable=true; world.setVisible(false); stillView(); }
  }
}
function frame(timestamp) {
  if (lastTimestamp===null) lastTimestamp=timestamp;
  const delta = (timestamp-lastTimestamp)/1000;
  lastTimestamp=timestamp;
  if (!document.hidden && !reader.open) {
    if(playing) {
      visualTime=position(elapsed+delta,true,false);
      if(elapsed>=duration) pause();
      paintClock();
    } else visualTime+=Math.min(.1,delta);
    if (lastDraw<0 || timestamp-lastDraw>=1000/30-.8) {
      paintWorld(visualTime); lastDraw=timestamp;
    }
  }
  requestAnimationFrame(frame);
}
function renderReader(view) {
  panel=view;
  const name = {sources:'Sources', notes:'Speaker notes', chapters:'Chapters'};
  $('reader-tabs').replaceChildren(...Object.entries(name).map(([v,n])=>button(n,()=>renderReader(v),{'aria-pressed':String(v===view)})));
  const scene=scenes[index], body=$('reader-body');
  body.replaceChildren();
  const node=(tag,txt,cls) => {const el=document.createElement(tag);el.textContent=txt;if(cls)el.className=cls;return el;};
  const kicker=node('div',view==='chapters'?'4 min 15 s · Eight chapters':'Chapter '+pad(index+1)+' / '+pad(scenes.length)+' · '+clock(starts[index])+'–'+clock(starts[index]+scene.seconds),'reader-kicker');
  const heading=node('h2',view==='chapters'?'The presentation':plain(scene.title)); heading.id='reader-heading';
  body.append(kicker,heading);
  if(view==='chapters') {
    const list=node('ol','','chapter-list');
    scenes.forEach((s,i)=>{
      const li=document.createElement('li');const b=button('',()=>{reader.close();jump(i);});
      if(i===index) b.setAttribute('aria-current','step');
      b.append(node('span',pad(i+1),'reader-time'),node('span',s.name),node('span',clock(starts[i]),'reader-time'));
      li.append(b);list.append(li);
    });
    body.append(list,node('h3','Keyboard controls'));
    const keys=document.createElement('dl');keys.className='keymap';
    [['← / →','Previous or next chapter'],['Space','Next chapter'],['K','Play or pause the timed tour'],['N / S','Speaker notes or sources'],['G / F','Chapter list or fullscreen'],['Esc','Close the panel or leave fullscreen']].forEach(([a,b])=>keys.append(node('dt',a),node('dd',b)));
    body.append(keys);
  } else if(view==='notes') {
    body.append(node('p',scene.script,'script'));
    const note=node('p','Speaker timing is a guide. Advance the live presentation with the arrow keys. The timed tour runs for 4 minutes 15 seconds.','reader-foot');body.append(note);
  } else {
    body.append(node('p',scene.finding),node('h3','How to read the evidence'),node('p',scene.method),node('h3','Source documents'));
    const list=node('ul','','source-list');
    for (const key of scene.sources) {
      const [publisher,title,where,url]=sources[key];const li=document.createElement('li');const a=node('a',publisher+' · '+title);
      a.href=url;a.target='_blank';a.rel='noopener noreferrer';
      li.append(a,node('small',where));list.append(li);
    }
    body.append(list,node('p','Evidence cutoff · 19 November 2026, Bogotá. Source documents open in a new tab.','reader-foot'));
  }
  reader.scrollTop=0;
}
function openReader(view, trigger = document.activeElement) {
  if(film) return;
  pause(); launchButton=trigger;renderReader(view);
  if(!reader.open) reader.showModal(); $('dismiss').focus();
}
reader.addEventListener('close',()=>{if(launchButton?.isConnected) launchButton.focus({preventScroll:true});lastTimestamp=null;});
reader.addEventListener('click',event=>{const r=reader.getBoundingClientRect();if(event.target===reader&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))reader.close();});
$('dismiss').addEventListener('click',()=>reader.close());
$('evidence-button').addEventListener('click',()=>openReader('sources',$('evidence-button')));
$('source-line').addEventListener('click',()=>openReader('sources',$('source-line')));
$('chapter-button').addEventListener('click',()=>openReader('chapters',$('chapter-button')));
$('previous').addEventListener('click',()=>jump(index-1));
$('next').addEventListener('click',()=>jump(index+1));
$('play').addEventListener('click',togglePlay);

async function fullscreen() {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(root.requestFullscreen) await root.requestFullscreen();
  } catch { announce('Use your browser’s fullscreen control to present.'); }
}
if(!root.requestFullscreen) { $('fullscreen').hidden=true; document.querySelector('.mast-divider').hidden=true; }
$('fullscreen').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Leave fullscreen':'Enter fullscreen');});
document.addEventListener('keydown',e=>{
  if(film||e.altKey||e.ctrlKey||e.metaKey||e.isComposing) return;
  if(reader.open) return;
  if(e.key===' ' && e.target.closest?.('button,a')) return;
  const k=e.key.toLowerCase();
  if(k==='arrowright'||k==='pagedown'||k===' ') {e.preventDefault();jump(index+1);}
  else if(k==='arrowleft'||k==='pageup'){e.preventDefault();jump(index-1);}
  else if(k==='home'||k==='end'){e.preventDefault();jump(k==='home'?0:scenes.length-1);}
  else if(k==='k'){e.preventDefault();togglePlay();}
  else if(k==='n'||k==='s'||k==='g'||k==='?'){e.preventDefault();openReader(k==='n'?'notes':k==='s'?'sources':'chapters');}
  else if(k==='f'){e.preventDefault();fullscreen();}
});
let touch=null;
$('stage').addEventListener('touchstart',e=>{if(!e.target.closest('button') && e.touches.length===1)touch=[e.touches[0].clientX,e.touches[0].clientY];else touch=null;},{passive:true});
$('stage').addEventListener('touchend',e=>{if(!touch||reader.open)return;const end=e.changedTouches[0],dx=end.clientX-touch[0],dy=end.clientY-touch[1];if(Math.abs(dx)>64 && Math.abs(dx)>2*Math.abs(dy))jump(index+(dx<0?1:-1));touch=null;},{passive:true});
document.addEventListener('visibilitychange',()=>{lastTimestamp=null;if(document.hidden&&!film)pause();});
motion.addEventListener('change',()=>{reduced=motion.matches;root.dataset.motion=reduced?'reduce':'full';world?.setReducedMotion(reduced);});
new ResizeObserver(()=>{world?.resize();if(index>=0)paintWorld(visualTime);}).observe($('world-pane'));
window.addEventListener('hashchange',()=>{const i=scenes.findIndex(s=>s.id===location.hash.slice(1));if(!film && i>=0 && i!==index)jump(i);});

installNavigation();
const entry = film ? 0 : Math.max(0,scenes.findIndex(s=>s.id===location.hash.slice(1)));
selectScene(entry,{instant:true,hash:false});elapsed=starts[entry];paintPlay();paintClock();
if (film) {
  window.powerFilm = Object.freeze({
    duration,
    scenes: scenes.map((s,i)=>({id:s.id,start:starts[i],seconds:s.seconds})),
    seek(time) {
      if (!Number.isFinite(time)) throw TypeError('Frame time must be a finite number.');
      visualTime=position(time,true,true);
      paintWorld(visualTime);paintClock();
    }
  });
} else requestAnimationFrame(frame);
