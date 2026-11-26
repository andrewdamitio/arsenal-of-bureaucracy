// Visual check: screenshots of the key screens in a fixed test game, compared with the last approved set.
//   node tools/visual.js            compare against the approved set; lists screens that changed
//   node tools/visual.js --update   approve the current screens as the new set
//   node tools/visual.js --only ndaa-congress,item   just those screens
// The approved set and the diff images live in tools/out/visual (not committed). A changed screen is not necessarily
// wrong: open its diff image (changed pixels in red over the new screen) and approve it with --update if it is intended.
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');const {chromium}=require('playwright-core');const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),UPDATE=args.includes('--update'),ONLY=args.includes('--only')?(args[args.indexOf('--only')+1]||'').split(',').filter(Boolean):[];
const DIR=path.join(OUT,'visual'),BASE=path.join(DIR,'baseline'),NEW=path.join(DIR,'current'),DIFF=path.join(DIR,'diff');for(const d of [DIR,BASE,NEW,DIFF])fs.mkdirSync(d,{recursive:true});
const THRESH=0.0001; // share of pixels that must change before a screen is reported (about 140 pixels on the desktop screens; unchanged screens match exactly)

// the fixed test game: game 314159, the Taiwan Window, two plants built, three plants, a deal and a stockpile buy requested
const setup=`localStorage.clear();NEXT_GNO=314159;newGame('US');NEXT_GNO=null;chooseScen('taiwan');S.queue=[];S.tut=null;S.guide=0;S.tips=0;S.modal=null;S.pc=200;
  for(const d of PROJECTS.filter(x=>needsContract(x)&&canStart(x)).slice(0,2))startProject(d.id,ctDefault(d),'now');
  for(const d of PROJECTS.filter(x=>needsContract(x)&&canStart(x)).slice(0,3))startProject(d.id,ctDefault(d),'pkg');alReq('jpPac');ndsAdd('hree');
  window._play=(n,keep)=>{S.trn0=S.trn0||trnSnap();for(let i=0;i<n;i++){tick();if(keep&&S.queue.some(keep))return true;S.queue=[];S.inbox=[];S.modal=null;for(const q of S.projects){const o=q.obs[0];if(o&&!o.wait){const j=defOpt(OD[o.id]);if(j>=0)chooseOpt(q.uid,j)}}}return false};`;
