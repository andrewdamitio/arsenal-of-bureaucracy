// The bill for a mandate: complete projects instantly, each time fixing whatever most holds back the furthest-behind target line,
// until every real target is met. Reports how many projects and how much money that takes, at today's prices and with the cost reforms.
//   node bill.js [scenario] [reforms: 0|1]
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const {chromium}=require('playwright-core');
(async()=>{const scen=process.argv[2]||'taiwan',ref=process.argv[3]==='1';
const b=await chromium.launch({executablePath:CHROME});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{let a=5;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{localStorage.clear()}catch(e){}});
await p.goto('file:///'+DEFAULT_HTML);await p.waitForTimeout(700);
const res=await p.evaluate(({scen,ref})=>{newGame('US');S.modal=null;chooseScen(scen);S.modal=null;S.queue=[];S.sim=1;
 if(ref)for(const id of ['multiyear','pricefloor','acq'])S.reforms[id]='passed';
 const sc=SCD[scen],tg=sc.mand.filter(m=>m.c).map(m=>[m.c,m.tgt]);
 const cap=d=>!d.kind||d.kind==='cap'||d.kind==='mod';
 const finish=d=>{const c=projCost(d);S.built[d.id]=(S.built[d.id]||0)+1;const g=projGain(d,1);
   if(d.t.line)S.plants.push({uid:uidN++,def:d.id,nm:d.n,kind:'line',target:d.t.line,gain:g,yield:1,issue:null,full:true,adv:0,start:S.w});
   else if(d.ally){const ch=d.nt?S.nodes[d.t.node].neut:S.nodes[d.t.node].ally;ch.amt+=g}
   else if(d.kind==='mod'){const s=S.nodes[d.t.node];s.base=s.base>1e-6?s.base*1.15:s.scale*.05;(S.nflags[d.t.node]=S.nflags[d.t.node]||{}).mod=true}
   else S.plants.push({uid:uidN++,def:d.id,nm:d.n,kind:'node',target:d.t.node,gain:g,yield:1,issue:null,full:true,adv:d.adv||0,start:S.w});
   return c};
 // what a finished project would add to a line right now, measured and then undone
 const trial=(d,c,R)=>{const b0=S.built[d.id]||0,np=S.plants.length,s=d.t.node?S.nodes[d.t.node]:null,a0=s?s.ally.amt:0,n0=s?s.neut.amt:0,base0=s?s.base:0,f0=s?{...(S.nflags[d.t.node]||{})}:null;finish(d);let g=0;try{g=production(false).out[c].n-R.out[c].n}finally{S.built[d.id]=b0;S.plants.length=np;if(s){s.ally.amt=a0;s.neut.amt=n0;s.base=base0;S.nflags[d.t.node]=f0}}return g};
 const levers=id=>leversFor(id).filter(x=>cap(x)&&!(x.kind==='mod'&&(S.nflags[id]||{}).mod)).sort((a,b)=>projGain(b)/projCost(b)-projGain(a)/projCost(a));
 // which item, given more of it, raises this line's output most (the way the Bottlenecks page ranks); if several bind together, the worst-covered
 const binding=(c,R)=>{const ups=[...upOf('L:'+c)].filter(id=>R.P[id].need>1e-6&&R.P[id].cover<1.2&&levers(id).length);let best=null,bg=1e-9;
   for(const id of ups){const x={id,amt:R.P[id].need*1.3+1e-6,left:1};S.spot.push(x);let g=0;try{g=production(false).out[c].n-R.out[c].n}finally{S.spot.splice(S.spot.indexOf(x),1)}if(g>bg){bg=g;best=id}}
   if(best)return best;const short=ups.filter(id=>R.P[id].cover<.999).sort((a,b)=>R.P[a].cover-R.P[b].cover);return short[0]||null};
 const done=[],by={};let cost=0,stuck=null;
 for(let it=0;it<400;it++){const R=production(false);const behind=tg.map(([c,t])=>[c,R.out[c].yr/t]).filter(x=>x[1]<.999).sort((a,b)=>a[1]-b[1]);if(!behind.length)break;
   let d=null;for(const [c] of behind){const o=R.out[c];
     if(o.n>=o.cap-1e-9)d=PROJECTS.filter(x=>x.t.line===c&&!x.kind).sort((a,b)=>b.gain/projCost(b)-a.gain/projCost(a))[0];
     else{const id=binding(c,R);if(id){
         // try each plant, deal or upgrade for the binding item and for its inputs two steps up: keep the one that really raises output most per dollar
         const pool=new Set([id]);for(const i of ND[id].in){pool.add(i);for(const j of ND[i].in)pool.add(j)}
         let bv=0;for(const n of pool){if(R.P[n].cover>1.15)continue;for(const x of levers(n).slice(0,4)){const g=trial(x,c,R);const v=g/projCost(x);if(v>bv+1e-12){bv=v;d=x}}}
         if(!d){const low=[...pool].filter(n=>levers(n).length).sort((a,b)=>R.P[a].cover-R.P[b].cover)[0];d=low?levers(low)[0]:null}}}
     if(d)break}
   if(!d){stuck=behind.map(x=>x[0]).join(',');break}
   const c=finish(d);cost+=c;done.push(d.id);const k=d.t.line?'lines':d.ally?(d.nt?'neutral deals':'allied deals'):d.kind==='mod'?'upgrades':'plants';by[k]=(by[k]||0)+1;
   const tgt=d.t.line?'L:'+d.t.line:d.t.node;by['@'+tgt]=(by['@'+tgt]||0)+1}
 const R=production(false);
 const top=Object.entries(by).filter(x=>x[0][0]==='@').sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>(k.startsWith('@L:')?LINES[k.slice(3)].n:ND[k.slice(1)].n)+' '+v);
 return {projects:done.length,cost:+cost.toFixed(1),kinds:Object.fromEntries(Object.entries(by).filter(x=>x[0][0]!=='@')),nodes:new Set(done.map(id=>PD[id].t.node||PD[id].t.line)).size,top,stuck,
   out:tg.map(([c,t])=>c+' '+Math.round(R.out[c].yr)+'/'+t)}},{scen,ref});
console.log(scen,ref?'(with multiyear, price floors and the new-entrant pathway)':'(today\'s prices)');console.log(JSON.stringify(res,null,1));if(errs.length)console.log('errors',errs);await b.close()})();
