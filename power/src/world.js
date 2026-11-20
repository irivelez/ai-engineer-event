import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sat = x => THREE.MathUtils.clamp(x, 0, 1);
const ease = x => { const t = sat(x); return t * t * (3 - 2 * t); };

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function softboxEnvironment(renderer) {
  // Broad studio reflection cards give the blade and galvanized steel distinct edges.
  const map = canvasTexture(512, 256, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    [[0,'#73879c'],[.27,'#404f62'],[.47,'#151c26'],[.54,'#46372e'],[.68,'#1a1717'],[1,'#11151a']].forEach(([v,c]) => sky.addColorStop(v,c));
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#fff4de'; ctx.fillRect(22,45,86,34);
    ctx.fillStyle = '#f1f4ff'; ctx.fillRect(310,80,117,9);
    ctx.fillStyle = '#98b2ca'; ctx.fillRect(155,25,43,91);
    ctx.fillStyle = '#d9ad90'; ctx.fillRect(421,58,14,82);
  });
  map.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(map);
  pmrem.dispose(); map.dispose();
  return target;
}

function buildKit() {
  const geometry = {
    block: new THREE.BoxGeometry(1,1,1),
    bevel: new RoundedBoxGeometry(1,1,1,2,.07),
    round: new THREE.CylinderGeometry(1,1,1,28),
    rod: new THREE.CylinderGeometry(1,1,1,8),
    ball: new THREE.SphereGeometry(1,16,10),
    nut: new THREE.CylinderGeometry(1,1,1,6),
    plane: new THREE.PlaneGeometry(1,1),
  };
  const standard = (color,metalness,roughness,props = {}) => new THREE.MeshStandardMaterial({color,metalness,roughness,...props});
  const surfaces = {
    iron: standard(0x303945,.69,.46), steel: standard(0x9babaf,.79,.30),
    tin: standard(0xbac4c6,.63,.42), ceramic: standard(0x37414c,.24,.22),
    copper: standard(0xe3975f,.87,.27), bronze: standard(0x8c522e,.76,.40),
    concrete: standard(0x96978c,.09,.73), coal: standard(0x17222b,.35,.48),
    rock: standard(0x484d4a,.16,.77), shale: standard(0x293338,.2,.72),
    soil: standard(0x87715c,.08,.83), water: standard(0x215965,.51,.24),
    enamel: standard(0x3b5360,.49,.35), tile: standard(0x92999a,.25,.57),
    gold: standard(0xb88e51,.78,.36), foil: standard(0xd0ac70,.77,.30),
    glass: standard(0x163547,.65,.24),
    lamp: standard(0xf0cca0,.3,.35,{emissive:0xe28e41,emissiveIntensity:.85}),
  };
  const extras = [], textures = [];
  function keepGeo(g) { extras.push(g); return g; }
  function keepMat(m) { extras.push(m); return m; }
  function texture(w,h,cb) { const t = canvasTexture(w,h,cb); textures.push(t); return t; }
  // Tool marks follow a single brushing direction. Fixed seeds keep every frame reproducible.
  let seed=173;
  function random() {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const brush=texture(256,128,(ctx,w,h)=>{
    ctx.fillStyle='#d4d4d4';ctx.fillRect(0,0,w,h);
    for(let i=0;i<1000;i++) {
      const tone=145+Math.floor(random()*100);
      ctx.fillStyle='rgba('+tone+','+tone+','+tone+',.48)';
      ctx.fillRect(random()*w,random()*h,random()*100+5,.6);
    }
  });
  for(const m of [surfaces.copper,surfaces.bronze,surfaces.tin]) {
    m.roughnessMap=brush; m.bumpMap=brush;m.bumpScale=.006;
  }
  const aggregate=texture(192,192,(ctx,w,h)=>{
    ctx.fillStyle='#dfdfdf';ctx.fillRect(0,0,w,h);
    for(let i=0;i<12500;i++) {
      const tone=143+Math.floor(random()*100);
      ctx.fillStyle='rgb('+tone+','+tone+','+tone+')';
      ctx.fillRect(random()*w,random()*h,random()*1.8+.4,random()*1.3+.5);
    }
  });
  aggregate.wrapS=aggregate.wrapT=THREE.RepeatWrapping;aggregate.repeat.set(3,2);
  for(const m of [surfaces.rock,surfaces.soil,surfaces.concrete]) {m.map=aggregate;m.bumpMap=aggregate;m.bumpScale=.019;}
  function mesh(parent, geo, material, x=0,y=0,z=0, sx=1,sy=1,sz=1) {
    const o = new THREE.Mesh(geo,material);
    o.position.set(x,y,z); o.scale.set(sx,sy,sz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  const box = (p,m,x,y,z,w,h,d,rounded=false) => mesh(p,rounded ? geometry.bevel : geometry.block,m,x,y,z,w,h,d);
  const cyl = (p,m,x,y,z,r,h,shape='round') => mesh(p,geometry[shape],m,x,y,z,r,h,r);
  function group(p,x=0,y=0,z=0) { const g = new THREE.Group(); p.add(g); g.position.set(x,y,z); return g; }
  function bar(p,m,a,b,r) {
    const av = V(...a), bv = V(...b), delta = bv.clone().sub(av), mid = av.add(bv).multiplyScalar(.5);
    const rod = cyl(p,m,mid.x,mid.y,mid.z,r,delta.length(),'rod');
    rod.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize()); return rod;
  }
  function pipe(p,m,points,r) {
    for (let i = 1; i < points.length; i++) bar(p,m,points[i-1],points[i],r);
  }
  function insulator(p,x,y,z,r,h) {
    const profile = [[.62,0],[.70,.025],[.69,.065]];
    for (let i=0;i<7;i++) { const t=.08+i*.118; profile.push([.49,t],[.94,t+.018],[1,t+.043],[.92,t+.057],[.54,t+.078]); }
    profile.push([.54,.941],[.65,.967],[.62,1]);
    if (!geometry.insulator) geometry.insulator = new THREE.LatheGeometry(profile.map(([a,b])=>new THREE.Vector2(a,b)),40);
    return mesh(p,geometry.insulator,surfaces.ceramic,x,y,z,r,h,r);
  }
  function compile(root) {
    // Collapse repeated hard-surface parts by geometry/material; articulated pieces live separately.
    root.updateWorldMatrix(true,true);
    const inverse = root.matrixWorld.clone().invert(), matrix = new THREE.Matrix4(), batches = new Map();
    root.traverse(o => {
      if (!o.isMesh) return;
      const key = o.geometry.uuid + o.material.uuid;
      if (!batches.has(key)) batches.set(key,[]);
      batches.get(key).push({ o, matrix:matrix.multiplyMatrices(inverse,o.matrixWorld).clone() });
    });
    root.clear();
    for (const items of batches.values()) {
      const {o} = items[0];
      const batch = new THREE.InstancedMesh(o.geometry,o.material,items.length);
      items.forEach((entry,i) => batch.setMatrixAt(i,entry.matrix));
      batch.castShadow = o.castShadow; batch.receiveShadow = o.receiveShadow;
      batch.computeBoundingSphere(); root.add(batch);
    }
  }
  function dispose() { [...Object.values(geometry),...Object.values(surfaces),...extras,...textures].forEach(item=>item.dispose()); }
  return {geometry, s:surfaces, standard, keepGeo,keepMat,texture,mesh,box,cyl,group,bar,pipe,insulator,compile,dispose};
}

function panelMaterial(k) {
  const map = k.texture(384,256,(c,w,h) => {
    c.fillStyle='#98a7aa'; c.fillRect(0,0,w,h);
    c.fillStyle='#25394c'; c.fillRect(5,5,w-10,h-10);
    for (let y=0;y<4;y++) for(let x=0;x<8;x++) {
      const a=7+x*46.3,b=8+y*60.1;
      const hue=211+(x*7+y*11)%13, v=24+(x*3+y*17)%9;
      const grad=c.createLinearGradient(a,b,a+44,b+57);
      grad.addColorStop(0,'hsl('+hue+' 41% '+v+'%)');
      grad.addColorStop(1,'hsl('+hue+' 38% '+(v-6)+'%)');
      c.fillStyle=grad;
      c.beginPath(); c.moveTo(a+3,b); c.lineTo(a+42,b); c.lineTo(a+45,b+3); c.lineTo(a+45,b+54);
      c.lineTo(a+42,b+57);c.lineTo(a+3,b+57);c.lineTo(a,b+54);c.lineTo(a,b+3);c.closePath();c.fill();
      c.fillStyle='rgba(187,211,211,.46)';
      c.fillRect(a+14,b,1,57);c.fillRect(a+30,b,1,57);
      c.fillStyle='rgba(215,224,222,.14)';
      for (let line=0;line<12;line++) c.fillRect(a+2,b+line*4.5+3,41,.7);
    }
  });
  return k.keepMat(k.standard(0xffffff,.49,.37,{map}));
}

function coolingFan(p,k,x,y,z,r) {
  const {s,cyl,box,group}=k, hub=group(p,x,y,z);
  cyl(hub,s.iron,0,0,0,r,.055);
  cyl(hub,s.coal,0,.037,0,r*.84,.017);
  for(let j=0;j<5;j++) {
    const a=j*TAU/5;
    const blade=box(hub,s.steel,Math.sin(a)*r*.34,.055,Math.cos(a)*r*.34,r*.22,.018,r*.53,true);
    blade.rotation.y=a+.32;
  }
  cyl(hub,s.iron,0,.079,0,r*.14,.05);
}

function building(p,k,x,y,z,scale=1,cutaway=true) {
  const {s,box,group}=k, g=group(p,x,y,z); g.scale.setScalar(scale);
  box(g,s.tile,0,.10,0,3.72,.20,2.32,true);
  box(g,s.enamel,0,.70,-.98,3.42,1.20,.13);
  for(let x=-1.53;x<1.62;x+=.23) box(g,s.tin,x,.72,-1.056,.042,1.1,.035);
  for(const side of [-1,1]) box(g,s.iron,side*1.70,.7,0,.105,1.2,2.02);
  box(g,s.tin,0,1.38,cutaway ? -.39 : 0,3.64,.115,cutaway ? 1.40 : 2.2,true);
  for(let i=0;i<3;i++) coolingFan(g,k,-1+i,1.49,-.45,.32);
  for(let i=0;i<5;i++) {
    const rx=-1.30+i*.64;
    box(g,s.coal,rx,.71,.31,.53,.98,.72,true);
    box(g,s.iron,rx,.73,.684,.45,.83,.035);
    for(let j=0;j<7;j++) {
      box(g,s.steel,rx,.37+j*.105,.711,.34,.025,.024);
      if(j%3===0) box(g,s.lamp,rx+.17,.39+j*.105,.716,.026,.023,.029);
    }
  }
  return g;
}

function tower(p,k,x,y,z,height) {
  const {s,bar,cyl}=k;
  const local=k.group(p,x,y,z); local.scale.setScalar(height/3.0);
  const levels=[[0,.49],[1.00,.32],[1.88,.18],[2.50,.12],[2.90,.03]];
  for(let i=1;i<levels.length;i++) {
    const [a,aw]=levels[i-1],[b,bw]=levels[i];
    for(const dx of [-1,1]) for(const dz of [-1,1]) {
      bar(local,s.steel,[aw*dx,a,aw*dz],[bw*dx,b,bw*dz],.026);
      if(i<=3) {
        bar(local,s.tin,[aw*dx,a,aw*dz],[-bw*dx,b,bw*dz],.014);
        bar(local,s.tin,[aw*dx,a,aw*dz],[bw*dx,b,-bw*dz],.014);
      }
    }
  }
  const sockets=[];
  for (let lane=0;lane<3;lane++) {
    const offset=[-.58,0,.58][lane], yy=lane===1 ? 2.93 : 2.50;
    bar(local,s.steel,[0,yy-.28,0],[0,yy,offset],.025);
    bar(local,s.steel,[0,yy,0],[0,yy,offset],.028);
    for(let i=0;i<3;i++) cyl(local,s.ceramic,0,yy-.04-i*.036,offset,.072,.023);
    sockets.push([x,y+(yy-.13)*height/3,z+offset*height/3]);
  }
  return sockets;
}

function flowScene(k) {
  const scene=new THREE.Scene(), root=k.group(scene), parts=k.group(root);
  const {s,box,cyl,mesh,group,bar,pipe}=k;
  // Three adjacent ground sections form a single cutaway of the power system.
  box(parts,s.shale,0,-.45,0,11.0,.78,4.55,true);
  box(parts,s.rock,0,-.062,0,10.94,.11,4.50);
  box(parts,s.concrete,-3.72,.03,.02,3.30,.13,3.89);
  box(parts,s.water,-4.21,.58,-1.19,2.47,.96,1.36,true);
  // Water retained behind a sloped dam, penstocks terminating in the turbine hall.
  box(parts,s.concrete,-4.14,.78,-.46,2.66,1.28,.33,true).rotation.x=-.13;
  box(parts,s.tin,-4.14,1.405,-.53,2.79,.075,.35,true);
  for(let i=0;i<4;i++) {
    const x=-5.12+i*.63;
    box(parts,s.concrete,x,.61,-.21,.13,.91,.44).rotation.x=-.22;
    pipe(parts,s.tin,[[x,.94,-.25],[x,.91,-.02],[x,.38,.51],[x,.38,.86]],.125);
    box(parts,s.shale,x,.21,1.0,.41,.36,.54,true);
  }
  box(parts,s.enamel,-4.17,.45,1.26,2.74,.70,.71,true);
  box(parts,s.tin,-4.17,.82,1.29,2.86,.10,.80,true);
  for(let i=0;i<10;i++) box(parts,s.glass,-5.31+i*.255,.51,1.62,.160,.25,.026);
  // Tower sockets are the shared endpoints for all sagged phase conductors.
  const towers=[tower(parts,k,-2.62,.08,-.67,2.9),tower(parts,k,.0,.03,-.57,2.65),tower(parts,k,2.02,.08,-.55,2.10)];
  // Maintenance access, switchyard gravel, and retaining-wall joints establish human scale.
  box(parts,s.shale,-.34,.021,.83,3.09,.051,1.25);
  for(let i=0;i<18;i++) box(parts,s.rock,-1.75+i*.164,.058,.83,.047,.038,1.19);
  for(let i=0;i<4;i++) box(parts,s.iron,-5.10+i*.65,1.06,-.65,.09,.63,.08);
  for(const z of [-.78,-.58]) bar(parts,s.steel,[-5.22,1.70,z],[-3.10,1.70,z],.021);
  for(let i=0;i<6;i++) bar(parts,s.steel,[-5.2+i*.42,1.43,-.59],[-5.2+i*.42,1.70,-.59],.017);
  for(const z of [.03,1.71]) {
    for(let i=0;i<7;i++) box(parts,s.steel,.79+i*.28,.24,z,.024,.38,.025);
    bar(parts,s.iron,[.78,.30,z],[2.49,.30,z],.016);
  }
  const phasePaths=[];
  for(let lane=0;lane<3;lane++) {
    const lanePoints=[];
    for(let i=0;i<towers.length-1;i++) {
      const a=V(...towers[i][lane]), b=V(...towers[i+1][lane]);
      for(let j=0;j<=10;j++) {
        if(i && j===0) continue;
        const t=j/10, v=a.clone().lerp(b,t);
        v.y-=.25*4*t*(1-t); lanePoints.push(v.toArray());
      }
    }
    pipe(parts,s.bronze,lanePoints,.022);
    phasePaths.push(lanePoints);
  }
  box(parts,s.concrete,1.68,.065,.85,1.77,.14,1.74);
  box(parts,s.enamel,1.69,.54,.75,.91,.78,.75,true);
  for(let i=0;i<10;i++) box(parts,s.tin,1.18+i*.112,.55,1.16,.052,.73,.27);
  for(let i=0;i<3;i++) {
    k.insulator(parts,1.45+i*.22,.94,.72,.077,.30);
    pipe(parts,s.bronze,[towers[2][i],[1.45+i*.22,1.27,.72]],.022);
  }
  pipe(parts,s.bronze,[[-4.02,.82,1.37],[-3.31,1.01,1.37],[-2.62,.99,.16],towers[0][1]],.039);
  building(parts,k,3.98,.03,.33,.77,true);
  pipe(parts,s.bronze,[[1.91,.93,.75],[2.26,.93,.75],[2.26,.19,1.54],[3.07,.19,1.54],[3.07,.19,.86]],.057);
  k.compile(parts);
  const route=[[-4.02,.82,1.37],[-3.31,1.01,1.37],[-2.62,.99,.16],...phasePaths[1],[1.67,1.27,.72]];
  const routes=[route.slice(0,4),route.slice(3),[[1.91,.93,.75],[2.26,.93,.75],[2.26,.19,1.54],[3.07,.19,1.54],[3.07,.19,.86]]];
  const paths=routes.map(points=>{
    const path=new THREE.CurvePath();
    for(let i=1;i<points.length;i++) path.add(new THREE.LineCurve3(V(...points[i-1]),V(...points[i])));
    return path;
  });
  const packets=Array.from({length:3},()=>mesh(root,k.geometry.ball,s.lamp,0,0,0,.059,.059,.059));
  // A short, unlabelled copper inlay under the selected area anchors each step.
  const position=[-3.9,0,3.65];
  const strip=box(root,s.copper,position[0],.014,2.15,1.95,.045,.075);
  const glow=new THREE.PointLight(0xffba76,17,5,2); root.add(glow);
  const point=V();
  return {scene,root,view:[6.4,7.9,13.9],target:[0,.68,0],width:12.95,height:6.75,step:0,
    tick(t) {
      const selected=this.step, path=paths[selected];
      strip.position.x=position[selected]; glow.position.set(position[selected],1.95,1.50);
      packets.forEach((packet,i)=>{ path.getPoint((t*.19+i/3)%1,point); packet.position.copy(point); });
    }};
}

function solarScene(k,panel) {
  const scene=new THREE.Scene(), root=k.group(scene), parts=k.group(root);
  const {s,box,group,mesh,pipe}=k;
  // A low desert terrace and its west-to-east service lane make the field's layout legible.
  box(parts,s.shale,0,-.38,0,12.0,.72,7.32,true);
  box(parts,s.soil,0,-.027,0,11.95,.12,7.29);
  box(parts,s.concrete,2.65,.045,0,.50,.025,7.24);
  const pv=k.keepGeo(new THREE.PlaneGeometry(1,1));
  for(let row=0;row<8;row++) for(let col=0;col<7;col++) {
    const x=-5.16+col*1.11,z=-2.99+row*.85;
    const station=group(parts,x,.42,z);
    station.rotation.x=-Math.PI/2+.42;
    box(station,s.iron,0,0,-.037,1.06,.695,.055);
    mesh(station,pv,panel,0,0,.002,1.038,.675,1);
    for(const a of [-.37,.37]) box(parts,s.tin,x+a,.22,z,.042,.39,.042);
  }
  building(parts,k,4.38,.07,1.28,.70,false);
  building(parts,k,4.38,.07,-1.56,.70,false);
  for(let i=0;i<4;i++) {
    const z=-2.56+i*1.69;
    box(parts,s.enamel,2.23,.28,z,.32,.45,.46,true);
    pipe(parts,s.bronze,[[1.99,.23,z],[2.15,.23,z],[2.15,.081,z+.35],[2.40,.081,z+.35]],.03);
  }
  // A shallow escarpment behind the array carries physical relief into the horizon.
  const width=11.87, depth=1.12;
  const geo=new THREE.PlaneGeometry(width,depth,50,8); geo.rotateX(-Math.PI/2);
  const vertex=geo.attributes.position;
  for(let i=0;i<vertex.count;i++) {
    const x=vertex.getX(i),z=vertex.getZ(i), n=sat((depth*.5-z)/depth);
    const h=n*(.19+.22*Math.sin(x*.84)+.11*Math.sin(2.08*x+.5)) + .045*Math.sin(x*5+z*7);
    vertex.setY(i,h);
  }
  geo.computeVertexNormals(); mesh(parts,k.keepGeo(geo),s.soil,0,.08,-3.14);
  k.compile(parts);
  return {scene,root,view:[6.85,7.7,11.2],target:[0,.20,0],width:14.55,height:8.7,
    tick(t) { root.rotation.y=.022*Math.sin(t*.12); }};
}

const earthVertex=`
varying vec2 vUv;
void main() { vUv=uv; gl_Position=vec4(position.xy,0.99999,1.0); }
`;
const earthFragment=`
uniform float aspect;
uniform float time;
varying vec2 vUv;

float hash(vec3 p) {
  p=fract(p*0.3183099+vec3(.17,.13,.21));
  p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float noise3(vec3 p) {
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  float a=.54, v=0.;
  for(int i=0;i<4;i++){v+=a*noise3(p);p=p*2.1+vec3(2.1,-3.7,1.4);a*=.47;}
  return v;
}
void main() {
  vec2 p=vec2((vUv.x-.40)*aspect,vUv.y+.86);
  float radius=1.22, d=length(p), inside=radius-d;
  float rim=exp(-abs(inside)*150.);
  vec3 dark=mix(vec3(.008,.014,.025),vec3(.030,.054,.081),1.-vUv.y);
  vec3 col=dark;
  if(inside>=0.) {
    vec3 n=vec3(p/radius,sqrt(max(0.,1.-dot(p,p)/(radius*radius))));
    vec3 q=n*4.1+vec3(-2.,3.,5.);
    q.x+=time*.0009;
    float land=fbm(q*1.45+vec3(fbm(q*4.2)*.61));
    float coastline=smoothstep(.51,.528,land);
    vec3 sea=mix(vec3(.045,.16,.23),vec3(.10,.26,.36),noise3(q*8.));
    vec3 earth=mix(sea,mix(vec3(.215,.265,.24),vec3(.44,.40,.31),fbm(q*9.)),coastline);
    vec3 wind=q*vec3(3.,9.,4.)+vec3(fbm(q*4.)*2.7,fbm(q*2.)*3.0,0.);
    float cloud=smoothstep(.43,.69,fbm(wind));
    float wisps=smoothstep(.60,.78,fbm(wind*2.7))*.24;
    earth=mix(earth,vec3(.72,.76,.75),cloud*.78+wisps);
    float sunlight=.28+.82*smoothstep(-.38,.78,dot(n,normalize(vec3(-.80,.81,.25))));
    col=earth*sunlight;
    col=mix(col,vec3(.32,.53,.72),pow(1.-n.z,4.)*.67);
  } else {
    vec2 cell=fract(vUv*vec2(440.*aspect,440.))-.5;
    float stars=step(.9967,hash(vec3(floor(vUv*vec2(440.*aspect,440.)),25.)));
    col+=vec3(.39,.44,.51)*stars*(1.-smoothstep(.07,.34,length(cell)));
  }
  col+=rim*vec3(.18,.38,.56);
  gl_FragColor=vec4(col,1.);
}
`;

function orbitScene(k,panel) {
  const scene=new THREE.Scene(),root=k.group(scene),craft=k.group(root,0,.68,0),body=k.group(craft);
  const {s,mesh,box,cyl,group,bar,pipe}=k;
  const bgMat=k.keepMat(new THREE.ShaderMaterial({uniforms:{aspect:{value:1},time:{value:0}},vertexShader:earthVertex,fragmentShader:earthFragment,depthWrite:false,depthTest:false}));
  const bg=mesh(scene,k.keepGeo(new THREE.PlaneGeometry(2,2)),bgMat); bg.frustumCulled=false; bg.renderOrder=-100;bg.castShadow=false;bg.receiveShadow=false;
  // Bus, thermal blankets, heat rejection fins, avionics crates and articulated wing roots.
  box(body,s.gold,0,0,0,1.68,1.60,1.38,true);
  box(body,s.iron,0,0,.701,1.47,1.42,.075,true);
  for(let j=0;j<6;j++) {
    box(body,s.tin,0,-.58+j*.228,.76,1.30,.119,.09,true);
    box(body,s.coal,.06,-.583+j*.228,.811,.86,.033,.021);
  }
  for(const sign of [-1,1]) {
    for(let i=0;i<7;i++) box(body,s.tin,sign*(.88+i*.044),0,-.13,.023,1.26,.84);
    // Edge fasteners, golden multilayer insulation, grounding straps and retention rails.
    for(const y of [-.57,-.19,.19,.57]) {
      const fixing=cyl(body,s.copper,sign*.673,y,.761,.035,.031,'nut');fixing.rotation.x=Math.PI/2;
    }
    for(const z of [-.46,.38]) {
      pipe(body,s.copper,[[sign*.77,.69,z],[sign*.90,.87,z],[sign*.32,.93,z],[sign*.25,.81,z]],.023);
    }
    const joint=cyl(body,s.copper,sign*1.14,0,0,.14,.57);joint.rotation.z=Math.PI/2;
    for(const ring of [1.02,1.18,1.29]) {
      const collar=cyl(body,s.iron,sign*ring,0,0,.154,.042);collar.rotation.z=Math.PI/2;
    }
    for(let n=0;n<2;n++) {
      const cx=sign*(2.03+1.25*n);
      box(body,s.tin,cx,0,0,1.24,1.67,.09,true);
      mesh(body,k.geometry.plane,panel,cx,0,.055,1.17,1.60,1);
      for(const y of [-.74,.74]) box(body,s.gold,cx,y,-.07,1.23,.045,.07);
    }
  }
  // Thermal blanket facets catch the sunlight with the characteristic irregularity of crimped foil.
  const blanket=k.keepGeo(new THREE.PlaneGeometry(1.43,1.12,12,10).toNonIndexed());
  const pos=blanket.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i);
    pos.setZ(i,.038*Math.sin(x*28+y*14)*Math.sin(x*17-y*23)+.016*Math.cos(y*41));
  }
  blanket.computeVertexNormals();
  const wrap=mesh(body,blanket,s.foil,0,.819,-.02);wrap.rotation.x=-Math.PI/2;
  for(const x of [-.46,.03,.54]) {
    box(body,s.iron,x,.87,.16,.15,.085,.26,true);
    const lens=cyl(body,s.glass,x,.927,.18,.056,.049);lens.rotation.x=.28;
  }
  for(const y of [-.45,-.215,.015,.25,.49]) {
    for(let i=0;i<8;i++) box(body,s.iron,-.52+i*.038,y,.815,.013,.037,.014);
    const screw=cyl(body,s.copper,.57,y,.81,.023,.021,'nut');screw.rotation.x=Math.PI/2;
  }
  // The dish, with an offset three-leg feed, silhouettes cleanly in the lower right.
  const dish=group(body,.63,-.73,.58);dish.rotation.x=.35;dish.rotation.z=-.48;
  const profile = [[0,.13],[.14,.10],[.30,.045],[.45,-.035],[.56,-.12],[.56,-.17],[.44,-.085],[.27,.00],[.11,.047],[0,.056]];
  mesh(dish,k.keepGeo(new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),44)),s.tin);
  for(let i=0;i<3;i++) {
    const a=i*TAU/3;bar(dish,s.steel,[.47*Math.cos(a),-.10,.47*Math.sin(a)],[0,-.51,0],.020);
  }
  cyl(dish,s.copper,0,-.54,0,.070,.13);
  pipe(body,s.tin,[[-.37,.77,-.28],[-.37,1.05,-.28],[-.76,1.05,-.28]],.035);
  const aerial=group(body,-.75,1.07,-.28);
  for(let i=0;i<4;i++) {const cross=bar(aerial,s.steel,[-.12,0,0],[.12,0,0],.018);cross.rotation.y=i*.78;}
  k.compile(body);
  const dots=Array.from({length:3},()=>mesh(root,k.geometry.ball,s.tin,0,0,0,.025,.025,.025));
  const origin=V(), dest=V(1.7,-2.08,-.38),socket=group(craft,.95,-1.11,.91);
  return {scene,root,view:[0,0,13],target:[0,0,0],width:8.6,height:5.55,
    layout(aspect){bgMat.uniforms.aspect.value=aspect;},
    tick(t) {
      craft.rotation.set(.10+Math.sin(t*.17)*.035,-.34+Math.sin(t*.09)*.08,.19+Math.sin(t*.10)*.035);
      craft.position.y=.59+.046*Math.sin(t*.24);
      bgMat.uniforms.time.value=t;
      socket.getWorldPosition(origin);
      dots.forEach((dot,i)=>{
        const cycle=(t*.31+i*.061)%1;
        dot.visible=cycle<.73;
        dot.position.lerpVectors(origin,dest,Math.min(1,cycle/.73));
      });
    }};
}

