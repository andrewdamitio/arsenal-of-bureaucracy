// Standing test: an automated player runs the game with a seeded random stream and reports where the industrial base ends up.
//   node bots.js <bot> <seed> [scenario] [years] [html]
// bots:  none      takes no action; every decision gets its status-quo default
//        builder   a competent player under today's rules: decides problems promptly, starts fixes for the worst uncovered
//                  bottlenecks, expands lines at capacity, funds supplier shifts, signs allied deals. Passes no reforms.
//        reformer  the builder, plus the reform agenda through the game's own mechanics (NDAA provisions, stand-alone bills,
//                  executive permitting rules), paying their Political Capital and taking their odds.
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const {chromium}=require('playwright-core');
(async()=>{const bot=process.argv[2]||'none',seed=+(process.argv[3]||1),scen=process.argv[4]||'taiwan',years=+(process.argv[5]||10);
const file=(process.argv[6]||DEFAULT_HTML).replace(/\\/g,'/');
const b=await chromium.launch({executablePath:CHROME});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(seed=>{let a=seed>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{localStorage.clear()}catch(e){}},seed);
await p.goto('file:///'+file);await p.waitForTimeout(700);
const t0=Date.now();
const res=await p.evaluate(({bot,scen,years})=>{
 newGame('US');S.modal=null;if(scen!=='open')chooseScen(scen);S.modal=null;S.queue=[];S.sim=1;
 const act=bot!=='none',reform=bot==='reformer';
 // a decision's cost in weeks: its wait, the chance it fails, and what it costs in money, capital and lost output
 const score=o=>(o.wait||0)+(o.p!=null?(1-o.p)*((o.fail&&o.fail.wait)||14):0)+25*(o.$||0)+.8*(o.pc||0)+(o.gain?(1-o.gain)*60:0)+(o.adv?o.adv*40:0)+(o.yieldMul?(1-o.yieldMul)*80:0);
 const best=od=>{let k=-1,s=1e9;od.o.forEach((o,i)=>{if(!optOk(o))return;if((o.pc||0)>S.pc*.4||(o.$||0)>S.budget*.25)return;const v=score(o);if(v<s){s=v;k=i}});return k>=0?k:defOpt(od)};
 // an event choice is tried on a copy of the game: what it does to output now, and what it costs or earns (1 point of the requirement ~ 12 PC ~ $0.4B)
 const SK=new Set(["_R","_sc","_np","_pvc","_bnc","_kpc"]),freeze=()=>{const o={};for(const k in S)if(!SK.has(k))o[k]=S[k];return JSON.stringify(o)},thaw=t=>{S=JSON.parse(t);PJC.clear()};
 const worth=()=>{const R=production(false);return Object.keys(LINES).reduce((a,c)=>a+Math.min(1,(R.out[c].yr+allyOut(c))/Math.max(reqOut(c),1e-9)),0)/9*100};
 const pick=os=>{const ok=os.map((o,k)=>k).filter(k=>(os[k].pc||0)<=S.pc&&(os[k].$||0)<=S.budget);if(ok.length<2)return ok.length?ok[0]:defOpt({o:os});
   const base=freeze(),un=uidN;let bk=ok[0],bv=-1e9;for(const k of ok){const pc0=S.pc,b0=S.budget,h0=cnS().heat,r0=S.ru?S.ru.heat:0,st0=S.strain;try{evApply(os[k])}catch(e){}const v=worth()+(S.pc-pc0)/12+(S.budget-b0)/.4-(cnS().heat-h0)*.3-((S.ru?S.ru.heat:0)-r0)*.3-(S.strain-st0)*.1;thaw(base);uidN=un;if(v>bv+1e-9){bv=v;bk=k}}return bk};
 const events=()=>{for(const q of [...S.queue]){if(q.ev){const e=ED[q.ev];try{if(!q.fxDone&&e.fx){e.fx();q.fxDone=1}const os=V(e.o)||[];const k=act?pick(os):defOpt({o:os});if(k>=0)evApply((V(e.o)||[])[k])}catch(err){}}}S.queue=[];if(S.modal&&S.modal!=='end')S.modal=null};
 const problems=()=>{for(const q of [...S.projects]){const o=q.obs[0];if(o&&!o.wait){const k=best(OD[o.id]);if(k>=0)chooseOpt(q.uid,k)}}
   for(const pl of S.plants){const o=pl.issue;if(o&&!o.wait){const k=best(OPSD[o.id]);if(k>=0)chooseOps(pl.uid,k)}}};
 const cap=d=>!d.kind||d.kind==='cap'||d.kind==='mod';
 const go=d=>{const c=projCost(d);if(!canStart(d,c))return false;if(officeLoad()[officeOf(d)].f<1)return false;
   if(S.budget>=c+.3){startProject(d.id);return true}
   if(S.pc>=REQ_PC(c)+8&&pkgSum()+c<=billTop(pkgFY())){startProject(d.id,null,'pkg');return true}return false};
 let started=0,deals=0,stop=0;
 const build=()=>{const {rows,R0}=bnScan(),P=R0.P;let n=0;
   for(const r of rows.slice(0,8)){if(n>=2)break;if(bnCover(r,P).remP<.5)continue;
     const ls=leversFor(r.id).filter(d=>cap(d)&&!S.projects.some(q=>q.def===d.id)&&!leverDone(d)).sort((a,b)=>projGain(b)/b.dur.reduce((x,y)=>x+y,1)-projGain(a)/a.dur.reduce((x,y)=>x+y,1));
     for(const d of ls)if(go(d)){started++;n++;break}}
   for(const r of rows.slice(0,3))if(S.nodes[r.id].base>0&&!nshiftOn(r.id)&&S.budget>2)toggleNShift(r.id);
   if(S.dfars&&!carveOn('cvDfars')&&carveAvail(CD.cvDfars)&&S.pc>=carveCost(CD.cvDfars)+10)startCarve('cvDfars'); // keep the magnet waiver alive until compliant supply exists
   // stopgaps a competent player uses while plants are built: emergency purchases and DPA priority on the worst shortages
   for(const r of rows.slice(0,5)){const p=P[r.id];if(p.cover>=.9)continue;
     if(ND[r.id].civ&&!S.prio[r.id]&&S.pc>=25&&S.strain<40){togglePrio(r.id);stop++}
     if(spotKind(r.id)&&S.spot.filter(x=>x.id===r.id).length<2&&S.budget>=spotCost(r.id)+3){spotBuy(r.id);stop++}}
   const out=R0.out;for(const c of S.order){if(n>=3)break;const o=out[c];if(o.bott||suffLine(c,o.yr)>=1)continue;if(S.projects.some(q=>PD[q.def].t.line===c))continue;
     const d=PROJECTS.find(d=>d.t.line===c&&!d.kind&&canStart(d));if(d&&go(d)){started++;n++}}
   for(const D of ALLY_DEALS)if(alDealOk(D)&&S.pc>=D.pc+15&&S.budget>=(D.$||0)+1&&suffLine(D.c,out[D.c].yr)<1){alDeal(D.id);deals++}};
 const NDAA=['multiyear','ceDefense','acq','qualReform','itarReform','acqWorkforce','dpaMin','crAnomaly','dpaFund','pricefloor','antitrust','byrnes'],BILLS=['nepaReform','judRev','workforce','expertVisa','jonesReform','tariffExempt'],EXEC=['rFAST','rNSR','rWOTUS','rITAR','rKnown'];
 const reforms=()=>{for(const id of EXEC){const r=RD2[id];if(r&&!ruleOn(id)&&S.pc>=r.pc[0]+10){toggleRule(id);break}}
   if(!S.bill)for(const id of BILLS){const R=RD[id];if(R&&reformAvail(R)&&!inReq(id)&&S.pc>=reformCost(R)+5&&(R.$||0)<=S.budget){introduce(id);break}}
   for(const id of NDAA){const R=RD[id];if(R&&reformAvail(R)&&!inReq(id)&&S.pc>=refReqCost(R)+5&&(R.$||0)<=S.budget){refAdd(id);break}}};
 const start=Object.fromEntries(Object.keys(LINES).map(c=>[c,production(false).out[c].yr]));
 const snap=()=>{const R=production(false),dn=S.done.filter(d=>d.plan&&!d.inh&&d.w>=PLAY0&&!PD[d.def].ally);
   return {date:fmtDate(S.w),share:+(raceIdx(R.out)*100).toFixed(1),suff:Object.keys(LINES).filter(c=>suffLine(c,R.out[c].yr)>=1).length,
    out:Object.fromEntries(Object.keys(LINES).map(c=>[c,Math.round(R.out[c].yr)])),vsStart:Object.fromEntries(Object.keys(LINES).map(c=>[c,+(R.out[c].yr/Math.max(start[c],1e-9)).toFixed(2)])),
    zero:Object.keys(LINES).filter(c=>R.out[c].yr<start[c]*.05).length,plants:S.plants.filter(x=>x.nm).length,finished:dn.length,avgYears:dn.length?+(dn.reduce((a,d)=>a+d.weeks,0)/dn.length/52).toFixed(1):null,planYears:dn.length?+(dn.reduce((a,d)=>a+d.plan,0)/dn.length/52).toFixed(1):null,
    diag:Object.fromEntries(Object.keys(LINES).map(c=>{const o=R.out[c],b=o.chain.length?o.chain[o.chain.length-1]:null,p=b&&R.P[b],nd=p?Math.max(p.need,1e-9):1;return [c,{use:+(o.n/Math.max(o.cap,1e-9)).toFixed(2),cap:+(o.capYr/Math.max(start[c],1e-9)).toFixed(2),binds:b?o.chain.map(i=>ND[i].n).join(' < '):'line capacity',root:b?{cover:+p.cover.toFixed(2),dom:+(p.dom/nd).toFixed(2),ally:+(p.ally/nd).toFixed(2),neut:+(p.neut/nd).toFixed(2),prc:+(p.prc/nd).toFixed(2),lost:+(p.lost/nd).toFixed(2),cut:+cutOf(b).toFixed(2),mods:S.tmods.filter(m=>m.id===b).map(m=>m.kind+' x'+m.mult+' '+(m.label||'')+' '+(m.left>999?'perm':m.left+'wk')).join('; ')}:null}]})),dfars:!!S.dfars,truce:S.truce,live:S.projects.length,stalled:S.projects.filter(q=>q.obs.length).length,budget:+S.budget.toFixed(1),pc:Math.round(S.pc),spent:+sumV(S.spendBy||{}).toFixed(1),reforms:Object.keys(S.reforms).filter(k=>S.reforms[k]==='passed').length,beijing:cnS().rung,started,deals,stop}};
 const marks=[snap()];const mid=scen!=='open'?SCD[scen].mid:weekOf(2030,0,7),dl=scen!=='open'?SCD[scen].dl:weekOf(2035,0,8);
 for(let i=0;i<52*years&&!S.over;i++){tick();events();
   if(act){problems();if(i%4===0)build();if(reform&&i%4===2)reforms()}
   if(S.w===mid||S.w===dl||i===52*years-1||S.over)marks.push(snap())}
 return {marks,mid:S.scenMid?{verdict:S.scenMid.verdict,floors:S.scenMid.floors,of:S.scenMid.of,test:S.scenMid.test.ok}:null,scen:S.scenRes?{verdict:S.scenRes.verdict,met:S.scenRes.met,of:S.scenRes.ms.length,floors:S.scenRes.ms.filter(x=>x.ok||x.half).length,test:S.scenRes.test.ok}:null,
   modelCheck:(()=>{try{const r=btRows();return {ok:r.filter(b=>b.ok).length,of:r.length,miss:r.filter(b=>!b.ok).map(b=>b.n)}}catch(e){return null}})(),lost:Object.fromEntries(Object.entries(S.ledger).sort((a,b)=>b[1].wk-a[1].wk).slice(0,5).map(([k,v])=>[LAYERS[k].n,Math.round(v.wk)])),passed:Object.keys(S.reforms).filter(k=>S.reforms[k]==='passed')}},{bot,scen,years});
res.bot=bot;res.seed=seed;res.secs=Math.round((Date.now()-t0)/1000);res.errors=errs;
require('fs').writeFileSync(OUT+'/bot_'+bot+'_'+scen+'_'+seed+'.json',JSON.stringify(res));
const m=res.marks;console.log(`${bot} seed ${seed} ${scen}: share ${m.map(x=>x.share+'%').join(' → ')} | lines at zero ${m[m.length-1].zero} | finished ${m[m.length-1].finished} (avg ${m[m.length-1].avgYears} yr vs plan ${m[m.length-1].planYears}) | reforms ${m[m.length-1].reforms} | ${res.mid?'2030: '+res.mid.floors+'/'+res.mid.of+' floors':''}${res.scen?' · 2035: '+res.scen.met+'/'+res.scen.of+' targets':''} | ${res.secs}s${errs.length?' ERRORS '+errs[0]:''}`);
await b.close()})();
