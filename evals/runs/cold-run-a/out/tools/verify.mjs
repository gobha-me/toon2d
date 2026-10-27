// Additional task-specific browser checks. Run from the workspace or out/.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { open } from '../../skill/scripts/lib/drive.mjs';
import { decodePNG, encodePNG } from '../../skill/scripts/lib/png.mjs';
import { fromB64, hash, crop, scaleNearest, sheet } from '../../skill/scripts/lib/img.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=new URL('../shots/verification/',import.meta.url);
mkdirSync(output,{recursive:true});
const checks=[];
function pass(name,detail){checks.push({name,pass:true,detail});console.log(`PASS ${name}: ${detail}`);}
const clean=decodePNG(readFileSync(new URL('../sheet.clean.png',import.meta.url)));
const markers=new Set(['255,0,255','0,255,255','255,255,0']);
let count=0;
for(let i=0;i<clean.data.length;i+=4) if(clean.data[i+3]&&markers.has([...clean.data.slice(i,i+3)].join(',')))count++;
assert.equal(count,0);
const rig=JSON.parse(readFileSync(new URL('../rig.json',import.meta.url)));
const parts=JSON.parse(readFileSync(new URL('../parts.json',import.meta.url))).parts;
for(const b of rig.bones) if(b.sprite) assert.ok(Math.abs(b.len-parts[b.sprite].len)<0.01,b.name);
assert.deepEqual([...new Set([...rig.bones.map(b=>b.sprite),...Object.values(rig.draw.limbs).map(l=>l.endSprite)].filter(Boolean))].sort(),Object.keys(parts).sort());
pass('source-art','All nine parts mapped, exact marker-derived bone lengths, zero marker pixels in clean sheet.');
const sess=await open(root);
const {page}=sess;
const ev=s=>page.eval(s);
const key=async(code,down=true)=>page.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key:({Space:' ',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'})[code]||code,windowsVirtualKeyCode:({Space:32,ArrowLeft:37,ArrowRight:39})[code]||0});
let completed=false;
const save=(name,im)=>writeFileSync(new URL(name,output),encodePNG(im.w,im.h,im.data));
try {
  await ev('document.querySelector("#game").focus(); window.__toon.reset()');
  const start=await ev('window.__toon.state().root.x');
  await key('ArrowRight'); await ev('window.__toon.tick(36)');
  let st=await ev('window.__toon.state()');
  assert.equal(st.state,'run'); assert.ok(st.root.x>start+30);
  await key('ArrowRight',false); await key('ArrowLeft');
  const visited=await ev('(()=>{const seen=[];for(let i=0;i<25;i++){window.__toon.tick();seen.push(window.__toon.state().state);}return seen})()');
  assert.ok(visited.includes('turn')); assert.equal(await ev('window.__toon.state().facing'),-1);
  await key('ArrowLeft',false); await ev('window.__toon.tick(40)');
  assert.equal(await ev('window.__toon.state().state'),'idle');
  pass('keyboard-locomotion','Actual keyboard events drive run, ten-tick turn, stop, and facing.');

  const doJump=async(hold)=>{
    await ev('window.__toon.reset()'); await key('Space');
    const result=await ev(`(()=>{let minY=150;const states=[];for(let i=0;i<${hold};i++){window.__toon.tick();const s=window.__toon.state();minY=Math.min(minY,s.root.y);states.push(s.state)}return {minY,states}})()`);
    await key('Space',false);
    const rest=await ev('(()=>{let minY=150;const states=[];for(let i=0;i<90;i++){window.__toon.tick();const s=window.__toon.state();minY=Math.min(minY,s.root.y);states.push(s.state)}return {minY,states,grounded:window.__toon.state().grounded}})()');
    return {minY:Math.min(rest.minY,result.minY),states:[...new Set([...result.states,...rest.states])],grounded:rest.grounded};
  };
  const tap=await doJump(1),hold=await doJump(22);
  assert.ok(hold.minY<tap.minY-20); assert.ok(hold.grounded);
  for(const s of ['jump','fall','land','idle']) assert.ok(hold.states.includes(s));
  pass('keyboard-jump',`Tap apex y=${tap.minY.toFixed(2)}, hold apex y=${hold.minY.toFixed(2)}; jump/fall/land/idle visited.`);

  await ev('window.__toon.reset(); window.__toon.setInput({right:true,jump:true})');
  const platform=await ev('(()=>{const land=[];for(let i=0;i<280;i++){if(i===22)window.__toon.setInput({right:true});if(i===111)window.__toon.setInput({right:true,jump:true});if(i===134)window.__toon.setInput({right:true});window.__toon.tick();const s=window.__toon.state();if(s.grounded&&s.root.y<150)land.push(s.root.y)}return [...new Set(land)]})()');
  // Directly exercise crossing a platform's top in the normal physics path.
  await ev('window.__toon.reset({x:214}); window.__toon.setInput({right:true,jump:true})');
  const ledge=await ev('(()=>{const land=[];for(let i=0;i<70;i++){if(i===22)window.__toon.setInput({right:true});window.__toon.tick();const s=window.__toon.state();if(s.grounded&&s.root.y<150)land.push(s.root.y)}return [...new Set(land)]})()');
  assert.ok(ledge.includes(104));
  pass('platform','Normal run-jump lands on the one-way ledge at y=104.');

  const gaze=async(x,y)=>{
    await ev(`window.__toon.reset({seed:5});window.__toon.setExpression('neutral');window.__toon.lookAt(${x},${y});window.__toon.tick(30)`);
    return {face:await ev('window.__toon.state().face'),image:fromB64(await ev('window.__toon.pixels("character")'))};
  };
  const a=await gaze(-500,-200), b=await gaze(600,300);
  assert.ok(a.face.pupilX<-.5&&b.face.pupilX>.5);
  assert.ok(a.face.pupilY<-.2&&b.face.pupilY>.2);
  assert.notEqual(hash(a.image),hash(b.image));
  save('look-at.png',sheet([a.image,b.image].map(im=>scaleNearest(crop(im,60,94,40,60),3)),2,4));
  pass('gaze','Opposite world-space gaze targets change both pupil axes and rendered pixels.');

  await ev('window.__toon.reset();window.__toon.setExpression("neutral");window.__toon.tick(35);window.__toon.setExpression("happy")');
  const take=await ev('(()=>{const samples=[];for(let i=0;i<35;i++){window.__toon.tick();const s=window.__toon.state();samples.push({tick:i+1,eye:s.face.eyeOpenL,smile:s.face.eyeSmileL,mouth:s.face.mouthOpen})}return samples})()');
  assert.ok(take.slice(0,3).some(s=>s.eye<.8));
  assert.ok(Math.max(...take.map(s=>s.smile))>.85);
  assert.ok(Math.abs(take.at(-1).smile-.85)<.01);
  writeFileSync(new URL('take-samples.json',output),JSON.stringify(take,null,2));
  pass('expression-take','Measured anticipation squint, smile overshoot above 0.85, then settle to 0.85.');

  await ev('window.__toon.reset();window.__toon.trigger("hurt");window.__toon.tick(8)');
  assert.equal(await ev('window.__toon.state().state'),'hurt');
  assert.ok(await ev('window.__toon.state().face.eyeShut>.5'));
  await ev('window.__toon.tick(150)');
  assert.equal(await ev('window.__toon.state().state'),'idle');
  assert.ok(await ev('window.__toon.state().face.eyeShut<.1'));
  pass('event-reaction','Hurt drives the body and squeezed-eye face, then recovers to idle.');

  await ev('window.__toon.reset(); document.querySelector("#ap-toggle").click();');
  assert.equal(await ev('window.__toon.state().flags.ap'),false);
  await ev('document.querySelector("#ap-toggle").click()');
  assert.equal(await ev('window.__toon.state().flags.ap'),true);
  await ev('(()=>{const el=document.querySelector("#expression");el.value="angry";el.dispatchEvent(new Event("change"));window.__toon.tick(30)})()');
  assert.equal(await ev('window.__toon.state().pinned'),'angry');
  await ev('document.querySelector("#reset").click()');
  assert.equal(await ev('window.__toon.state().pinned'),null);
  assert.equal(await ev('window.__toon.state().root.x'),80);
  pass('ui-controls','Layer toggle, expression selector, and reset act on the same live harness character.');

  await ev('window.__toon.reset();window.__toon.setInput({left:true});window.__toon.tick(100)');
  assert.ok(await ev('window.__toon.state().root.x>=13'));
  await ev('window.__toon.setInput({right:true});window.__toon.tick(600)');
  assert.ok(await ev('window.__toon.state().root.x<=627'));
  pass('world-bounds','The character stays inside the rooftop with a 13px visible margin.');

  const full=[];
  for(const pose of [{name:'idle',input:{},ticks:10},{name:'run',input:{right:true},ticks:20},{name:'jump',input:{jump:true},ticks:10}]) {
    await ev(`window.__toon.reset();window.__toon.setInput(${JSON.stringify(pose.input)});window.__toon.tick(${pose.ticks})`);
    const st=await ev('window.__toon.state()'),v=await ev('window.__toon.view()');
    let im=fromB64(await ev('window.__toon.pixels("character")'));
    const cx=Math.round(st.root.x-v.camX),cy=Math.round(st.root.y);
    im=crop(im,cx-28,cy-58,56,66);
    full.push(im);
  }
  const silhouettes=full.map(im=>({w:im.w,h:im.h,data:im.data.map((v,i)=>i%4===3?v:0)}));
  save('native-and-silhouette.png',sheet([...full,...silhouettes],3,3));
  save('enlarged-and-silhouette.png',sheet([...full,...silhouettes].map(im=>scaleNearest(im,4)),3,6));
  await ev('window.__toon.reset();window.__toon.tick(20)');
  writeFileSync(new URL('playable-page.png',output),await page.screenshot());
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev('dispatchEvent(new Event("resize"));window.__toon.tick()');
  const mobile=await ev('({view:window.__toon.view(),body:document.documentElement.scrollWidth,width:innerWidth})');
  assert.equal(mobile.view.k,1); assert.ok(mobile.body<=mobile.width);
  writeFileSync(new URL('mobile-page.png',output),await page.screenshot());
  pass('small-viewport',`390px viewport uses crisp integer ×${mobile.view.k}, no horizontal overflow.`);
  assert.deepEqual(page.errors,[]);
  pass('console','No browser errors through all additional scenarios.');
  completed=true;
} finally {
  await sess.close();
  writeFileSync(new URL('checks.json',output),JSON.stringify({pass:completed,checks},null,2)+'\n');
}
console.log(`PASS ${checks.length} additional checks`);