function closeScene(k) {
  const scene=new THREE.Scene(),root=k.group(scene),parts=k.group(root);
  const {s,mesh,box,cyl,group}=k;
  box(parts,s.iron,0,-.28,0,6.44,.43,2.32,true);
  box(parts,s.coal,0,-.52,0,6.14,.11,2.07,true);
  for(const x of [-2.08,2.08]) {
    box(parts,s.steel,x,.005,0,1.36,.18,1.40,true);
    for (const dx of [-.51,.51]) for(const dz of [-.55,.55]) {
      cyl(parts,s.iron,x+dx,.134,dz,.103,.084,'nut');
      cyl(parts,s.tin,x+dx,.173,dz,.052,.050);
    }
    k.insulator(parts,x,.13,0,.60,1.53);
    cyl(parts,s.tin,x,1.69,0,.39,.14);
    box(parts,s.bronze,x,1.84,0,.84,.20,.71,true);
    cyl(parts,s.iron,x,1.956,0,.116,.046,'nut');
  }
  // Two jaws, flared lips, and a visible air gap supply the silhouette at phone size.
  for(const sign of [-1,1]) {
    box(parts,s.copper,2.08,2.13,sign*.19,.62,.50,.13,true);
    box(parts,s.copper,2.08,2.396,sign*.224,.63,.147,.13,true).rotation.x=sign*.41;
    box(parts,s.bronze,-2.08,2.06,sign*.25,.52,.51,.12,true);
    const hinge=cyl(parts,s.steel,-2.08,2.13,sign*.335,.144,.107,'nut');hinge.rotation.x=Math.PI/2;
  }
  const tongue=group(root,-2.08,2.13,0), moving=group(tongue);
  box(moving,s.copper,2.025,0,0,4.33,.229,.28,true);
  box(moving,s.bronze,1.90,-.102,0,3.54,.059,.238,true);
  for(const x of [.17,.44,3.68]) {
    const bolt=cyl(moving,s.steel,x,0,.159,.075,.038,'nut');bolt.rotation.x=Math.PI/2;
  }
  const contact=box(moving,s.tin,4.07,-.07,0,.24,.09,.235,true);
  contact.rotation.z=-.02;
  // Horizontal ridges pick up narrow glints on the contact rails.
  for(let i=0;i<5;i++) box(parts,s.bronze,2.07,1.91+i*.071,.265,.51,.021,.022);
  for(const x of [-2.08,2.08]) {
    // The end lugs accept flat busbars with pairs of bolted pressure pads.
    const dir=Math.sign(x);
    box(parts,s.copper,x+dir*.60,1.785,0,.61,.13,.49,true);
    for(const dz of [-.145,.145]) {
      cyl(parts,s.tin,x+dir*.71,1.862,dz,.076,.038);
      cyl(parts,s.iron,x+dir*.71,1.900,dz,.063,.061,'nut');
    }
    const pin=cyl(parts,s.tin,x,2.13,-.38,.096,.21);
    pin.rotation.x=Math.PI/2;
  }
  // Twin machined highlight lines and a wafer-thin seam remain readable in a raked light.
  for(const z of [-.125,.125]) box(moving,s.copper,2.01,.110,z,3.99,.021,.026,true);
  k.compile(parts);k.compile(moving);
  return {scene,root,view:[3.1,3.8,12.0],target:[0,1.22,0],width:7.16,height:5.15,
    tick(t,reduced) {
      const closed=reduced ? 1 : ease((t-.95)/1.70);
      tongue.rotation.z=(1-closed)*.34;
    }};
}

