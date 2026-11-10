// Compare two regress outputs number by number, within a relative tolerance. usage: node cmp.js a b [tol]
const {DEFAULT_HTML,CHROME,OUT}=require('./_env');
const a=require(OUT+'/regress_'+process.argv[2]+'.json'),b=require(OUT+'/regress_'+process.argv[3]+'.json'),tol=+(process.argv[4]||1e-6);
let n=0,bad=[];
const walk=(x,y,path)=>{if(typeof x==='number'&&typeof y==='number'){n++;const d=Math.abs(x-y),m=Math.max(Math.abs(x),Math.abs(y),1e-9);if(d/m>tol&&d>1e-9)bad.push(path+': '+x+' vs '+y);return}
  if(typeof x==='string'&&typeof y==='string'){const xs=x.split(/[ \/]/),ys=y.split(/[ \/]/);if(xs.length>1&&xs.every(t=>t!==''&&!isNaN(+t))){if(xs.length!==ys.length){bad.push(path+' length');return}xs.forEach((t,i)=>walk(+t,+ys[i],path+'#'+i));return}
    n++;if(x!==y)bad.push(path+': '+x+' vs '+y);return}
  if(x&&y&&typeof x==='object'){const ks=new Set([...Object.keys(x),...Object.keys(y)]);for(const k of ks){if(!(k in x)||!(k in y)){bad.push(path+'.'+k+' missing');continue}walk(x[k],y[k],path+'.'+k)}return}
  n++;if(x!==y)bad.push(path+': '+x+' vs '+y)};
walk(a,b,'');console.log(bad.length?'DIFFERENT ('+bad.length+' of '+n+' values)':'same within '+tol+' ('+n+' values)');if(bad.length)console.log(bad.slice(0,12).join('\n'));