// the game states the screens are taken in
const ST={S30:setup+'_play(30);',brief:setup,report:setup+'_play(30);S.trn0=trnSnap();_play(8);turnDone();',markup:setup+"_play(60,q=>q.sys==='mk');",end:setup+'_play(400);gameOver();'};
// background work (the do-nothing comparison, value for money) is finished before each screenshot, so every run draws the same thing
const settle=`if(typeof S==='object'&&S){for(let i=0;i<800&&!(S.base&&S.base.done)&&S.w>=PLAY0;i++)baseTick();for(let k=0;k<6;k++){render();let n=0;while(VFM.q.length&&n<400){vfmWork();n++}VFM.busy=false}S._vdirty=true;render()}`;
const quiet=`if(typeof S==='object'&&S)S._rcpt=null;{const t=document.getElementById('toasts');if(t)t.innerHTML='';document.getElementById('receipt')?.remove()}`;
const v=(x,extra='')=>`S.modal=null;S.view='${x}';${extra}S._vdirty=true;render()`;
// each screen: name, viewport (d desktop, p phone), game state, what to open, optional element to scroll to
const SCREENS=[
 ['title','d',null,"S=null;TSCR='menu';renderTitle()"],['newgame','d',null,"S=null;TSCR='new';renderTitle()"],
 ['brief','d','brief',"S.modal='sbrief';render()"],
 ['cmd','d','S30',v('cmd')],['cmd-lines','d','S30',v('cmd'),'.rcsort'],['bottlenecks','d','S30',v('bn')],['flows','d','S30',v('flow')],
 ['allies','d','S30',v('allies')],['imports','d','S30',v('imports')],
 ['ndaa-congress','d','S30',v('ndaa',"S.ndTab='cong';")],['ndaa-reforms','d','S30',v('ndaa',"S.ndTab='ref';")],['ndaa-plants','d','S30',v('ndaa',"S.ndTab='plant';")],['ndaa-orders','d','S30',v('ndaa',"S.ndTab='ord';")],
 ['policy','d','S30',v('policy')],['permits','d','S30',v('rules')],['stocks','d','S30',v('arsenal')],['record','d','S30',v('rec')],['sources','d','S30',v('src')],
 ['factories','d','S30',v('fac')],['home-front','d','S30',v('cmd',"S.rtab='home';")],
 ['item','d','S30',"S.view='cmd';S.rtab='prog';S.modal='node';S.sel='magnets';render()"],['line','d','S30',"S.view='cmd';S.modal='node';S.sel='L:interceptors';render()"],
 ['program','d','S30',"S.view='cmd';S.modal='prog';S.selP=S.projects.find(p=>!p.inh&&!p.pkg&&!p.apw)?.uid;render()"],['new-order','d','S30',"S.view='cmd';S.modal='cat';render()"],
 ['menu','d','S30',"S.view='cmd';S.modal='save';render()"],
 ['report','d','report',"S.view='cmd';S.modal='turn';render()"],
 ['markup','d','markup',"S.view='cmd';S.queue=S.queue.filter(q=>q.sys==='mk');S.modal=null;render()"],
 ['end','d','end',"S.view='cmd';S.modal='end';render()"],
 ['p-cmd','p','S30',v('cmd')],['p-lines','p','S30',v('cmd'),'.rcsort'],['p-ndaa','p','S30',v('ndaa',"S.ndTab='cong';")],
 ['p-markup','p','markup',"S.view='cmd';S.queue=S.queue.filter(q=>q.sys==='mk');S.modal=null;render()"],['p-report','p','report',"S.view='cmd';S.modal='turn';render()"],
];
const VP={d:{viewport:{width:1500,height:950}},p:{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}};
(async()=>{const b=await chromium.launch({executablePath:CHROME});const errs=[];const ctx={};
 const page=async k=>{if(ctx[k])return ctx[k];const c=await b.newContext(VP[k]);
   // seeded randomness, no animation, no blinking caret: the same game draws the same pixels every run
   await c.addInitScript(()=>{let a=12345;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
     addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.appendChild(st)})});
   const p=await c.newPage();p.on('pageerror',e=>errs.push(k+': '+e.message));await p.goto('file:///'+DEFAULT_HTML);await p.waitForTimeout(400);return ctx[k]=p};
 const results=[],cur={};
 for(const [name,vp,st,act,scroll] of SCREENS){if(ONLY.length&&!ONLY.includes(name))continue;const p=await page(vp);
   try{if(st&&cur[vp]!==st){await p.reload();await p.waitForTimeout(400);await p.evaluate(ST[st]);cur[vp]=st} /* a fresh page per game state: counters left over from an earlier game would change its luck */if(!st)cur[vp]=null;await p.evaluate(act+';'+quiet+';'+settle+';'+quiet)}catch(e){errs.push(name+': '+e.message);continue}
   await p.waitForTimeout(400);
   if(scroll)await p.evaluate(sel=>{const e=document.querySelector(sel);if(e)e.scrollIntoView({block:'start'})},scroll);
   else await p.evaluate(()=>{for(const id of ['needs','view','supply','right'])if(document.getElementById(id))document.getElementById(id).scrollTop=0;window.scrollTo(0,0)});
   await p.evaluate(()=>{const t=document.getElementById('toasts');if(t)t.innerHTML='';document.getElementById('receipt')?.remove();const tp=document.getElementById('tip');if(tp)tp.style.display='none'});
   await p.mouse.move(1,1);await p.waitForTimeout(200);
   await p.screenshot({path:path.join(UPDATE?BASE:NEW,name+'.png')});results.push(name)}
 if(UPDATE){console.log(`Approved ${results.length} screens in ${BASE}`);if(errs.length)console.log('Errors:',errs);await b.close();return}
 // compare in a page: draw both images on canvases and count pixels that differ noticeably; mark them red over the new one
 const cmp=await b.newPage();const rows=[];
 for(const name of results){const fb=path.join(BASE,name+'.png'),fn=path.join(NEW,name+'.png');if(!fs.existsSync(fb)){rows.push([name,'new screen (no approved image yet)']);continue}
   const r=await cmp.evaluate(async([a,c])=>{const load=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src=src});const A=await load(a),C=await load(c);
     if(A.width!==C.width||A.height!==C.height)return {size:`${A.width}x${A.height} → ${C.width}x${C.height}`};
     const cv=()=>{const x=document.createElement('canvas');x.width=C.width;x.height=C.height;return x},ca=cv(),cc=cv();const ga=ca.getContext('2d'),gc=cc.getContext('2d');ga.drawImage(A,0,0);gc.drawImage(C,0,0);
     const da=ga.getImageData(0,0,C.width,C.height).data,dc=gc.getImageData(0,0,C.width,C.height);const d=dc.data;let n=0,x0=1e9,y0=1e9,x1=-1,y1=-1;
     for(let i=0;i<d.length;i+=4){const dd=Math.abs(da[i]-d[i])+Math.abs(da[i+1]-d[i+1])+Math.abs(da[i+2]-d[i+2]);
       if(dd>48){n++;const px=(i/4)%C.width,py=Math.floor(i/4/C.width);x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);d[i]=230;d[i+1]=30;d[i+2]=30}
       else{d[i]=d[i]*.35+165;d[i+1]=d[i+1]*.35+165;d[i+2]=d[i+2]*.35+165}}
     gc.putImageData(dc,0,0);return {frac:n/(C.width*C.height),box:x1<0?null:[x0,y0,x1,y1],png:n?cc.toDataURL('image/png'):null}},
     ['data:image/png;base64,'+fs.readFileSync(fb).toString('base64'),'data:image/png;base64,'+fs.readFileSync(fn).toString('base64')]);
   if(r.size){rows.push([name,'size changed '+r.size]);continue}
   const df=path.join(DIFF,name+'.png');if(r.png)fs.writeFileSync(df,Buffer.from(r.png.split(',')[1],'base64'));else if(fs.existsSync(df))fs.unlinkSync(df);
   if(r.frac>THRESH)rows.push([name,`${(r.frac*100).toFixed(2)}% of pixels changed, around x ${r.box[0]}–${r.box[2]}, y ${r.box[1]}–${r.box[3]}  (diff: ${df})`])}
 console.log(rows.length?`${rows.length} of ${results.length} screens changed:\n`+rows.map(([n,t])=>`  ${n.padEnd(14)} ${t}`).join('\n'):`All ${results.length} screens match the approved set.`);
 if(errs.length)console.log('Errors:',errs);await b.close()})();
