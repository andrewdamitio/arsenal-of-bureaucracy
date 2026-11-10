// Seeded regression: plays a fixed script against a given index.html with a deterministic random stream and prints a state digest.
// usage: node regress.js <path-to-html or -> [seed] [weeks] [scenario] [v] [tag]
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const {chromium}=require('playwright-core');const crypto=require('crypto');
(async()=>{const file=process.argv[2]&&process.argv[2]!=='-'?process.argv[2]:DEFAULT_HTML,seed=+(process.argv[3]||7),weeks=+(process.argv[4]||260),scen=process.argv[5]||'taiwan';
const b=await chromium.launch({executablePath:CHROME});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(seed=>{let a=seed>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{localStorage.clear()}catch(e){}},seed);
await p.goto('file:///'+file.replace(/\\/g,'/'));await p.waitForTimeout(700);
const out=await p.evaluate(({weeks,scen})=>{newGame('US');S.modal=null;if(scen!=='open')chooseScen(scen);S.modal=null;S.queue=[];S.sim=1;
 const decide=()=>{for(const q of S.queue){if(q.ev){const e=ED[q.ev];try{if(!q.fxDone&&e.fx)e.fx();const os=V(e.o)||[];const k=defOpt({o:os});if(k>=0)evApply(os[k])}catch(err){}}}S.queue=[];if(S.modal&&S.modal!=='end')S.modal=null};
 const marks=[];
 for(let i=0;i<weeks&&!S.over;i++){tick();decide();
  if(i%9===0){const d=PROJECTS.find(d=>canStart(d)&&projCost(d)<=S.budget-1);if(d)startProject(d.id)}
  if(i%26===25){const R=production(false);marks.push([S.w,+S.pc.toFixed(3),+S.budget.toFixed(4),S.projects.length,S.plants.length,S.done.length,+raceIdx(R.out).toFixed(5),+S.exposure.toFixed(5),Object.keys(LINES).map(c=>+R.out[c].yr.toFixed(2)).join('/')].join(' '))}}
 const R=production(false);
 return {marks,final:{w:S.w,pc:S.pc,budget:S.budget,strain:S.strain,inv:S.inv,cut:S.cut,know:S.know,out:Object.fromEntries(Object.keys(LINES).map(c=>[c,R.out[c].yr])),cover:Object.fromEntries(ORDER.map(id=>[id,+R.P[id].cover.toFixed(5)])),projects:S.projects.map(q=>q.def+':'+q.stage+':'+Math.round(q.prog)),plants:S.plants.map(q=>q.def+':'+q.yield.toFixed(3)),done:S.done.map(d=>d.def+':'+d.w),log:S.log.length}}},{weeks,scen});
const digest=crypto.createHash('sha1').update(JSON.stringify(out)).digest('hex').slice(0,12);
console.log('digest',digest,'seed',seed,'weeks',weeks,scen,'errors',errs.length?errs.join(';'):'none');
if(process.argv[6]==='v')console.log(out.marks.join('\n'));
require('fs').writeFileSync(OUT+'/regress_'+(process.argv[7]||'last')+'.json',JSON.stringify(out,null,1));
await b.close()})();