function lighting(world,k,environment,id) {
  const {scene}=world;
  scene.environment=environment;
  scene.environmentIntensity=id==='orbit' ? .75 : .93;
  scene.background=new THREE.Color(0x080c10);
  const sky=new THREE.HemisphereLight(0xe1ecf6,0x514034,1.10);
  const key=new THREE.DirectionalLight(id==='solar' ? 0xffcd91 : 0xffe4c3,3.35);
  key.position.set(-6.3,9.5,6.1); scene.add(sky,key);
  const rim=new THREE.DirectionalLight(0xbddcff,2.43); rim.position.set(5.3,5.3,-5.9);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xb5cbd7,.62);fill.position.set(3.7,2.1,8.2);scene.add(fill);
  if(id==='orbit') return;
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{near:.3,far:31,left:-8,right:8,top:7,bottom:-7});
  key.shadow.normalBias=.024;key.shadow.bias=-.0005;
  const bgMat=k.keepMat(new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{warmth:{value:id==='solar' ? 1.0 : .22}},vertexShader:earthVertex,fragmentShader:`
    varying vec2 vUv;uniform float warmth;
    void main() {
      vec2 p=(vUv-vec2(.49,.51))*vec2(1.17,1.00);
      float g=exp(-dot(p,p)*4.2);
      vec3 c=mix(vec3(.018,.025,.032),vec3(.101,.128,.145),g);
      c+=vec3(.071,.037,.010)*warmth*exp(-length(vUv-vec2(.28,.66))*3.7);
      c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.004;
      gl_FragColor=vec4(c,1.);
    }`}));
  const bg=k.mesh(scene,k.keepGeo(new THREE.PlaneGeometry(2,2)),bgMat);
  bg.frustumCulled=false;bg.renderOrder=-100;bg.castShadow=false;bg.receiveShadow=false;
  // Soft contact shadow under the floating exhibits, independent of view angle.
  const shadowTex=k.texture(128,128,(ctx,w,h)=>{
    const grad=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    grad.addColorStop(0,'rgba(0,0,0,.80)');grad.addColorStop(.46,'rgba(0,0,0,.57)');grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  });
  const shadowMat=k.keepMat(new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,toneMapped:false}));
  const shadow=k.mesh(scene,k.geometry.plane,shadowMat,0,id==='close' ? -.647 : -.94,0,id==='close'?9.5:16,id==='close'?4.7:9.1,1);
  shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;shadow.receiveShadow=false;
}

