// Smoke test: load a build, open every view and the main dialogs in each scenario, play a year with the clock, and report any page error.
// usage: node smoke.js [path-to-html]
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const {chromium}=require('playwright-core');
(async()=>{const file=(process.argv[2]||DEFAULT_HTML).replace(/\\/g,'/');
const b=await chromium.launch({executablePath:CHROME});const p=await b.newPage({viewport:{width:1500,height:950}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource/.test(m.text()))errs.push('console: '+m.text().slice(0,200))});
await p.goto('file:///'+file);await p.waitForTimeout(700);
const res=await p.evaluate(async()=>{const out=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 for(const sc of ['taiwan','flank','cutoff',null]){localStorage.clear();newGame('US');S.modal=null;if(sc)chooseScen(sc);else S.modal=null;S.queue=[];render();
  for(const [v] of VIEWS){S.view=v;S._vdirty=true;render();await sleep(30)}
  if(S.view!=='cmd'){S.view='cmd';render()}
  // every item page, a program page, an award, the bill, save
  for(const id of [...ORDER,...Object.keys(LINES).map(c=>'L:'+c)]){S.modal='node';S.sel=id;render()}
  const d=PROJECTS.find(d=>canStart(d)&&!d.ally&&!d.kind);S.ct={id:d.id,...ctDefault(d)};S.modal='contract';render();startProject(d.id);
  S.modal='prog';S.selP=S.projects[S.projects.length-1].uid;render();S.modal='save';render();S.modal=null;
  for(const t of ['prog','fac','home']){S.rtab=t;render()}
  // a year of play with decisions taken by default, rendering as it goes
  for(let i=0;i<60;i++){tick();for(const q of S.queue){if(q.ev){const e=ED[q.ev];if(!q.fxDone&&e.fx)e.fx();const os=V(e.o)||[];const k=defOpt({o:os});if(k>=0)evApply(os[k])}}S.queue=[];if(S.modal==='year'){render();S.modal=null}if(i%10===0){render()}}
  S.view='rules';S.rbTab='docket';S._vdirty=true;render();S.view='bn';S.bnSort='open';S._vdirty=true;render();
  out.push((sc||'open')+' ok w='+S.w+' projects='+S.projects.length)}
 return out.join(' | ')});
console.log(res);console.log('errors:',errs.length?errs.slice(0,8):'none');await b.close();process.exit(errs.length?1:0)})();
