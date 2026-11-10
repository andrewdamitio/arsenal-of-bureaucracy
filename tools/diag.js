// Print what binds each line at each checkpoint of a saved bots.js run: node diag.js <bot> <seed> [scenario]
const {OUT}=require('./_env');
const j=require(OUT+'/bot_'+(process.argv[2]||'builder')+'_'+(process.argv[4]||'taiwan')+'_'+(process.argv[3]||1)+'.json');
const P=x=>Math.round(x*100);
for(const m of j.marks){
  console.log('\n== '+m.date+'  share '+m.share+'%  dfars '+m.dfars+'  truce '+m.truce+'  Beijing step '+m.beijing+'  budget $'+m.budget+'B  PC '+m.pc+'  projects '+m.live+' ('+m.stalled+' stalled)  finished '+m.finished);
  for(const c in m.diag){const d=m.diag[c],r=d.root;
    console.log('  '+c.padEnd(13)+'out x'+String(m.vsStart[c]).padEnd(5)+' cap x'+String(d.cap).padEnd(5)+' runs at '+P(d.use)+'%  | '+d.binds+
      (r?'  [cover '+P(r.cover)+'%: US '+P(r.dom)+' ally '+P(r.ally)+' neutral '+P(r.neut)+' PRC '+P(r.prc)+' lost '+P(r.lost)+'; PRC flow x'+r.cut+(r.mods?'; '+r.mods:'')+']':''))}}
