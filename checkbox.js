'use strict';
// Browser-only, no paid OCR service. Uses the supplied blank GJIMT form as a baseline.
// Manual corner selection corrects page perspective. Results MUST be reviewed.
(() => {
const $=id=>document.getElementById(id);
const CONFIG={
  "pageWidth": 595.4400024414062,
  "pageHeight": 841.6799926757812,
  "options": [
    {
      "field": "currentClass",
      "label": "Class 11th",
      "x": 370.2,
      "y": 108.1,
      "w": 60.30000000000001,
      "h": 14
    },
    {
      "field": "currentClass",
      "label": "Class 12th",
      "x": 434.5,
      "y": 108.1,
      "w": 100,
      "h": 14
    },
    {
      "field": "stream",
      "label": "Medical",
      "x": 70.4,
      "y": 157.9,
      "w": 45.599999999999994,
      "h": 14
    },
    {
      "field": "stream",
      "label": "Non-Med",
      "x": 120,
      "y": 157.9,
      "w": 51.69999999999999,
      "h": 14
    },
    {
      "field": "stream",
      "label": "Comm",
      "x": 175.7,
      "y": 157.9,
      "w": 39.900000000000006,
      "h": 14
    },
    {
      "field": "stream",
      "label": "Arts",
      "x": 219.6,
      "y": 157.9,
      "w": 100,
      "h": 14
    },
    {
      "field": "category",
      "label": "Gen",
      "x": 351.6,
      "y": 232.8,
      "w": 30.399999999999977,
      "h": 14
    },
    {
      "field": "category",
      "label": "SC",
      "x": 386,
      "y": 232.8,
      "w": 24.100000000000023,
      "h": 14
    },
    {
      "field": "category",
      "label": "OBC",
      "x": 414.1,
      "y": 232.8,
      "w": 31.399999999999977,
      "h": 14
    },
    {
      "field": "category",
      "label": "ST",
      "x": 449.5,
      "y": 232.8,
      "w": 23.69999999999999,
      "h": 14
    },
    {
      "field": "category",
      "label": "Other",
      "x": 477.2,
      "y": 232.8,
      "w": 100,
      "h": 14
    },
    {
      "field": "preferredContact",
      "label": "WhatsApp",
      "x": 386,
      "y": 257.6,
      "w": 55.30000000000001,
      "h": 14
    },
    {
      "field": "preferredContact",
      "label": "Call",
      "x": 445.3,
      "y": 257.6,
      "w": 28.599999999999966,
      "h": 14
    },
    {
      "field": "preferredContact",
      "label": "SMS",
      "x": 477.9,
      "y": 257.6,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "Management / Commerce (BBA / B.Com)",
      "x": 42.5,
      "y": 319.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "IT / AI & Computer Applications (BCA)",
      "x": 228.6,
      "y": 319.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "Engineering (B.Tech)",
      "x": 401.5,
      "y": 319.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "Medical / Healthcare Allied",
      "x": 36,
      "y": 333.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "Design / Media / Mass Comm",
      "x": 189.5,
      "y": 333.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "careerDomain",
      "label": "Other",
      "x": 356.6,
      "y": 333.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "JEE / State CET",
      "x": 42.5,
      "y": 372.5,
      "w": 84.30000000000001,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "CUET",
      "x": 130.8,
      "y": 372.5,
      "w": 48.0,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "NEET",
      "x": 182.8,
      "y": 372.5,
      "w": 47.599999999999994,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "CLAT / Law",
      "x": 234.4,
      "y": 372.5,
      "w": 69.9,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "NDA / Defense",
      "x": 308.3,
      "y": 372.5,
      "w": 85.0,
      "h": 14
    },
    {
      "field": "entranceExam",
      "label": "Direct Admission",
      "x": 397.3,
      "y": 372.5,
      "w": 100,
      "h": 14
    },
    {
      "field": "studyAbroad",
      "label": "Yes, after Class 12th",
      "x": 42.5,
      "y": 411.5,
      "w": 100,
      "h": 14
    },
    {
      "field": "studyAbroad",
      "label": "Yes, after Graduation",
      "x": 166.6,
      "y": 411.5,
      "w": 100,
      "h": 14
    },
    {
      "field": "studyAbroad",
      "label": "No, looking for reputed colleges in India",
      "x": 295.3,
      "y": 411.5,
      "w": 100,
      "h": 14
    },
    {
      "field": "counselingInterest",
      "label": "Yes, definitely",
      "x": 42.5,
      "y": 450.4,
      "w": 100,
      "h": 14
    },
    {
      "field": "counselingInterest",
      "label": "Maybe later",
      "x": 157.9,
      "y": 450.4,
      "w": 100,
      "h": 14
    },
    {
      "field": "counselingInterest",
      "label": "No",
      "x": 266.4,
      "y": 450.4,
      "w": 100,
      "h": 14
    },
    {
      "field": "skillxInterest",
      "label": "Yes, definitely interested",
      "x": 42.5,
      "y": 510.9,
      "w": 100,
      "h": 14
    },
    {
      "field": "skillxInterest",
      "label": "Maybe, want more details",
      "x": 198.2,
      "y": 510.9,
      "w": 100,
      "h": 14
    },
    {
      "field": "skillxInterest",
      "label": "No",
      "x": 337.3,
      "y": 510.9,
      "w": 100,
      "h": 14
    },
    {
      "field": "preferredSlot",
      "label": "11:00 AM \u2013 1:00 PM",
      "x": 105.2,
      "y": 525.4,
      "w": 100,
      "h": 14
    },
    {
      "field": "preferredSlot",
      "label": "3:00 PM \u2013 5:00 PM",
      "x": 213.5,
      "y": 525.4,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "100% Placement Support & Top MNCs",
      "x": 42.5,
      "y": 585.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "AI & Practical Skill-Based Curriculum",
      "x": 217.5,
      "y": 585.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "Scholarship / Affordable Fee",
      "x": 384.7,
      "y": 585.7,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "Experienced Faculty Mentorship",
      "x": 36,
      "y": 599.6,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "Global Immersion & Exchange Pathways",
      "x": 196.4,
      "y": 599.6,
      "w": 100,
      "h": 14
    },
    {
      "field": "selectionFactors",
      "label": "Modern Campus, Labs & Clubs",
      "x": 376.4,
      "y": 599.6,
      "w": 100,
      "h": 14
    }
  ]
};
let photo=null,ref=null,photoPixels=null,refPixels=null,corners=[],pickMode=false,sourceFile=null,choiceState={};
const CANVAS=$('scanCanvas'),CTX=CANVAS.getContext('2d',{willReadFrequently:true});
const W=CONFIG.pageWidth,H=CONFIG.pageHeight;
function status(s){$('tickStatus').textContent=s;}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Cannot load image'));im.src=src;});}
async function prepare(item){
 $('tickResults').replaceChildren();choiceState={};corners=[];photo=null;sourceFile=item.localFile||null;
 $('applyTicksBtn').disabled=true;
 if(!sourceFile||!sourceFile.type.startsWith('image/')){status('Tick analysis is available for JPG/PNG files uploaded in this browser session. PDF files need to be converted to images first.');CANVAS.width=1;CANVAS.height=1;return;}
 try{
  const url=URL.createObjectURL(sourceFile);photo=await loadImage(url);URL.revokeObjectURL(url);
  CANVAS.width=photo.naturalWidth;CANVAS.height=photo.naturalHeight;
  // Keep browser processing reasonable for high-resolution camera images.
  if(Math.max(CANVAS.width,CANVAS.height)>2100){const ratio=2100/Math.max(CANVAS.width,CANVAS.height);CANVAS.width=Math.round(CANVAS.width*ratio);CANVAS.height=Math.round(CANVAS.height*ratio);}
  CTX.drawImage(photo,0,0,CANVAS.width,CANVAS.height);photoPixels=CTX.getImageData(0,0,CANVAS.width,CANVAS.height);
  corners=[[0,0],[CANVAS.width,0],[CANVAS.width,CANVAS.height],[0,CANVAS.height]];
  if(!ref){ref=await loadImage(window.GJIMT_BLANK_TEMPLATE_DATA || 'assets/blank-template.png');const c=document.createElement('canvas');c.width=ref.naturalWidth;c.height=ref.naturalHeight;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(ref,0,0);refPixels=cx.getImageData(0,0,c.width,c.height);}
  redraw();status('Photo ready. For best results, click “Select 4 Corners” and click the four corners of the paper, then Analyze Tick Marks.');
 }catch(e){ref=null;refPixels=null;status('Image preparation failed: '+e.message);}
}
function redraw(){if(!photoPixels)return;CTX.putImageData(photoPixels,0,0);CTX.lineWidth=Math.max(2,CANVAS.width/350);CTX.strokeStyle='#f97316';CTX.fillStyle='#ea580c';
 if(corners.length){CTX.beginPath();corners.forEach((p,i)=>{if(!i)CTX.moveTo(...p);else CTX.lineTo(...p);});if(corners.length===4)CTX.closePath();CTX.stroke();corners.forEach((p,i)=>{CTX.beginPath();CTX.arc(...p,Math.max(6,CANVAS.width/140),0,Math.PI*2);CTX.fill();CTX.fillStyle='white';CTX.font=`bold ${Math.max(12,CANVAS.width/60)}px sans-serif`;CTX.fillText(String(i+1),p[0]+8,p[1]+15);CTX.fillStyle='#ea580c';});}}
CANVAS.addEventListener('click',e=>{if(!pickMode)return;const r=CANVAS.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*CANVAS.width,y=(e.clientY-r.top)/r.height*CANVAS.height;corners.push([x,y]);redraw();if(corners.length===4){pickMode=false;status('Four page corners selected. Click Analyze Tick Marks.');}else status(`Corner ${corners.length} selected. Click corner ${corners.length+1} (${['top-left','top-right','bottom-right','bottom-left'][corners.length]}).`);});
$('cornersBtn').onclick=()=>{if(!photoPixels)return status('Upload an image first.');corners=[];pickMode=true;redraw();status('Click the TOP-LEFT corner of the paper, then top-right, bottom-right, bottom-left.');};
$('resetTickBtn').onclick=()=>{if(!photoPixels)return;pickMode=false;corners=[[0,0],[CANVAS.width,0],[CANVAS.width,CANVAS.height],[0,CANVAS.height]];redraw();status('Corners reset to full image. Select actual page corners for better results.');};
// Solve the 8x8 linear system for a projective transform (template -> photograph).
function homography(c){const a=[],b=[];for(let i=0;i<4;i++){const [x,y]=[[0,0],[W,0],[W,H],[0,H]][i],[u,v]=c[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);}
 for(let k=0;k<8;k++){let pivot=k;for(let i=k+1;i<8;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;[a[k],a[pivot]]=[a[pivot],a[k]];[b[k],b[pivot]]=[b[pivot],b[k]];if(Math.abs(a[k][k])<1e-9)throw Error('Corners are invalid. Please select four distinct corners in order.');const d=a[k][k];for(let j=k;j<8;j++)a[k][j]/=d;b[k]/=d;for(let i=0;i<8;i++)if(i!==k){const f=a[i][k];for(let j=k;j<8;j++)a[i][j]-=f*a[k][j];b[i]-=f*b[k];}}return [...b,1];}
function mapPoint(h,x,y){const d=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];}
function gray(im,x,y){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=im.width||y>=im.height)return 255;const i=(y*im.width+x)*4,d=im.data;return .299*d[i]+.587*d[i+1]+.114*d[i+2];}
function baselineDark(x,y){return gray(refPixels,x/W*refPixels.width,y/H*refPixels.height)<145;}
function extraInk(h,box){
 // Detect newly added dark strokes in and immediately beside the checkbox.
 // Printed text is excluded using the blank reference with a 1.6pt margin.
 let extra=0,total=0;const x0=box.x-3,y0=box.y-3,x1=box.x+Math.min(box.w,42),y1=box.y+box.h+5;
 for(let y=y0;y<y1;y+=.8)for(let x=x0;x<x1;x+=.8){
  let printed=false;for(let dy=-1.6;dy<=1.6&&!printed;dy+=1.6)for(let dx=-1.6;dx<=1.6;dx+=1.6)if(baselineDark(x+dx,y+dy)){printed=true;break;}
  if(printed)continue;const [u,v]=mapPoint(h,x,y);const g=gray(photoPixels,u,v);
  // Adaptive-ish dark threshold to tolerate gray paper under camera lighting.
  if(g<115)extra++;total++;
 }
 return {score:extra,ratio:extra/Math.max(1,total)};
}
$('autoTickBtn').onclick=()=>{
 if(!photoPixels||corners.length!==4)return status('Select an image and its four corners first.');
 if(!refPixels)return status('Blank form reference did not load. Refresh this page and upload the form again.');
 try{const h=homography(corners);const scored=CONFIG.options.map(o=>({...o,...extraInk(h,o)}));
 // Use a robust per-form background level; do not treat all dark areas as ticks.
 const sorted=scored.map(x=>x.score).sort((a,b)=>a-b);const median=sorted[Math.floor(sorted.length/2)]||0;
 choiceState={};for(const s of scored){const threshold=Math.max(24,median*1.9);s.suggested=s.score>threshold&&s.ratio>.012;s.uncertain=s.score>threshold*.55&&!s.suggested;}
 drawOptions(scored);$('applyTicksBtn').disabled=false;
 status('Analysis completed. Orange rows are suggestions only. Verify each tick against the original scan before applying. If marks are missed, select them manually.');
 }catch(e){status('Tick analysis error: '+e.message);}
};
function drawOptions(scored){const host=$('tickResults');host.replaceChildren();const groups={};for(const o of scored)(groups[o.field]??=[]).push(o);
 for(const [field,opts] of Object.entries(groups)){
  const sec=document.createElement('div');sec.className='tickgroup';const title=document.createElement('strong');title.textContent=({currentClass:'Current Class',careerDomain:'Career Domain',entranceExam:'Entrance Examination',studyAbroad:'Study Abroad',counselingInterest:'Counseling Interest',skillxInterest:'SkillX Interest',preferredSlot:'Preferred Slot',selectionFactors:'Top Institution Factors',preferredContact:'Preferred Contact'}[field]||field);sec.append(title);
  for(const o of opts){const label=document.createElement('label');label.className='tickopt'+(o.suggested?' suggested':'');const input=document.createElement('input');input.type='checkbox';input.checked=o.suggested;input.dataset.field=o.field;input.dataset.label=o.label;const name=document.createElement('span');name.textContent=o.label;const note=document.createElement('em');note.textContent=o.suggested?'Suggested — verify':o.uncertain?'Uncertain':'Not detected';label.append(input,name,note);sec.append(label);}host.append(sec);
 }
}
$('applyTicksBtn').onclick=()=>{
 const chosen={};for(const el of $('tickResults').querySelectorAll('input:checked'))(chosen[el.dataset.field]??=[]).push(el.dataset.label);
 const multi=new Set(['careerDomain','entranceExam','selectionFactors']);
 for(const [field,arr] of Object.entries(chosen)){
  const input=$('fields').querySelector(`[name="${field}"]`);if(input){input.value=multi.has(field)?arr.join('; '):arr[0];input.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 status('Reviewed selections copied into the student form. Please check all fields before Verify & Save.');
};
window.gjimtTickReview=prepare;
})();
