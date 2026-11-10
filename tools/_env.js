// Shared settings for the test tools. Override with environment variables: CHROME (browser executable), AOB_HTML (page to test).
const path=require('path'),fs=require('fs');
const OUT=path.join(__dirname,'out');if(!fs.existsSync(OUT))fs.mkdirSync(OUT);
const fwd=p=>p.split(path.sep).join('/');
module.exports={
  DEFAULT_HTML:fwd(process.env.AOB_HTML||path.join(__dirname,'..','index.html')),
  CHROME:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  OUT:fwd(OUT)};