export function createWorld(canvas) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.03;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const kit=buildKit(), environment=softboxEnvironment(renderer),panel=panelMaterial(kit);
  const factories={flow:()=>flowScene(kit),solar:()=>solarScene(kit,panel),orbit:()=>orbitScene(kit,panel),close:()=>closeScene(kit)};
  const worlds=new Map(), camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,100);
  let active,id, start=null, instantPose=false, reduced=false, visible=true, disposed=false,dirty=true;
  let width=1,height=1,ratio=1,pixelRatio=0,shadowSlot=-1;
  function frameCamera() {
    if(!active) return;
    const span=Math.max(active.height,active.width/ratio);
    camera.left=-span*ratio/2;camera.right=span*ratio/2;
    camera.top=span/2;camera.bottom=-span/2;
    camera.position.set(...active.view);camera.lookAt(...active.target);
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
    active.layout?.(ratio);
  }
  function resize() {
    if(disposed) return;
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)), h=Math.max(1,Math.round(rect.height));
    const dpr=Math.min(1.65,window.devicePixelRatio || 1);
    if(w===width && h===height && pixelRatio===dpr) return;
    width=w;height=h;ratio=w/h;pixelRatio=dpr;
    renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);frameCamera();dirty=true;
  }
  function setScene(next,instant=false) {
    if(disposed || !Object.hasOwn(factories,next)) return;
    if(!worlds.has(next)) {
      const world=factories[next]();lighting(world,kit,environment.texture,next);worlds.set(next,world);
    }
    active=worlds.get(next);id=next;start=null;instantPose=instant;shadowSlot=-1;dirty=true;
    resize();frameCamera();renderer.shadowMap.needsUpdate=true;
  }
  function renderFrame(seconds) {
    if(disposed || !visible || !active || (reduced && !dirty)) return;
    if(start===null) start=seconds;
    const t=reduced ? 0 : Math.max(0,seconds-start);
    active.tick(t,reduced || instantPose && id==='close');
    // Update the key-light shadow during contact travel; static exhibits reuse their map.
    if(id==='close') {
      const slot=reduced || instantPose ? 60 : Math.min(60,Math.floor(t*24));
      if(slot!==shadowSlot) renderer.shadowMap.needsUpdate=true;
      shadowSlot=slot;
    }
    renderer.render(active.scene,camera);dirty=false;
  }
  function dispose() {
    if(disposed) return;disposed=true;
    for(const world of worlds.values()) world.scene.traverse(o=>{
      if(o.isInstancedMesh) o.dispose();
      if(o.shadow) o.shadow.dispose();
    });
    kit.dispose();environment.dispose();worlds.clear();renderer.dispose();
  }
  resize();
  return {
    setScene,resize,renderFrame,dispose,
    setVisible(next) {visible=Boolean(next);if(visible) dirty=true;},
    setReducedMotion(next) {reduced=Boolean(next);start=null;dirty=true;},
    setStep(next) {if(active && id==='flow') {active.step=THREE.MathUtils.clamp(Math.round(Number(next)||0),0,2);dirty=true;}},
  };
}
