import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Check, ChevronDown, RotateCcw, Save, ShoppingBag, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import './diy-studio.css';
import { BASES, BASE_COLORS, GEM_COLORS, GEM_CATALOG, SHAPES, TIERS } from './catalog.js';

const MM = 0.04; // 1 mm = 0.04 scene units; all SKU geometry is derived from millimeters.
const AI_MIN_TOTAL = 15;
const AI_MAX_TOTAL = 100;
const AI_MAX_STONES = 100;
const complexityTotal = level => Math.round(AI_MIN_TOTAL + (Math.max(1,Math.min(10,level))-1)*(AI_MAX_TOTAL-AI_MIN_TOTAL)/9);
const AI_LOOK_NAMES = ['Prism Garden','Starlight Mix','Petal Parade','Colorwave','Berry Constellation','Jewel Mosaic','Dream Scatter','Crystal Bloom','Sunday Sparkle','Moonlit Confetti','Lucky Charm','Golden Hour'];

const clipOutline = (base,inset=0) => {
  const w=base.width*MM/2-inset, l=base.length*MM/2-inset, r=w*0.78;
  const s=new THREE.Shape();
  s.moveTo(-w+r,-l); s.lineTo(w-r,-l); s.quadraticCurveTo(w,-l,w,-l+r);
  s.lineTo(w,l-r); s.quadraticCurveTo(w,l,w-r,l); s.lineTo(-w+r,l);
  s.quadraticCurveTo(-w,l,-w,l-r); s.lineTo(-w,-l+r); s.quadraticCurveTo(-w,-l,-w+r,-l);
  return s;
};
const topZ = (x,base) => 0.08*(1-Math.pow(x/(base.width*MM/2),2));
const buildSurface=(base)=>{const inset=.008,halfW=base.width*MM/2-inset,halfL=base.length*MM/2-inset,r=halfW*.78,nx=36,ny=144,positions=[],indices=[];for(let j=0;j<=ny;j++){const y=-halfL+2*halfL*j/ny,ay=Math.abs(y);let xmax=halfW;if(ay>halfL-r){const dy=ay-(halfL-r);xmax=Math.max(0,halfW-r+Math.sqrt(Math.max(0,r*r-dy*dy)));}for(let i=0;i<=nx;i++){const x=-xmax+2*xmax*i/nx;positions.push(x,y,.145+topZ(x,base));}}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;};
const normalAt=(x,base)=>new THREE.Vector3(.16*x/Math.pow(base.width*MM/2,2),0,1).normalize().toArray();
function BaseModel({base,color,dragging,onPoint,onBeginPlacement,onEndPlacement,onLockPlacement,onCancelPlacement}) {
  const shape=useMemo(()=>clipOutline(base,.008),[base]);
  const geometry=useMemo(()=>{
    const g=new THREE.ExtrudeGeometry(shape,{depth:.135,bevelEnabled:true,bevelSegments:3,bevelSize:.008,bevelThickness:.01,curveSegments:20,steps:1});
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setZ(i,z+topZ(x,base));}
    g.computeVertexNormals(); return g;
  },[shape,base]);
  const surface=useMemo(()=>buildSurface(base),[base]);
  const hardwareZ=topZ(0,base)-.025;
  return <group>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={.14} metalness={.015} clearcoat={1} clearcoatRoughness={.065} envMapIntensity={1.15}/></mesh>
    <mesh geometry={surface} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={.14} metalness={.015} clearcoat={1} clearcoatRoughness={.065} envMapIntensity={1.15} side={THREE.DoubleSide}/></mesh>
    <mesh onPointerDown={()=>dragging&&onBeginPlacement()} onPointerMove={e=>dragging&&onPoint(e)} onPointerUp={e=>{if(dragging){onPoint(e);onEndPlacement()}}} onClick={()=>dragging&&onLockPlacement()} onDoubleClick={e=>{e.stopPropagation();onCancelPlacement()}}>
      <shapeGeometry args={[shape,32]} onUpdate={g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,.145+topZ(p.getX(i),base));p.needsUpdate=true;g.computeVertexNormals()}}/><meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide}/>
    </mesh>
    <group>
      <mesh position={[0,0,hardwareZ-.012]} castShadow><boxGeometry args={[base.width*MM*.27,base.length*MM*.68,.024]}/><meshStandardMaterial color="#d2a158" metalness={.84} roughness={.22}/></mesh>
      <mesh position={[0,0,hardwareZ-.027]} castShadow><capsuleGeometry args={[.014,base.length*MM*.72,6,10]}/><meshStandardMaterial color="#f0cc83" metalness={.78} roughness={.2}/></mesh>
      {[-1,1].map(end=><mesh key={end} position={[0,end*base.length*MM*.33,hardwareZ-.026]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.034,.034,base.width*MM*.43,16]}/><meshStandardMaterial color="#d2a158" metalness={.84} roughness={.2}/></mesh>)}
      <mesh position={[0,base.length*MM*.245,hardwareZ-.01]} castShadow><boxGeometry args={[base.width*MM*.35,.12,.026]}/><meshStandardMaterial color="#ebc477" metalness={.82} roughness={.2}/></mesh>
    </group>
  </group>;
}

