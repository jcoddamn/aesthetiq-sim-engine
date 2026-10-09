// Browser workflow test with canonical reference geometry and a synthetic image.
// MediaPipe is stubbed; the app's actual simulation pipeline and audit UI run.
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?
 `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright`:'playwright');
const vertices=(await readFile(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8'))
 .split('\n').filter(l=>l.startsWith('v ')).map(l=>l.split(/\s+/).slice(1).map(Number));
const landmarks=vertices.map(([x,y,z])=>({x:.5+x/24,y:.5-y/24,z:-z/24}));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
try{
 const page=await browser.newPage({viewport:{width:1000,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'text/javascript',body:`
 window.FaceMesh=class {
 setOptions(){} onResults(callback){this.callback=callback;}
 async send(){await new Promise(r=>setTimeout(r,window.detectorDelay||0));this.callback({multiFaceLandmarks:[${JSON.stringify(landmarks)}]});}
 async close(){this.callback=null;window.detectorClosed=(window.detectorClosed||0)+1;}
 };`}));
 await page.goto('http://127.0.0.1:8765/clinical-evidence-audit.html');
 await page.waitForFunction(()=>document.querySelector('#readinessTable').rows.length===55);
 assert.match(await page.locator('#readinessSummary').innerText(),/8 article licenses verified/);
 await page.selectOption('#procedure','lip-filler');
 for(const [id,value] of Object.entries({cohortId:'study-a',caseId:'case-001',treatmentGoal:'volume',techniqueId:'technique-a'}))await page.fill('#'+id,value);
 await page.selectOption('#followupWindow','5-12-weeks');
 for(const id of ['adult','isolated','referenceVisible','permission'])await page.check('#'+id);
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#c49273';ctx.fillRect(0,0,256,256);return c.toDataURL().split(',')[1];});
 const upload=async()=>{for(const id of ['before','after'])await page.setInputFiles('#'+id,{name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});};
 await upload();await page.click('#run');
 await page.waitForFunction(()=>!document.querySelector('#export').disabled);
 const report=JSON.parse(await page.locator('#report').innerText());
 assert.equal(report.schemaVersion,3);assert.equal(report.caseContext.caseId,'case-001');
 assert.equal(report.status,'comparison_available');
 assert.equal(await page.locator('#preview canvas').count(),5);
 await page.click('#discard');assert.equal(await page.locator('#preview canvas').count(),0);
 assert.equal(await page.locator('#export').isDisabled(),true);
 // Discard while face detection is pending, then wait for its late callback.
 await upload();await page.evaluate(()=>window.detectorDelay=400);await page.click('#run');
 await page.waitForFunction(()=>document.querySelector('#run').disabled);
 await page.click('#discard');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 assert.equal(await page.locator('#preview canvas').count(),0);
 assert.equal(await page.locator('#export').isDisabled(),true);
 assert.match(await page.locator('#report').innerText(),/cleared/);
 assert.equal(await page.locator('#before').inputValue(),'');
 assert.ok(await page.evaluate(()=>window.detectorClosed>=2));
 // Unsupported procedures stay disabled after cancellation/finally cleanup.
 await page.selectOption('#procedure','teeth-whitening');
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.goto('http://127.0.0.1:8765/reference-photo-analysis.html');
 await page.waitForURL('**/clinical-evidence-audit.html');
 assert.deepEqual(errors,[]);
 console.log('PASS: real simulation pipeline with synthetic image, report context, discard race, unsupported procedure gate, legacy redirect, no runtime errors');
}finally{await browser.close();}
