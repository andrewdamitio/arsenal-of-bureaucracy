// Standing test: an automated player runs the game with a seeded random stream and reports where the industrial base ends up.
//   node bots.js <bot> <seed> [scenario] [years] [html]
// bots:  none      takes no action; every decision gets its status-quo default
//        builder   a competent player under today's rules. It plans against the scenario's targets: it looks at what will still hold
//                  each target line back once everything under way has landed, and starts the plant, deal or upgrade that raises that
//                  line most per dollar. It decides problems promptly, weighs event choices, buys stopgaps, and signs allied deals.
//                  It passes no reforms.
//        reformer  the builder, plus the reform agenda through the game's own mechanics (NDAA provisions, stand-alone bills,
//                  executive permitting rules), paying their Political Capital and taking their odds. Reforms get first call on capital.
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const {chromium}=require('playwright-core');
(async()=>{const bot=process.argv[2]||'none',seed=+(process.argv[3]||1),scen=process.argv[4]||'taiwan',years=+(process.argv[5]||10);
const file=(process.argv[6]||DEFAULT_HTML).replace(/\\/g,'/');
const b=await chromium.launch({executablePath:CHROME});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(seed=>{let a=seed>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{localStorage.clear()}catch(e){}},seed);
await p.goto('file:///'+file);await p.waitForTimeout(700);
const t0=Date.now();
const res=await p.evaluate(({bot,scen,years,DUMP,START})=>{
 newGame('US');S.modal=null;if(scen!=='open')chooseScen(scen);S.modal=null;S.queue=[];S.sim=1;
 const act=bot!=='none',reform=bot==='reformer';
 // ---- decisions
 // a problem option's cost in weeks: its wait, the chance it fails, and what it costs in money, capital and lost output
 const score=o=>(o.wait||0)+(o.p!=null?(1-o.p)*((o.fail&&o.fail.wait)||14):0)+25*(o.$||0)+.8*(o.pc||0)+(o.gain?(1-o.gain)*60:0)+(o.adv?o.adv*40:0)+(o.yieldMul?(1-o.yieldMul)*80:0);
 const best=od=>{let k=-1,s=1e9;od.o.forEach((o,i)=>{if(!optOk(o))return;if((o.pc||0)>S.pc*.4||(o.$||0)>S.budget*.25)return;const v=score(o);if(v<s){s=v;k=i}});return k>=0?k:defOpt(od)};
 // an event choice is tried on a copy of the game: what it does to output now, and what it costs or earns (1 point of the requirement ~ 12 PC ~ $0.4B)
 const SK=new Set(['_R','_sc','_np','_pvc','_bnc','_kpc']),freeze=()=>{const o={};for(const k in S)if(!SK.has(k))o[k]=S[k];return JSON.stringify(o)},thaw=t=>{S=JSON.parse(t);PJC.clear()};
 const worth=()=>{const R=production(false);return Object.keys(LINES).reduce((a,c)=>a+Math.min(1,(R.out[c].yr+allyOut(c))/Math.max(reqOut(c),1e-9)),0)/9*100};
 const pick=os=>{const ok=os.map((o,k)=>k).filter(k=>(os[k].pc||0)<=S.pc&&(os[k].$||0)<=S.budget);if(ok.length<2)return ok.length?ok[0]:defOpt({o:os});
   const base=freeze(),un=uidN;let bk=ok[0],bv=-1e9;for(const k of ok){const pc0=S.pc,b0=S.budget,h0=cnS().heat,r0=S.ru?S.ru.heat:0,st0=S.strain;try{evApply(os[k])}catch(e){}const v=worth()+(S.pc-pc0)/12+(S.budget-b0)/.4-(cnS().heat-h0)*.3-((S.ru?S.ru.heat:0)-r0)*.3-(S.strain-st0)*.1;thaw(base);uidN=un;if(v>bv+1e-9){bv=v;bk=k}}return bk};
 const events=()=>{for(const q of [...S.queue]){if(q.ev){const e=ED[q.ev];try{if(!q.fxDone&&e.fx){e.fx();q.fxDone=1}const os=V(e.o)||[];const k=act?pick(os):defOpt({o:os});if(k>=0)evApply((V(e.o)||[])[k])}catch(err){}}}S.queue=[];if(S.modal&&S.modal!=='end')S.modal=null};
 const problems=()=>{for(const q of [...S.projects]){const o=q.obs[0];if(o&&!o.wait){const k=best(OD[o.id]);if(k>=0)chooseOpt(q.uid,k)}}
   for(const pl of S.plants){const o=pl.issue;if(o&&!o.wait){const k=best(OPSD[o.id]);if(k>=0)chooseOps(pl.uid,k)}}};
 // ---- building
 const cap=d=>!d.kind||d.kind==='cap'||d.kind==='mod';
 const tg=scen!=='open'?SCD[scen].mand.filter(m=>m.c).map(m=>[m.c,m.tgt]):[],keep=scen!=='open'?SCD[scen].mand.find(m=>m.kind==='keep'):null;
 // put a project's capacity in place as if finished (count: whether it is a new order, which raises the price of the next repeat)
 const land=(d,count)=>{if(count)S.built[d.id]=(S.built[d.id]||0)+1;const g=projGain(d,1);
   if(d.t.line)S.plants.push({uid:-1,def:d.id,nm:d.n,kind:'line',target:d.t.line,gain:g,yield:1,issue:null,full:true,adv:0,start:S.w});
   else if(d.ally){const ch=d.nt?S.nodes[d.t.node].neut:S.nodes[d.t.node].ally;ch.amt+=g}
   else if(d.kind==='mod'){const s=S.nodes[d.t.node];s.base=s.base>1e-6?s.base*1.15:s.scale*.05;(S.nflags[d.t.node]=S.nflags[d.t.node]||{}).mod=true}
   else S.plants.push({uid:-1,def:d.id,nm:d.n,kind:'node',target:d.t.node,gain:g,yield:1,issue:null,full:true,adv:d.adv||0,start:S.w})};
 // run fn against the industrial base as it will be once every program under way has landed and every plant has ramped; then put it all back
 const future=fn=>{const np=S.plants.length,built={...S.built},nf=JSON.stringify(S.nflags),ys=S.plants.map(x=>x.yield),iss=S.plants.map(x=>x.issue),
     nd=Object.fromEntries(ORDER.map(id=>[id,[S.nodes[id].ally.amt,S.nodes[id].neut.amt,S.nodes[id].base]]));
   const ord0=S.ord;S.ord=null; // plan as if new capacity will be ordered
   for(const pl of S.plants){pl.yield=1;pl.issue=null}
   for(const q of S.projects){const d=PD[q.def];if(d.t.line?!d.kind:cap(d))land(d,false)}
   try{return fn()}finally{S.ord=ord0;S.plants.length=np;S.plants.forEach((x,i)=>{x.yield=ys[i];x.issue=iss[i]});S.built=built;S.nflags=JSON.parse(nf);for(const id of ORDER){const [a,n,bs]=nd[id];S.nodes[id].ally.amt=a;S.nodes[id].neut.amt=n;S.nodes[id].base=bs}}};
 const ok=d=>canStart(d)&&(!d.req||passed(d.req));
 const levers=id=>leversFor(id).filter(x=>cap(x)&&ok(x)&&!(x.kind==='mod'&&(S.nflags[id]||{}).mod)).sort((a,b)=>projGain(b)/projCost(b)-projGain(a)/projCost(a));
 // what a finished project would add to a line, measured and then undone
 const trial=(d,c,R)=>{const b0=S.built[d.id]||0,np=S.plants.length,s=d.t.node?S.nodes[d.t.node]:null,a0=s?s.ally.amt:0,n0=s?s.neut.amt:0,base0=s?s.base:0,f0=s?{...(S.nflags[d.t.node]||{})}:null;land(d,true);let g=0;try{g=production(false).out[c].n-R.out[c].n}finally{S.built[d.id]=b0;S.plants.length=np;if(s){s.ally.amt=a0;s.neut.amt=n0;s.base=base0;S.nflags[d.t.node]=f0}}return g};
 // which item, given more of it, raises this line's output most; if several bind together, the worst-covered
 const binding=(c,R)=>{const ups=[...upOf('L:'+c)].filter(id=>R.P[id].need>1e-6&&R.P[id].cover<1.2&&levers(id).length);let bst=null,bg=1e-9;
   for(const id of ups){const x={id,amt:R.P[id].need*1.3+1e-6,left:1};S.spot.push(x);let g=0;try{g=production(false).out[c].n-R.out[c].n}finally{S.spot.splice(S.spot.indexOf(x),1)}if(g>bg){bg=g;bst=id}}
   if(bst)return bst;const short=ups.filter(id=>R.P[id].cover<.999).sort((a,b)=>R.P[a].cover-R.P[b].cover);return short[0]||null};
 // the next orders: for the target line furthest behind, the fix that raises it most per dollar
 const nextFor=(c,R,noCn)=>{const o=R.out[c];if(o.n>=o.cap-1e-9)return PROJECTS.filter(x=>x.t.line===c&&!x.kind&&ok(x)).sort((a,b)=>b.gain/projCost(b)-a.gain/projCost(a))[0]||null;
   const id=binding(c,R);if(!id)return null;const pool=new Set([id]);for(const i of ND[id].in){pool.add(i);for(const j of ND[i].in)pool.add(j)}
   let d=null,bv=0;for(const n of pool){if(R.P[n].cover>1.15)continue;for(const x of levers(n).slice(0,4)){if(noCn&&(x.adv||0)>.05)continue;const g=trial(x,c,R);const v=g/projCost(x);if(v>bv+1e-12){bv=v;d=x}}}
   if(!d){const low=[...pool].filter(n=>levers(n).length).sort((a,b)=>R.P[a].cover-R.P[b].cover)[0];d=low?levers(low)[0]:null}return d};
 const plan=K=>future(()=>{const picks=[];
   for(let n=0;n<K;n++){const R=production(false);const behind=tg.map(([c,t])=>[c,R.out[c].yr/t]).filter(x=>x[1]<.999).sort((a,b)=>a[1]-b[1]);let d=null;
     for(const [c] of behind){d=nextFor(c,R,false);if(d)break}
     // and the lines that would fall furthest if China cut everything off
     if(!d&&keep){let now=R.out,cut;NO_PRC=true;try{const Rc=production(false);cut=Rc.out;const weak=keep.lines.map(c=>[c,cut[c].yr/Math.max(now[c].yr,S.rec0?.out?.[c]||0,1e-9)]).filter(x=>x[1]<keep.tgt).sort((a,b)=>a[1]-b[1]);for(const [c] of weak){d=nextFor(c,Rc,true);if(d)break}}finally{NO_PRC=false}}
     if(!d)break;picks.push(d);land(d,true)}
   return picks});
 const go=d=>{const c=projCost(d);if(!canStart(d,c))return false;const o=officeLoad()[officeOf(d)];if(o.n>=o.cap)return false;
   if(S.budget>=c+.3){startProject(d.id);return true}
   if(S.pc>=REQ_PC(c)+8+reserve()&&pkgSum()+c<=billTop(pkgFY())){startProject(d.id,null,'pkg');return true}return false};
 let started=0,deals=0,stop=0;
 const build=()=>{let n=0;
   if(tg.length){for(const d of plan(4)){if(n>=3)break;if(go(d)){started++;n++}}}
   const {rows,R0}=bnScan(),P=R0.P;
   if(!tg.length){for(const r of rows.slice(0,8)){if(n>=2)break;if(bnCover(r,P).remP<.5)continue;for(const d of levers(r.id))if(go(d)){started++;n++;break}}}
   for(const r of rows.slice(0,3))if(S.nodes[r.id].base>0&&!nshiftOn(r.id)&&S.budget>2)toggleNShift(r.id);
   if(S.dfars&&!carveOn('cvDfars')&&carveAvail(CD.cvDfars)&&S.pc>=carveCost(CD.cvDfars)+10)startCarve('cvDfars'); // keep the magnet waiver alive until compliant supply exists
   // a stopgap while plants are built: emergency purchases for the worst shortages
   for(const r of rows.slice(0,5)){const p=P[r.id];if(p.cover>=.9)continue;
     if(spotKind(r.id)&&S.spot.filter(x=>x.id===r.id).length<2&&S.budget>=spotCost(r.id)+3){spotBuy(r.id);stop++}}
   // order what the lines can make: request it in the NDAA, or buy a year from the budget when money is spare
   for(const c of Object.keys(LINES)){const o=R0.out[c];const gap=o.physYr-ordOf(c);if(!isFinite(gap)||gap<=o.physYr*.03||ordReqs().some(x=>x.c===c))continue;
     if(S.pc>=ordPC(c,gap))ordAdd(c,gap)}
   const out=R0.out;for(const D of ALLY_DEALS)if(alDealOk(D)&&S.pc>=D.pc+15+reserve()&&S.budget>=(D.$||0)+1&&suffLine(D.c,out[D.c].yr)<1){alDeal(D.id);deals++}};
 // ---- reforms
 const NDAA=['acq','byrnes','ceDefense','qualReform','multiyear','acqWorkforce','pricefloor','itarReform','dpaMin','crAnomaly','dpaFund','antitrust'],BILLS=['nepaReform','workforce','judRev','expertVisa','jonesReform','tariffExempt'],EXEC=['rFAST','rNSR','rWOTUS','rITAR','rKnown'];
 // the reformer keeps enough Political Capital in hand for its next reform before it spends any on plant requests
 // one agenda in priority order, NDAA provisions and stand-alone bills together; the reformer saves for the next item rather than skipping it
 const AGENDA=['acq','byrnes','saws','nepaReform','ceDefense','qualReform','multiyear','ibfPerm','workforce','acqWorkforce','pricefloor','itarReform','judRev','dpaMin','crAnomaly','dpaFund','expertVisa','antitrust','jonesReform','tariffExempt'];
 const costOf=R=>vehOf(R)==='ndaa'?refReqCost(R):reformCost(R);
 const nextRef=()=>AGENDA.map(id=>RD[id]).find(R=>R&&reformAvail(R)&&!inReq(R.id)&&S.bill?.id!==R.id&&(vehOf(R)==='ndaa'||!S.bill));
 const reserve=()=>{if(!reform)return 0;const R=nextRef();return R?costOf(R):0};
 const reforms=()=>{const R=nextRef();if(R){if(S.pc>=costOf(R)&&(R.$||0)<=S.budget){if(vehOf(R)==='ndaa')refAdd(R.id);else introduce(R.id)}return}
   for(const id of EXEC){const r=RD2[id];if(r&&!ruleOn(id)&&S.pc>=r.pc[0]+10){toggleRule(id);break}}};
 // ---- reporting
 const start=Object.fromEntries(Object.keys(LINES).map(c=>[c,production(false).out[c].yr]));
 const snap=()=>{const R=production(false),dn=S.done.filter(d=>d.plan&&!d.inh&&d.w>=PLAY0&&!PD[d.def].ally);
   return {date:fmtDate(S.w),share:+(raceIdx(R.out)*100).toFixed(1),suff:Object.keys(LINES).filter(c=>suffLine(c,R.out[c].yr)>=1).length,
    out:Object.fromEntries(Object.keys(LINES).map(c=>[c,Math.round(R.out[c].yr)])),vsStart:Object.fromEntries(Object.keys(LINES).map(c=>[c,+(R.out[c].yr/Math.max(start[c],1e-9)).toFixed(2)])),
    vsTarget:Object.fromEntries(tg.map(([c,t])=>[c,+(R.out[c].yr/t).toFixed(2)])),
    zero:Object.keys(LINES).filter(c=>R.out[c].yr<start[c]*.05).length,plants:S.plants.filter(x=>x.nm).length,finished:dn.length,avgYears:dn.length?+(dn.reduce((a,d)=>a+d.weeks,0)/dn.length/52).toFixed(1):null,planYears:dn.length?+(dn.reduce((a,d)=>a+d.plan,0)/dn.length/52).toFixed(1):null,
    diag:Object.fromEntries(Object.keys(LINES).map(c=>{const o=R.out[c],b=o.chain.length?o.chain[o.chain.length-1]:null,p=b&&R.P[b],nd=p?Math.max(p.need,1e-9):1;return [c,{use:+(o.n/Math.max(o.cap,1e-9)).toFixed(2),cap:+(o.capYr/Math.max(start[c],1e-9)).toFixed(2),binds:b?o.chain.map(i=>ND[i].n).join(' < '):'line capacity',root:b?{cover:+p.cover.toFixed(2),dom:+(p.dom/nd).toFixed(2),ally:+(p.ally/nd).toFixed(2),neut:+(p.neut/nd).toFixed(2),prc:+(p.prc/nd).toFixed(2),lost:+(p.lost/nd).toFixed(2),cut:+cutOf(b).toFixed(2),mods:S.tmods.filter(m=>m.id===b).map(m=>m.kind+' x'+m.mult+' '+(m.label||'')+' '+(m.left>999?'perm':m.left+'wk')).join('; ')}:null}]})),
    dfars:!!S.dfars,truce:S.truce,live:S.projects.length,stalled:S.projects.filter(q=>q.obs.length).length,budget:+S.budget.toFixed(1),pc:Math.round(S.pc),strain:Math.round(S.strain),pcRate:+(pcRate()*52).toFixed(0),div:(S.divIds||[]).length,divLoad:+(S.divLoad||0).toFixed(2),
    spent:+sumV(S.spendBy||{}).toFixed(1),reforms:Object.keys(S.reforms).filter(k=>S.reforms[k]==='passed').length,beijing:cnS().rung,started,deals,stop}};
 if(START){try{(0,eval)(START)}catch(e){console.error(e)}}
 const marks=[snap()];const mid=scen!=='open'?SCD[scen].mid:weekOf(2030,0,7),dl=scen!=='open'?SCD[scen].dl:weekOf(2035,0,8);
 for(let i=0;i<52*years&&!S.over;i++){tick();events();
   if(act){problems();if(reform&&i%2===0)reforms();if(i%4===0)build()}
   if(S.w===mid||S.w===dl||i===52*years-1||S.over)marks.push(snap())}
 const dump=DUMP?(()=>{try{return (0,eval)(DUMP)}catch(e){return String(e)}})():null;
 return {dump,marks,mid:S.scenMid?{verdict:S.scenMid.verdict,floors:S.scenMid.floors,of:S.scenMid.of,test:S.scenMid.test.ok}:null,scen:S.scenRes?{verdict:S.scenRes.verdict,met:S.scenRes.met,of:S.scenRes.ms.length,floors:S.scenRes.ms.filter(x=>x.ok||x.half).length,test:S.scenRes.test.ok}:null,
   modelCheck:(()=>{try{const r=btRows();return {ok:r.filter(b=>b.ok).length,of:r.length,miss:r.filter(b=>!b.ok).map(b=>b.n)}}catch(e){return null}})(),lost:Object.fromEntries(Object.entries(S.ledger).sort((a,b)=>b[1].wk-a[1].wk).slice(0,5).map(([k,v])=>[LAYERS[k].n,Math.round(v.wk)])),passed:Object.keys(S.reforms).filter(k=>S.reforms[k]==='passed'),orders:[...S.done.filter(d=>!d.inh&&d.w>=PLAY0).map(d=>d.def),...S.projects.filter(q=>!q.inh).map(q=>q.def+(q.pkg?'(req)':''))]}},{bot,scen,years,DUMP:process.env.AOB_DUMP||null,START:process.env.AOB_START||null});
res.bot=bot;res.seed=seed;res.secs=Math.round((Date.now()-t0)/1000);res.errors=errs;
require('fs').writeFileSync(OUT+'/bot_'+bot+'_'+scen+'_'+seed+'.json',JSON.stringify(res));
if(res.dump)console.log("DUMP",JSON.stringify(res.dump,null,1));
const m=res.marks,L=m[m.length-1];console.log(`${bot} seed ${seed} ${scen}: share ${m.map(x=>x.share+'%').join(' → ')} | finished ${L.finished} of ${L.started} started (avg ${L.avgYears} yr vs plan ${L.planYears}) | reforms ${L.reforms} | ${res.mid?'2030: '+res.mid.floors+'/'+res.mid.of+' floors':''}${res.scen?' · 2035: '+res.scen.met+'/'+res.scen.of+' targets, '+res.scen.floors+' floors':''} | ${res.secs}s${errs.length?' ERRORS '+errs[0]:''}`);
await b.close()})();