const unitPoly=(gem)=>{
  const n=gem.shape==='round'?32:gem.shape==='oval'||gem.shape==='teardrop'||gem.shape==='pear'||gem.shape==='marquise'?24:gem.shape==='heart'?32:gem.shape==='flower'?40:gem.shape==='star'?10:gem.shape==='irregular'?9:gem.shape==='hexagon'?6:gem.shape==='octagon'?8:4;
  if(gem.shape==='heart') return Array.from({length:n},(_,i)=>{const t=Math.PI*2*i/n;return [16*Math.pow(Math.sin(t),3)/17, (13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17]});
  if(gem.shape==='star'||gem.shape==='flower'||gem.shape==='irregular')return Array.from({length:n},(_,i)=>{let a=Math.PI*2*i/n-Math.PI/2;let r=gem.shape==='star'?(i%2?.47:1):gem.shape==='flower'?(i%2?.69:1):[1,.73,.94,.61,.86,.7,.98,.63,.81][i];return [Math.cos(a)*r,Math.sin(a)*r]});
  if(gem.shape==='marquise')return Array.from({length:n},(_,i)=>{let t=Math.PI*2*i/n;return [Math.cos(t)*Math.pow(Math.abs(Math.cos(t)),1.8),Math.sin(t)*.55]});
  if(gem.shape==='teardrop'||gem.shape==='pear')return Array.from({length:n},(_,i)=>{let t=Math.PI*2*i/n;return [Math.sin(t)*(0.72+0.28*Math.cos(t)),Math.cos(t)]});
  if(['square','princess','emerald','cushion'].includes(gem.shape)){const cut=gem.shape==='emerald'?.27:gem.shape==='cushion'?.22:0;return [[-1+cut,-1], [1-cut,-1],[1,-1+cut],[1,1-cut],[1-cut,1],[-1+cut,1],[-1,1-cut],[-1,-1+cut]]}
  return Array.from({length:n},(_,i)=>{const a=Math.PI*2*i/n-Math.PI/2;return [Math.cos(a),Math.sin(a)]});
};
const normalizedPoly=gem=>{const pts=unitPoly(gem),mx=Math.max(...pts.map(p=>Math.abs(p[0])))||1,my=Math.max(...pts.map(p=>Math.abs(p[1])))||1;return pts.map(([x,y])=>[x/mx,y/my])};
const gemPoly=(gem,pos,rotation=0)=>{const rx=gem.width*MM/2,ry=gem.length*MM/2,c=Math.cos(rotation),s=Math.sin(rotation);return normalizedPoly(gem).map(([x,y])=>[pos[0]+(x*rx*c-y*ry*s),pos[1]+(x*rx*s+y*ry*c)])};
const pointInPoly=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))inside=!inside;}return inside};
const polygonInside=(inner,outer)=>inner.every(p=>pointInPoly(p,outer));
const polygonBounds=poly=>poly.reduce((box,[x,y])=>({minX:Math.min(box.minX,x),maxX:Math.max(box.maxX,x),minY:Math.min(box.minY,y),maxY:Math.max(box.maxY,y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
const boundsOverlap=(a,b)=>a.minX<=b.maxX&&a.maxX>=b.minX&&a.minY<=b.maxY&&a.maxY>=b.minY;
const intersects=(a,b)=>{if(!boundsOverlap(polygonBounds(a),polygonBounds(b)))return false;const orient=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);const crosses=(p,q,r,s)=>orient(p,q,r)*orient(p,q,s)<-1e-10&&orient(r,s,p)*orient(r,s,q)<-1e-10;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(crosses(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;return pointInPoly(a[0],b)||pointInPoly(b[0],a);};
const validPlacement=(gem,pos,rotation,base,stones,excludeId)=>{
  const poly=gemPoly(gem,pos,rotation),outline=clipOutline(base).extractPoints(32).shape;
  const boundary=clipOutline(base,.008).extractPoints(32).shape.map(v=>[v.x,v.y]);
  if(!polygonInside(poly,boundary))return {valid:false,reason:'This stone extends beyond the clip surface.'};
  for(const stone of stones){if(stone.instanceId===excludeId)continue;const sku=GEM_CATALOG.find(g=>g.id===stone.gemId);if(sku&&intersects(poly,gemPoly(sku,stone.position,stone.rotation)))return {valid:false,reason:'This stone overlaps another gemstone.'};}
  return {valid:true,reason:'Placement looks good.'};
};
const shuffled=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
const randomItem=items=>items[Math.floor(Math.random()*items.length)];
const findSuggestedStone=(tier,base,occupied,currentTotal,targetTotal)=>{
  const skuOptions=shuffled(GEM_CATALOG.filter(gem=>gem.tier===tier&&currentTotal+gem.price<=targetTotal));
  const rotations=[0,Math.PI/4,Math.PI/2,Math.PI*3/4];
  for(const gem of skuOptions){
    const halfX=Math.max(.15,(base.width-gem.width)/2),halfY=Math.max(.15,(base.length-gem.length)/2);
    for(let attempt=0;attempt<36;attempt++){
      const position=[(Math.random()*2-1)*halfX*MM,(Math.random()*2-1)*halfY*MM];
      const rotation=randomItem(rotations);
      if(validPlacement(gem,position,rotation,base,occupied).valid){
        const color=randomItem(gem.colors);
        return {instanceId:newId(),gemId:gem.id,position,rotation,color:color.hex,colorName:color.name};
      }
    }
  }
  return null;
};
const buildSuggestedLook=(base,baseColor,confirmed,total,complexity)=>{
  const occupied=[...confirmed],stones=[],targetTotal=complexityTotal(complexity);let runningTotal=total;
  while(runningTotal<targetTotal&&occupied.length<AI_MAX_STONES){
    const preference=Math.random();
    const tiers=complexity<=3?(preference<.72?['S','M','L']:['M','S','L']):complexity<=7?(preference<.58?['M','S','L']:['S','M','L']):(preference<.56?['L','M','S']:['M','L','S']);
    let addition=null;
    for(const tier of tiers){addition=findSuggestedStone(tier,base,occupied,runningTotal,targetTotal);if(addition)break;}
    if(!addition)break;
    const gem=GEM_CATALOG.find(item=>item.id===addition.gemId);
    stones.push(addition);occupied.push(addition);runningTotal+=gem.price;
  }
  const title=randomItem(AI_LOOK_NAMES);
  return {title,story:`A fresh ${complexity<=3?'light and simple':complexity>=8?'bold and intricate':'balanced'} mix, fitted to the ${baseColor.name.toLowerCase()} clip. Drag any dashed stone to adjust the layout, change its color, or remove it.`,stones,targetTotal,complexity,fillReason:runningTotal>=targetTotal?`The selected level ${complexity} budget of $${targetTotal} was reached.`:`The clip fits $${runningTotal}; no more stones fit without crossing the edge or overlapping.`};
};
const validateSuggestedLook=(look,base,confirmed,total)=>{
  if(!look)return null;
  if(total>AI_MAX_TOTAL)return {valid:false,reason:`Your current design already exceeds the $${AI_MAX_TOTAL} AI Stylist limit. Remove a gemstone before refreshing.`};
  if(!look.stones.length)return {valid:false,reason:total>=look.targetTotal?`Your current design is already $${total.toFixed(2)}; level ${look.complexity} targets $${look.targetTotal}. Use REFRESH DESIGN to replace the previous layout.`:'No gemstones fit on the remaining surface. Use REFRESH DESIGN to replace the previous layout, or choose a larger clip.'};
  const occupied=[...confirmed];let gemstonePrice=0;
  for(const stone of look.stones){
    const gem=GEM_CATALOG.find(item=>item.id===stone.gemId);
    if(!gem)return {valid:false,reason:'A suggested gemstone is no longer in the catalog.'};
    const verdict=validPlacement(gem,stone.position,stone.rotation,base,occupied);
    if(!verdict.valid)return {valid:false,reason:verdict.reason};
    occupied.push(stone);gemstonePrice+=gem.price;
  }
  const projectedTotal=total+gemstonePrice;
  if(projectedTotal<AI_MIN_TOTAL)return {valid:false,reason:`The total is $${projectedTotal.toFixed(2)}; add more stones to reach the $15 minimum.`};
  if(projectedTotal>AI_MAX_TOTAL)return {valid:false,reason:`The total would exceed the $${AI_MAX_TOTAL} limit. Remove a stone or refresh the design.`};
  return {valid:true,projectedTotal,gemstonePrice,stoneCount:look.stones.length,fillReason:look.fillReason,targetTotal:look.targetTotal};
};

const shapePath=(gem)=>{const poly=normalizedPoly(gem).map(([x,y])=>[x*.98,y*.98]);const path=new THREE.Shape();poly.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();return path;};
function makeFacetGeometry(gem,colorHex){
  const outline=normalizedPoly(gem),n=outline.length,h=gem.height*MM,positions=[],colors=[];
  const base=new THREE.Color(colorHex),baseHsl={};
  base.getHSL(baseHsl);
  const jitter=(a,b)=>{const v=Math.sin(a*127.1+b*311.7+gem.width*17.3+gem.length*5.9)*43758.5453;return v-Math.floor(v)};
  const vertex=(p,z)=>[THREE.MathUtils.clamp(p[0],-1,1),THREE.MathUtils.clamp(p[1],-1,1),THREE.MathUtils.clamp(z,0,h)];
  const facetColor=(seed)=>{
    const q=jitter(seed,gem.height);
    const spectral=['#fffaff','#dff6ff','#f8dcff','#fff0c7'];
    let face;
    if(q>.94)face=new THREE.Color(spectral[Math.floor(jitter(seed,3)*spectral.length)]);
    else if(colorHex==='#e8f6fa')face=new THREE.Color(q>.78?'#ffffff':q>.48?'#d5f4ff':'#a9c6dc').lerp(new THREE.Color('#e6d7ff'),jitter(seed,7)*.24);
    else{
      const hueOffset=[-.075,-.026,0,.018,.065][Math.floor(q*5)];
      const lightness=Math.max(.13,Math.min(.9,baseHsl.l*(.52+q*.7)));
      face=new THREE.Color().setHSL((baseHsl.h+hueOffset+1)%1,Math.min(.92,baseHsl.s+.08),lightness);
      if(q>.86)face.lerp(new THREE.Color('#fff8f3'),.24+(q-.86)*1.8);
    }
    return face;
  };
  const triangle=(a,b,c,seed)=>{
    const face=facetColor(seed);
    for(const p of [a,b,c]){positions.push(...p);colors.push(face.r,face.g,face.b);}
  };
  const ring=(ratio,z)=>outline.map(([x,y])=>vertex([x*ratio,y*ratio],h*z));
  const girdleTop=ring(1,.4),girdleBottom=ring(1,.34);
  const pavilion=ring(.56,.17),star=ring(.79,.64),upper=ring(.53,.84),table=ring(.31,1);
  const culet=vertex([0,0],0),tableCenter=vertex([0,0],1);
  const band=(outer,inner,seed)=>{for(let i=0;i<n;i++){const j=(i+1)%n;triangle(outer[i],outer[j],inner[i],seed+i*2);triangle(outer[j],inner[j],inner[i],seed+i*2+1);}};
  band(girdleBottom,girdleTop,1);
  band(pavilion,girdleBottom,n+1);
  for(let i=0;i<n;i++)triangle(culet,pavilion[(i+1)%n],pavilion[i],n*2+i);
  band(girdleTop,star,n*3);
  band(star,upper,n*5);
  band(upper,table,n*7);
  for(let i=0;i<n;i++)triangle(table[i],table[(i+1)%n],tableCenter,n*9+i);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
function GemMesh({gem,position,rotation,color,selected,onClick,ghost,base=BASES.small,valid=true}){
  const [rx,ry]=[gem.width*MM/2,gem.length*MM/2];
  const visualColor=ghost?(valid?'#82cfaa':'#ef827a'):color;
  const geo=useMemo(()=>makeFacetGeometry(gem,visualColor),[gem,visualColor]);
  const surfaceTilt=Math.atan(.16*position[0]/Math.pow(base.width*MM/2,2));
  return <group position={[position[0],position[1],topZ(position[0],base)+.146]} rotation={[0,surfaceTilt,rotation]} scale={[rx,ry,1]} onClick={onClick}>
    <mesh geometry={geo} onDoubleClick={ghost?e=>{e.stopPropagation();onClick?.('cancel')}:undefined}><meshPhysicalMaterial color="#ffffff" vertexColors roughness={.065} metalness={.08} clearcoat={1} clearcoatRoughness={.025} ior={1.6} iridescence={.55} iridescenceIOR={1.3} iridescenceThicknessRange={[90,520]} flatShading transparent={ghost||color==='#e8f6fa'} opacity={ghost?.74:color==='#e8f6fa'?.88:1} side={THREE.DoubleSide}/></mesh>
    {selected&&!ghost&&<mesh position={[0,0,.06]}><ringGeometry args={[1.13,1.25,40]}/><meshBasicMaterial color="#77c8a4"/></mesh>}
  </group>;
}
function ResetControl({controls}){return null}
const newId=()=>globalThis.crypto?.randomUUID?.()??`inst-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const readSaved=()=>{try{return JSON.parse(localStorage.getItem('charmlet-designs')||'[]')}catch{return[]}};

function StoneLibrary({selectedShape,setSelectedShape,selectedTier,setSelectedTier,color,setColor,onStart,onTapGem,dragSku,setInfo}){
  const shapes=SHAPES;
  const shown=GEM_CATALOG.filter(g=>(!selectedShape||g.shape===selectedShape)&&(!selectedTier||g.tier===selectedTier));
  return <aside className="diy-library"><div className="diy-panel-title"><div><span>01 / GEM LIBRARY</span><h2>Little gems</h2></div><span className="diy-count">{GEM_CATALOG.length} SKUs</span></div>
    <p className="diy-note">Drag a stone onto the clip. Each drop creates a separate piece.</p>
    <div className="diy-filters"><select value={selectedShape} onChange={e=>setSelectedShape(e.target.value)} aria-label="Filter by shape"><option value="">All shapes</option>{shapes.map(([id,n])=><option key={id} value={id}>{n}</option>)}</select><select value={selectedTier} onChange={e=>setSelectedTier(e.target.value)} aria-label="Filter by size tier"><option value="">All sizes</option>{TIERS.map(t=><option key={t.id} value={t.id}>{t.label} · ${t.price}</option>)}</select></div>
    <div className="diy-colors">{GEM_COLORS.map(c=><button key={c.name} className={`diy-color ${color.name===c.name?'active':''}`} aria-pressed={color.name===c.name} title={c.name} aria-label={c.name} style={{'--gem':c.hex}} onClick={()=>setColor(c)}/>)}</div>
    <div className="diy-gem-list">{shown.map(g=><button key={g.id} className={`diy-gem-card ${dragSku?.id===g.id?'dragging':''}`} onPointerDown={e=>{if(e.pointerType!=='touch'||e.target.closest('.diy-plus'))onStart(g,e)}} onPointerUp={()=>{}} onClick={()=>onTapGem(g)}>
      <span className={`gem-thumb shape-${g.shape}`} style={{'--gem':color.hex}}/><span className="diy-gem-meta"><b>{g.name}</b><small>{g.width===g.length?`${g.width} mm`:`${g.width} × ${g.length} mm`} · {g.sku}</small><small className="gem-price">${g.price} each <i>· demo catalog</i></small></span><span className="diy-plus">+</span>
    </button>)}</div><p className="diy-inventory-note">Prototype catalog · live inventory not connected</p>
  </aside>;
}

function AIStylistPanel({base,look,activeStoneId,loading,aiConfigured,validation,projectedTotal,complexity,hasGenerated,onComplexityChange,onNextLook,onClearLook,onApplyLook,onSelectStone,onChangeColor,onRemoveStone}){
  const selectedStone=look?.stones.find(stone=>stone.instanceId===activeStoneId)||look?.stones[0];
  const selectedGem=selectedStone&&GEM_CATALOG.find(gem=>gem.id===selectedStone.gemId);
  return <section className="ai-stylist" aria-labelledby="ai-stylist-title">
    <div className="ai-stylist-heading"><span><Sparkles size={13}/> AI STYLE ASSISTANT</span><h2 id="ai-stylist-title">Fill your clip with a fresh look.</h2><p>Refresh as often as you like. Drag any dashed stone to move it, change its color, or remove it before applying.</p></div>
    <div className="ai-stylist-controls"><div className="ai-stylist-buttons"><button type="button" className="ai-design-button" onClick={onNextLook} disabled={loading}><Sparkles size={14}/>{loading?'STYLING COLORS…':hasGenerated?'REFRESH DESIGN':'AI DESIGN'}</button><label className="ai-complexity-control"><span><b>COMPLEXITY</b><strong>{complexity}/10</strong></span><input type="range" min="1" max="10" step="1" value={complexity} onChange={event=>onComplexityChange(Number(event.target.value))} aria-label="AI design complexity, 1 simple to 10 complex"/><span className="complexity-scale"><i>SIMPLE</i><strong>${complexityTotal(complexity)}</strong><i>COMPLEX</i></span></label><button type="button" className="ai-clear-button" onClick={onClearLook} disabled={!look}><Trash2 size={13}/> CLEAR</button></div><small>{look?`${look.stones.length} gemstones · REFRESH DESIGN replaces the previous layout.`:'Choose a complexity, then create a design.'}</small></div>
    <small className="ai-stylist-powered">Level 1 targets $15; level 10 targets $100. Higher levels favor larger statement stones and denser layouts. {aiConfigured?'Gemini refines the palette and story for your selected level.':'Studio-generated color palettes work without an API key.'}</small>
    {look&&<div className="ai-look-content" aria-live="polite">
      <div className="ai-look-title"><div><b>{look.title}</b><p>{look.story}</p></div><span>{look.stones.length} STONES</span></div>
      <div className="ai-look-points">{look.stones.map((stone,index)=>{
        const gem=GEM_CATALOG.find(item=>item.id===stone.gemId);
        const color=GEM_COLORS.find(item=>item.hex===stone.color)||GEM_COLORS[0];
        return <div className="ai-look-point-row" key={stone.instanceId}><button type="button" className={`ai-look-point ${activeStoneId===stone.instanceId?'active':''}`} onClick={()=>onSelectStone(stone.instanceId)} aria-pressed={activeStoneId===stone.instanceId}>
          <span className={`gem-thumb shape-${gem.shape}`} style={{'--gem':color.hex}}/><span><b>{String(index+1).padStart(2,'0')} · {color.name} {gem.name}</b><small>{gem.width===gem.length?`${gem.width} mm`:`${gem.width} × ${gem.length} mm`} · ${gem.price}</small></span>
        </button><button type="button" className="ai-look-remove" onClick={()=>onRemoveStone(stone.instanceId)} aria-label={`Remove ${gem.name} from this draft`} title="Remove this gemstone"><Trash2 size={13}/></button></div>;
      })}</div>
      {selectedStone&&selectedGem&&<div className="ai-look-color-picker"><span>COLOR FOR POINT {String(look.stones.findIndex(stone=>stone.instanceId===selectedStone.instanceId)+1).padStart(2,'0')}</span><div className="diy-colors">{selectedGem.colors.map(color=><button type="button" key={color.name} className={`diy-color ${selectedStone.color===color.hex?'active':''}`} title={color.name} aria-label={`Set point color to ${color.name}`} aria-pressed={selectedStone.color===color.hex} style={{'--gem':color.hex}} onClick={()=>onChangeColor(selectedStone.instanceId,color)}/>)}</div></div>}
      <div className={`ai-look-validation ${validation?.valid?'valid':'invalid'}`}>{validation?.valid?`${look.stones.length} stones fit. Estimated total: $${projectedTotal.toFixed(2)}. ${look.fillReason}`:validation?.reason||'Choose a clip size to validate this design.'}</div>
      <button type="button" className="ai-look-apply" onClick={onApplyLook} disabled={loading||!validation?.valid}><Check size={14}/> APPLY DESIGN · ${projectedTotal.toFixed(2)}</button>
    </div>}
  </section>;
}

function GuideGemOutline({stone,base,selected,valid,onSelect,onMoveStart,onMove}){
  const gem=GEM_CATALOG.find(item=>item.id===stone.gemId);
  const shape=useMemo(()=>gem&&shapePath(gem),[gem]);
  const outline=useMemo(()=>{
    if(!gem)return null;
    const points=normalizedPoly(gem).map(([x,y])=>new THREE.Vector3(x,y,.025));
    return new THREE.BufferGeometry().setFromPoints(points);
  },[gem]);
  if(!gem||!shape||!outline)return null;
  const [x,y]=stone.position;
  const tilt=Math.atan(.16*x/Math.pow(base.width*MM/2,2));
  const color=valid===false?'#d5675e':selected?'#39865f':'#9b7b50';
  return <group position={[x,y,topZ(x,base)+.151]} rotation={[0,tilt,stone.rotation]} scale={[gem.width*MM/2,gem.length*MM/2,1]}>
    <mesh onPointerDown={event=>{event.stopPropagation();onMoveStart(stone.instanceId)}} onPointerMove={event=>onMove([event.point.x,event.point.y])} onClick={event=>{event.stopPropagation();onSelect(stone.instanceId)}}>
      <shapeGeometry args={[shape,12]}/><meshBasicMaterial transparent opacity={0.001} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <lineLoop geometry={outline} ref={line=>line?.computeLineDistances()} onPointerDown={event=>{event.stopPropagation();onMoveStart(stone.instanceId)}} onPointerMove={event=>onMove([event.point.x,event.point.y])} onClick={event=>{event.stopPropagation();onSelect(stone.instanceId)}}>
      <lineDashedMaterial color={color} dashSize={.23} gapSize={.15} transparent opacity={selected?1:.88}/>
    </lineLoop>
    <mesh position={[0,0,.035]} onPointerDown={event=>{event.stopPropagation();onMoveStart(stone.instanceId)}} onPointerMove={event=>onMove([event.point.x,event.point.y])} onClick={event=>{event.stopPropagation();onSelect(stone.instanceId)}}><circleGeometry args={[.12,12]}/><meshBasicMaterial color={color}/></mesh>
  </group>;
}

function Viewport({base,color,stones,pending,validity,selected,onSelect,onPlace,onEnd,onBeginPlacement,onEndPlacement,onLockPlacement,onCancelPlacement,controlsRef,dragging,onCameraUpdate,suggestedStones,suggestedValid,activeGuideId,onGuideSelect,onGuideMoveStart,onGuideMove}){
  const frame=useRef(); const {camera,gl}=useThree();
  useMemo(()=>{frame.current=gl.domElement},[gl]);
  const update=e=>{if(!dragging)return;const local=e.object.worldToLocal(e.point.clone());onPlace([local.x,local.y]);};
  return <>
    <ambientLight intensity={1.1}/><directionalLight position={[1,2,5]} intensity={2.2} castShadow/><Environment preset="studio"/>
    <BaseModel base={base} color={color.hex} dragging={dragging} onPoint={update} onBeginPlacement={onBeginPlacement} onEndPlacement={onEndPlacement} onLockPlacement={onLockPlacement} onCancelPlacement={onCancelPlacement}/>
    {stones.map(s=>{const gem=GEM_CATALOG.find(g=>g.id===s.gemId);return gem?<GemMesh key={s.instanceId} gem={gem} position={s.position} rotation={s.rotation} color={s.color} selected={selected===s.instanceId} onClick={e=>{e.stopPropagation();onSelect(s.instanceId)}}/>:null})}
    {suggestedStones.map(stone=><GuideGemOutline key={stone.instanceId} stone={stone} base={base} selected={activeGuideId===stone.instanceId} valid={suggestedValid} onSelect={onGuideSelect} onMoveStart={onGuideMoveStart} onMove={onGuideMove}/>)}
    {pending&&<GemMesh gem={GEM_CATALOG.find(g=>g.id===pending.gemId)} position={pending.position} rotation={pending.rotation} color={pending.color} base={base} valid={validity?.valid} ghost onClick={action=>action==='cancel'?onCancelPlacement():onLockPlacement()} />}
    <ContactShadows position={[0,0,-.02]} opacity={.27} scale={5} blur={2.4}/>
    <OrbitControls ref={controlsRef} makeDefault enablePan={false} minDistance={2.2} maxDistance={7} target={[0,0,0]} onChange={onCameraUpdate}/>
  </>;
}

export default function DIYStudio({onAddToCart=()=>{}}){
  const [baseKey,setBaseKey]=useState('small'),[baseColor,setBaseColor]=useState(BASE_COLORS[0]),[placing,setPlacing]=useState(false);
  const [complexity,setComplexity]=useState(5),[undoStack,setUndoStack]=useState([]);
  const [stones,setStones]=useState([]),[selected,setSelected]=useState(null),[selectedShape,setSelectedShape]=useState(''),[selectedTier,setSelectedTier]=useState('');
  const [gemColor,setGemColor]=useState(GEM_COLORS[0]),[dragSku,setDragSku]=useState(null),[pending,setPending]=useState(null),[reason,setReason]=useState('Drag a gemstone from the library onto the clip.');
  const [suggestedLook,setSuggestedLook]=useState(null),[activeGuideId,setActiveGuideId]=useState(null),[movingGuideId,setMovingGuideId]=useState(null),[stylistLoading,setStylistLoading]=useState(false),[aiConfigured,setAiConfigured]=useState(false);
  const [notice,setNotice]=useState(''),[saved,setSaved]=useState(readSaved),[designName,setDesignName]=useState('My charmlet'),[cameraTick,setCameraTick]=useState(0);
  const controls=useRef(null),lookRequest=useRef(0),undoHistory=useRef([]),aiDesignsGenerated=useRef(0),base=BASES[baseKey],chosen=stones.find(s=>s.instanceId===selected),chosenGem=chosen&&GEM_CATALOG.find(g=>g.id===chosen.gemId),dragging=!!dragSku||placing||!!(pending&&!pending.locked)||!!movingGuideId;
  const recordUndo=()=>{undoHistory.current=[...undoHistory.current,{baseKey,baseColor,stones,suggestedLook,pending,selected,activeGuideId}].slice(-30);setUndoStack(undoHistory.current)};
  const undoStep=()=>{const snapshot=undoHistory.current.pop();if(!snapshot)return;setUndoStack([...undoHistory.current]);setBaseKey(snapshot.baseKey);setBaseColor(snapshot.baseColor);setStones(snapshot.stones);setSuggestedLook(snapshot.suggestedLook);setPending(snapshot.pending);setSelected(snapshot.selected);setActiveGuideId(snapshot.activeGuideId);setDragSku(null);setMovingGuideId(null);setPlacing(false);setStylistLoading(false);if(controls.current)controls.current.enabled=true;setNotice('Previous design step restored.')};
  useEffect(()=>{let mounted=true;fetch('/api/ai/stylist/config').then(response=>response.json()).then(config=>{if(mounted)setAiConfigured(Boolean(config.configured))}).catch(()=>{});return()=>{mounted=false}},[]);
  const total=base.price+stones.reduce((n,s)=>n+(GEM_CATALOG.find(g=>g.id===s.gemId)?.price||0),0);
  const status=pending?.placed?validPlacement(GEM_CATALOG.find(g=>g.id===pending.gemId),pending.position,pending.rotation,base,stones):null;
  const lookValidation=useMemo(()=>validateSuggestedLook(suggestedLook,base,stones,total),[suggestedLook,base,stones,total]);
  const setBaseSize=key=>{if(key===baseKey)return;const next=BASES[key];const invalid=stones.find(s=>{const g=GEM_CATALOG.find(x=>x.id===s.gemId);return !validPlacement(g,s.position,s.rotation,next,stones,s.instanceId).valid});if(invalid){setNotice('This design does not fit the selected size. Delete or reposition stones before changing size.');return;}recordUndo();setBaseKey(key);setNotice('Base size updated.');};
  const changeBaseColor=color=>{if(color.hex===baseColor.hex)return;recordUndo();setBaseColor(color)};
  const startDrag=(gem,e)=>{if(e.pointerType!=='touch')e.preventDefault();recordUndo();if(controls.current)controls.current.enabled=true;setSuggestedLook(null);setActiveGuideId(null);setMovingGuideId(null);setDragSku(gem);setPending({instanceId:newId(),gemId:gem.id,position:[0,0],rotation:0,color:gemColor.hex,placed:false,locked:false});setReason('Place the stone, then click once to fix it. Double-click to cancel.');};
  const movePending=pos=>{if(!pending||pending.locked)return;const next={...pending,position:pos,placed:true};setPending(next);const v=validPlacement(GEM_CATALOG.find(g=>g.id===next.gemId),next.position,next.rotation,base,stones);setReason(v.valid?'Position is valid. Click once to fix it; double-click to cancel.':v.reason);};
  const tapGem=gem=>{recordUndo();if(controls.current)controls.current.enabled=true;setSuggestedLook(null);setActiveGuideId(null);setMovingGuideId(null);setPending({instanceId:newId(),gemId:gem.id,position:[0,0],rotation:0,color:gemColor.hex,placed:false,locked:false});setReason('Move over the clip, then click once to fix the position. Double-click to cancel.');};
  const showNextLook=async()=>{
    const requestId=++lookRequest.current;
    recordUndo();
    const isRefresh=aiDesignsGenerated.current>0;aiDesignsGenerated.current+=1;
    const occupied=isRefresh?[]:stones,startingTotal=isRefresh?base.price:total;
    const draft={...buildSuggestedLook(base,baseColor,occupied,startingTotal,complexity),requestId};
    if(controls.current)controls.current.enabled=true;if(isRefresh){setStones([]);setNotice('Previous clip settings cleared for a fresh AI design.');}setSuggestedLook(draft);setActiveGuideId(draft.stones[0]?.instanceId||null);setSelected(null);setPending(null);setDragSku(null);setMovingGuideId(null);setPlacing(false);
    if(!aiConfigured||!draft.stones.length)return;
    setStylistLoading(true);
    try{
      const response=await fetch('/api/ai/stylist/palette',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({baseSize:base.label,baseColor:baseColor.name,title:draft.title,story:draft.story,complexity,targetTotal:draft.targetTotal,stones:draft.stones.map(stone=>({sku:GEM_CATALOG.find(gem=>gem.id===stone.gemId)?.sku}))})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'The AI palette could not be refreshed.');
      setSuggestedLook(current=>current?.requestId===requestId?{...current,story:result.story||current.story,paletteSource:'AI',stones:current.stones.map((stone,index)=>{const color=GEM_COLORS.find(item=>item.name===result.colors?.[index])||GEM_COLORS.find(item=>item.hex===stone.color);return{...stone,color:color.hex,colorName:color.name};})}:current);
    }catch{
      setSuggestedLook(current=>current?.requestId===requestId?{...current,paletteSource:'studio'}:current);
    }finally{if(lookRequest.current===requestId)setStylistLoading(false);}
  };
  const selectGuide=id=>{setActiveGuideId(id);setSelected(null);};
  const changeGuideColor=(id,color)=>{recordUndo();setSuggestedLook(current=>current?{...current,stones:current.stones.map(stone=>stone.instanceId===id?{...stone,color:color.hex,colorName:color.name}:stone)}:current)};
  const removeGuideStone=id=>{recordUndo();const remaining=suggestedLook?.stones.filter(stone=>stone.instanceId!==id)||[];setActiveGuideId(current=>current===id?remaining[0]?.instanceId||null:current);setSuggestedLook(current=>current?{...current,stones:current.stones.filter(stone=>stone.instanceId!==id)}:current);};
  const clearSuggestedLook=()=>{recordUndo();lookRequest.current++;aiDesignsGenerated.current=0;setStylistLoading(false);if(controls.current)controls.current.enabled=true;setSuggestedLook(null);setActiveGuideId(null);setMovingGuideId(null);setPlacing(false);setNotice('AI design cleared. Confirmed gemstones are unchanged.');};
  const endGuideMove=()=>{setMovingGuideId(null);setPlacing(false);if(controls.current)controls.current.enabled=true;};
  const moveGuideStart=id=>{recordUndo();setActiveGuideId(id);setSelected(null);setPending(null);setMovingGuideId(id);setPlacing(true);if(controls.current)controls.current.enabled=false;const end=()=>{endGuideMove();window.removeEventListener('pointerup',end)};window.addEventListener('pointerup',end,{once:true});};
  const moveSuggestedStone=(id,position)=>setSuggestedLook(current=>current?{...current,stones:current.stones.map(stone=>stone.instanceId===id?{...stone,position}:stone)}:current);
  const placeFromCanvas=position=>movingGuideId?moveSuggestedStone(movingGuideId,position):movePending(position);
  const moveGuidePointer=position=>movingGuideId&&moveSuggestedStone(movingGuideId,position);
  const applySuggestedLook=()=>{
    if(!suggestedLook||!lookValidation?.valid)return;
    recordUndo();
    const additions=suggestedLook.stones.map(stone=>{const gem=GEM_CATALOG.find(item=>item.id===stone.gemId);return{...stone,sku:gem.sku,surfaceNormal:normalAt(stone.position[0],base),confirmedAt:Date.now()};});
    setStones(current=>[...current,...additions]);setSuggestedLook(null);setActiveGuideId(null);setNotice(`${suggestedLook.title} added. ${additions.length} gemstones confirmed.`);
  };
  const lockPlacement=()=>{if(!pending||pending.locked)return;if(!pending.placed){setReason('Move the stone onto the clip before fixing its position.');return;}if(!status?.valid){setReason(status?.reason||'This position is invalid.');return;}recordUndo();setPending(v=>({...v,locked:true}));setReason('Position fixed. Choose CONFIRM ADDITION to save and charge this stone.');};
  const confirm=()=>{if(!pending||!pending.locked||!status?.valid)return;recordUndo();const stone={...pending,sku:GEM_CATALOG.find(g=>g.id===pending.gemId).sku,surfaceNormal:normalAt(pending.position[0],base),confirmedAt:Date.now()};setStones(v=>[...v,stone]);setSelected(stone.instanceId);setPending(null);setDragSku(null);setReason('Gemstone added.');};
  const cancel=()=>{if(controls.current)controls.current.enabled=true;setPending(null);setDragSku(null);setMovingGuideId(null);setPlacing(false);setReason('Drag or select a gemstone from the library to begin.');};
  const rotatePending=()=>setPending(v=>{if(!v||v.locked)return v;const next={...v,rotation:v.rotation+Math.PI/12};const verdict=validPlacement(GEM_CATALOG.find(g=>g.id===next.gemId),next.position,next.rotation,base,stones);setReason(verdict.valid?'Position is valid. Click once to fix it; double-click to cancel.':verdict.reason);return next;});
  const changeStoneColor=c=>{recordUndo();setStones(v=>v.map(s=>s.instanceId===selected?{...s,color:c.hex,colorName:c.name}:s));};
  const removeStone=()=>{recordUndo();setStones(v=>v.filter(s=>s.instanceId!==selected));setSelected(null);setNotice('Gemstone removed. Its price has been deducted.');};
  const previewImage=()=>{try{return document.querySelector('.diy-canvas canvas')?.toDataURL('image/png')||null}catch{return null}};
  const structure=()=>{
    const gemstones=stones.map(s=>{const g=GEM_CATALOG.find(x=>x.id===s.gemId);return{instanceId:s.instanceId,skuId:g.sku,gemId:g.id,shape:g.shape,color:s.color,colorName:s.colorName||GEM_COLORS.find(c=>c.hex===s.color)?.name,physicalDimensionsMm:{width:g.width,length:g.length,height:g.height},price:g.price,surfacePositionMm:[s.position[0]/MM,s.position[1]/MM],surfaceNormal:s.surfaceNormal,orientation:s.rotation}});
    const quantities=gemstones.reduce((acc,g)=>{acc[g.skuId]=(acc[g.skuId]||0)+1;return acc},{});
    return{designId:newId(),baseSku:base.id,baseModelId:base.id,baseSize:base.label,baseDimensionsMm:{length:base.length,width:base.width},baseColor:baseColor.name,baseColorHex:baseColor.hex,basePrice:base.price,currency:'USD',gemstones,gemstoneSkus:Object.entries(quantities).map(([sku,quantity])=>({sku,quantity})),totalPrice:total,designPreviewImage:previewImage(),updatedAt:new Date().toISOString()};
  };
  const save=()=>{const all=readSaved();const item={...structure(),name:designName};const next=[item,...all.filter(v=>v.name!==designName)];localStorage.setItem('charmlet-designs',JSON.stringify(next));setSaved(next);setNotice('Design saved on this device.');};
  const reopen=id=>{const item=saved.find(v=>v.designId===id);if(!item)return;recordUndo();const k=item.baseSize.toLowerCase();setBaseKey(k==='medium'?'medium':'small');const bc=BASE_COLORS.find(c=>c.hex===item.baseColorHex)||BASE_COLORS[0];setBaseColor(bc);setStones(item.gemstones.map(g=>({instanceId:g.instanceId,gemId:g.gemId,sku:g.skuId,color:g.color,colorName:g.colorName,position:[g.surfacePositionMm[0]*MM,g.surfacePositionMm[1]*MM],rotation:g.orientation,surfaceNormal:g.surfaceNormal})));setSuggestedLook(null);setActiveGuideId(null);setSelected(null);setNotice('Saved design reopened.');};
  const addCart=()=>{const data=structure();onAddToCart(data);undoHistory.current=[];setUndoStack([]);aiDesignsGenerated.current=0;if(controls.current)controls.current.enabled=true;setStones([]);setSelected(null);setPending(null);setSuggestedLook(null);setActiveGuideId(null);setMovingGuideId(null);setDragSku(null);setPlacing(false);setNotice('Added to your bag. Your clip is clear for a new design.');};
  const resetCamera=()=>{controls.current?.reset();setCameraTick(v=>v+1)};
  const clientStart=(gem,e)=>{startDrag(gem,e);const end=()=>{setDragSku(null);window.removeEventListener('pointerup',end)};window.addEventListener('pointerup',end,{once:true})};
  const selectedColor=chosen?GEM_COLORS.find(c=>c.hex===chosen.color)||GEM_COLORS[0]:null;
  return <div className="diy-shell">
    <header className="diy-topbar"><a href="#shop" className="diy-back"><ArrowLeft size={16}/> CHARMLET</a><div><span>03 / DIY STUDIO</span><b>Design your clip</b></div><button className="diy-top-bag" onClick={addCart}><ShoppingBag size={17}/> <span>${total.toFixed(2)}</span></button></header>
    <div className="diy-layout">
      <StoneLibrary selectedShape={selectedShape} setSelectedShape={setSelectedShape} selectedTier={selectedTier} setSelectedTier={setSelectedTier} color={gemColor} setColor={setGemColor} onStart={clientStart} onTapGem={tapGem} dragSku={dragSku} setInfo={setReason}/>
      <section className="diy-workspace"><div className="diy-view-head"><div><span>02 / YOUR CLIP</span><h1>Make room for <i>you.</i></h1></div><div className="diy-view-actions"><button className="undo-edit" onClick={undoStep} disabled={!undoStack.length} title="Undo the previous design step"><Undo2 size={14}/> UNDO STEP</button><button className="reset-camera" onClick={resetCamera}><RotateCcw size={14}/> RESET VIEW</button></div></div>
        <div className={`diy-canvas ${dragging?'is-dragging':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>e.preventDefault()}>
          <Canvas shadows camera={{position:[0,-.4,4.3],fov:34}} gl={{preserveDrawingBuffer:true,antialias:true}} dpr={[1,1.6]} onPointerMissed={()=>selected&&setSelected(null)}>
            <Viewport base={base} color={baseColor} stones={stones} pending={pending} validity={status} selected={selected} onSelect={setSelected} onPlace={placeFromCanvas} onEnd={confirm} onBeginPlacement={()=>setPlacing(true)} onEndPlacement={endGuideMove} onLockPlacement={lockPlacement} onCancelPlacement={cancel} controlsRef={controls} dragging={dragging} onCameraUpdate={()=>{}} suggestedStones={suggestedLook?.stones||[]} suggestedValid={lookValidation?.valid} activeGuideId={activeGuideId} onGuideSelect={selectGuide} onGuideMoveStart={moveGuideStart} onGuideMove={moveGuidePointer}/>
          </Canvas>
          <div className="diy-view-label">{base.length} × {base.width} MM · REAL-SCALE PROPORTIONS</div>
          <div className={`placement-status ${status?.valid?'valid':pending?'invalid':''}`}>{status?.valid?'✓ ':pending?'! ':''}{pending?reason:'Drag gemstones here to start placing'}</div>
          <div className="diy-camera-hint">DRAG TO ROTATE · SCROLL / PINCH TO ZOOM</div>
        </div>
        <div className="diy-stage-row"><div><span>BASE COLOR</span><div className="base-swatches">{BASE_COLORS.map(c=><button key={c.name} className={c.name===baseColor.name?'active':''} title={c.name} aria-label={c.name} style={{'--swatch':c.hex}} onClick={()=>changeBaseColor(c)}/>)}</div></div><div className="base-sizes"><span>CLIP SIZE</span>{Object.entries(BASES).map(([key,v])=><button key={key} className={baseKey===key?'active':''} onClick={()=>setBaseSize(key)}>{v.label} <small>{v.length} × {v.width} mm</small><b>${v.price}</b></button>)}</div></div>
        <AIStylistPanel base={base} look={suggestedLook} activeStoneId={activeGuideId} loading={stylistLoading} aiConfigured={aiConfigured} validation={lookValidation} projectedTotal={lookValidation?.projectedTotal||total} complexity={complexity} hasGenerated={aiDesignsGenerated.current>0} onComplexityChange={setComplexity} onNextLook={showNextLook} onClearLook={clearSuggestedLook} onApplyLook={applySuggestedLook} onSelectStone={selectGuide} onChangeColor={changeGuideColor} onRemoveStone={removeGuideStone}/>
        {pending&&<div className="confirm-bar"><div><b>{GEM_CATALOG.find(g=>g.id===pending.gemId)?.name}</b><span>{reason} · Temporary stones are not charged.</span></div><button className="cancel-add" onClick={cancel}>CANCEL</button><button className="cancel-add" disabled={pending.locked} onClick={rotatePending}>ROTATE 15°</button><button className="confirm-add" disabled={!status?.valid||!pending.locked} onClick={confirm}><Check size={15}/> CONFIRM ADDITION</button></div>}
      </section>
      <aside className="diy-properties"><div className="diy-panel-title"><div><span>03 / PROPERTIES</span><h2>{chosen?'Selected stone':'Your design'}</h2></div>{chosen&&<button className="close-selected" onClick={()=>setSelected(null)} aria-label="Deselect stone"><X size={16}/></button>}</div>
        {chosen&&chosenGem?<div className="selected-stone"><b>{chosenGem.name}</b><small>SKU · {chosenGem.sku}</small><small>Fixed size · {chosenGem.width} × {chosenGem.length} × {chosenGem.height.toFixed(1)} mm</small><div className="picker-label">STONE COLOR</div><div className="diy-colors prop-colors">{chosenGem.colors.map(c=><button key={c.name} className={chosen.color===c.hex?'diy-color active':''} title={c.name} aria-label={c.name} style={{'--gem':c.hex}} onClick={()=>changeStoneColor(c)}/>)}</div><div className="selected-price">${chosenGem.price.toFixed(2)} <span>FIXED PRICE</span></div><button className="delete-stone" onClick={removeStone}><Trash2 size={14}/> DELETE GEMSTONE</button><p className="locked-note">Position and physical size are locked after confirmation.</p></div>:<div className="design-summary"><div><span>BASE SIZE</span><b>{base.label} · {base.length} × {base.width} mm</b></div><div><span>BASE COLOR</span><b><i style={{background:baseColor.hex}}/> {baseColor.name}</b></div><div><span>CONFIRMED GEMS</span><b>{stones.length}</b></div><div className="summary-total"><span>YOUR TOTAL</span><b>${total.toFixed(2)}</b><small>Temporary stones are excluded</small></div></div>}
        <div className="design-save"><label htmlFor="design-name">SAVE YOUR DESIGN</label><input id="design-name" value={designName} onChange={e=>setDesignName(e.target.value)} maxLength={40}/><button onClick={save}><Save size={14}/> SAVE TO THIS DEVICE</button>{saved.length>0&&<details><summary>OPEN A SAVED DESIGN <ChevronDown size={13}/></summary>{saved.map(s=><button key={s.designId} onClick={()=>reopen(s.designId)}>{s.name} · {s.baseSize} · ${s.totalPrice}</button>)}</details>}</div>
        <button className="diy-add-cart" onClick={addCart}>ADD TO BAG <span>${total.toFixed(2)}</span><ShoppingBag size={16}/></button>
        <p className="diy-server-note">Sandbox checkout enabled · supplier inventory and shipping rules still need setup.</p>
      </aside>
    </div>
    {notice&&<div className="diy-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}
    <div className="diy-mobile-actions"><b>${total.toFixed(2)}</b><button onClick={addCart}>ADD TO BAG</button></div>
  </div>;
}
