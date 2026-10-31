'use strict';
const $=id=>document.getElementById(id);
const FIELDS=[['studentName','Student Name'],['currentClass','Current Class'],['schoolName','School Name'],['schoolCity','School City / Location'],['stream','Stream'],['percentage11','11th Class (%)'],['guardianName',"Father's / Guardian's Name"],['parentPhone',"Parent's Contact No"],['studentPhone','Student Mobile No'],['whatsapp','WhatsApp No'],['email','Email ID'],['category','Category'],['residentialCity','Residential Town / City'],['preferredContact','Preferred Contact'],['careerDomain','Career Domain'],['entranceExam','Entrance Examination'],['studyAbroad','Study Abroad'],['counselingInterest','Counseling Interest'],['skillxInterest','SkillX Workshop Interest'],['preferredSlot','Preferred Slot'],['preferredDates','Preferred Dates'],['selectionFactors','Top 3 Institution Factors'],['careerQuery','Career Query'],['consent','Consent (verified)'],['signaturePresent','Signature Present'],['formDate','Form Date']];
const state={api:String(window.GJIMT_CONFIG?.apiUrl||'').trim(),pin:sessionStorage.getItem('gjimt_pin')||'',records:[],schools:[],queue:[],cursor:0,busy:false};
$('pin').value=state.pin;
function show(page){if(!state.authenticated&&page!=='settings')page='settings';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('hidden',e.id!==page));document.querySelectorAll('.navbtn').forEach(e=>e.classList.toggle('active',e.dataset.page===page));if(page==='review')renderReview();if(page==='records')renderRecords();}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(b.dataset.page));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
function status(msg,err=false){$('uploadStatus').textContent=msg;$('uploadStatus').className='status'+(err?' error':'');}
function requireConnection(){if(!state.api.startsWith('https://script.google.com/macros/s/')||!state.api.includes('/exec')){show('settings');throw Error('Administrator must configure the deployed /exec URL in config.js.');}if(!state.pin){show('settings');throw Error('Enter your staff PIN.');}}
function jsonp(action,extra={}){requireConnection();return new Promise((resolve,reject)=>{const cb='gjimt_cb_'+Date.now()+'_'+Math.floor(Math.random()*100000);const s=document.createElement('script');const timeout=setTimeout(()=>done(Error('Request timed out. Check deployment and permissions.')),25000);function done(error,data){clearTimeout(timeout);delete window[cb];s.remove();error?reject(error):resolve(data);}window[cb]=data=>data&&data.ok?done(null,data):done(Error(data?.error||'Unknown backend error'));s.onerror=()=>done(Error('Could not load API. Check deployment URL and access.'));s.src=state.api+'?'+new URLSearchParams({action,pin:state.pin,callback:cb,...extra});document.head.appendChild(s);});}
// Apps Script Web Apps do not reliably allow browser cross-origin fetch. A hidden HTML form posts to an iframe.
// The backend returns an HTML page that postMessages the response, tied to a random request id.
function post(action,payload){requireConnection();return new Promise((resolve,reject)=>{const requestId=(window.crypto&&crypto.randomUUID?crypto.randomUUID():'req_'+Date.now()+'_'+Math.random().toString(36).slice(2));const form=document.createElement('form');form.method='POST';form.action=state.api;form.target='apiFrame';form.style.display='none';const fields={action,pin:state.pin,requestId,payload:JSON.stringify(payload)};for(const [k,v] of Object.entries(fields)){const i=document.createElement('input');i.name=k;i.value=v;form.appendChild(i);}const timer=setTimeout(()=>finish(Error('No response from Apps Script. The request may have completed, but the browser did not receive its reply. Confirm the latest deployment includes the updated Code.gs.')),45000);function listener(ev){const data=ev.data;if(!data||data.app!=='GJIMT_API'||data.requestId!==requestId)return;finish(data.ok?null:Error(data.error||'Backend error'),data);}function finish(error,data){clearTimeout(timer);window.removeEventListener('message',listener);form.remove();error?reject(error):resolve(data);}window.addEventListener('message',listener);document.body.appendChild(form);form.submit();});}
function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Cannot read file'));r.readAsDataURL(file);});}
// Resize large camera photos before upload: much faster than sending full-resolution base64.
async function prepareUpload(file){
  if(!file.type.startsWith('image/'))return {base64:await readFile(file),mimeType:file.type,filename:file.name};
  if(file.size<350000)return {base64:await readFile(file),mimeType:file.type,filename:file.name};
  try{
    const image=await createImageBitmap(file);const max=1800;
    const ratio=Math.min(1,max/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    image.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.86));
    if(!blob)throw Error('Image compression failed');
    const base64=await readFile(blob);
    return {base64,mimeType:'image/jpeg',filename:file.name.replace(/\.(png|jpe?g)$/i,'')+'.jpg'};
  }catch(error){return {base64:await readFile(file),mimeType:file.type,filename:file.name};}
}
$('files').onchange=()=>{$('fileList').textContent=[...$('files').files].map(f=>f.name).join(' • ');};
$('scanBtn').onclick=async()=>{try{requireConnection();const files=[...$('files').files];if(!files.length)throw Error('Select one or more forms.');if(!$('uploadSchool').value)throw Error('Select a school or add a new school before uploading.');if(state.busy)return;state.busy=true;$('scanBtn').disabled=true;let passed=0;const failures=[];for(let i=0;i<files.length;i++){const f=files[i];status(`Processing ${i+1}/${files.length}: ${f.name}`);try{if(f.size>8*1024*1024)throw Error('File is larger than 8 MB');if(!['image/jpeg','image/png','application/pdf'].includes(f.type))throw Error('Unsupported file type');const data=await post('scan',await prepareUpload(f));const chosen=$('uploadSchool').value;state.queue.push({filename:f.name,record:{...(data.record||{}),...(chosen?{schoolName:chosen}:{})},ocrText:data.ocrText||'',fileUrl:data.fileUrl||'',ocrWarning:data.ocrWarning||'',localFile:f});passed++;}catch(e){failures.push(`${f.name}: ${e.message}`);}}$('pendingBadge').textContent=state.queue.length;status(`${passed} of ${files.length} forms added to verification. ${files.length-passed} failed.`+(failures.length?'\n'+failures.join('\n'):''),!!failures.length);if(passed){state.cursor=state.queue.length-passed;show('review');}}catch(e){status(e.message,true);}finally{state.busy=false;$('scanBtn').disabled=false;}};
function renderReview(){const has=state.queue.length>0;$('reviewEmpty').classList.toggle('hidden',has);$('reviewArea').classList.toggle('hidden',!has);$('pendingBadge').textContent=state.queue.length;if(!has)return;state.cursor=Math.min(state.cursor,state.queue.length-1);const item=state.queue[state.cursor];$('reviewCount').textContent=`${state.cursor+1} / ${state.queue.length}`;$('sourceName').textContent=item.filename+(item.ocrWarning?' — '+item.ocrWarning:'');$('ocrText').textContent=item.ocrText||'No OCR text was recognized. Fill the fields manually.';$('sourceLink').classList.toggle('hidden',!item.fileUrl);$('sourceLink').href=item.fileUrl||'#';$('fields').replaceChildren();for(const [key,label] of FIELDS){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.name=key;input.value=String(item.record[key]||'');input.autocomplete='off';if(key==='schoolName')input.title='School selected during upload; correct if needed';wrap.appendChild(input);$('fields').appendChild(wrap);}if(window.gjimtTickReview)window.gjimtTickReview(item);}
$('skipBtn').onclick=()=>{if(state.queue.length){state.cursor=(state.cursor+1)%state.queue.length;renderReview();}};
$('studentForm').onsubmit=async e=>{e.preventDefault();if(state.busy)return;const item=state.queue[state.cursor];const record=Object.fromEntries(new FormData(e.target).entries());if(!record.studentName.trim()){alert('Student name is required.');return;}if(!confirm('Have you checked the form and verified the student details?'))return;try{state.busy=true;$('saveBtn').disabled=true;await post('save',{record,fileUrl:item.fileUrl,filename:item.filename});state.queue.splice(state.cursor,1);state.cursor=0;renderReview();await loadRecords();alert('Verified student record saved to Google Sheets.');}catch(err){alert('Save failed: '+err.message);}finally{state.busy=false;$('saveBtn').disabled=false;}};
async function loadRecords(silent=false){try{const data=await jsonp('records');state.records=data.records||[];state.schools=data.schools||[];renderSchoolOptions();renderRecords();renderOverview();return true;}catch(e){if(!silent)alert('Could not load records: '+e.message);$('loginStatus').textContent='Connection error: '+e.message;return false;}}
$('testBtn').onclick=async()=>{const pin=$('pin').value.trim();const info=$('loginStatus');if(!pin){info.textContent='Please enter your PIN.';return;}state.pin=pin;info.textContent='Checking PIN with Google Sheets…';const ok=await loadRecords(true);if(ok){state.authenticated=true;sessionStorage.setItem('gjimt_pin',pin);info.textContent='Connected successfully.';show('overview');}else{state.authenticated=false;state.pin='';$('pin').value='';sessionStorage.removeItem('gjimt_pin');info.textContent='Login failed. Check your PIN or backend configuration.';}};
$('logoutBtn').onclick=()=>{state.authenticated=false;state.pin='';state.records=[];state.schools=[];state.queue=[];sessionStorage.removeItem('gjimt_pin');$('pin').value='';$('loginStatus').textContent='Logged out.';show('settings');};$('refreshBtn').onclick=loadRecords;
function renderOverview(){
 const all=state.records;
 const school=$('dashSchool').value,from=$('dashFrom').value,to=$('dashTo').value;
 const schools=[...new Set(all.map(r=>String(r.schoolName||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const old=$('dashSchool').value;
 $('dashSchool').replaceChildren(new Option('All schools',''));
 schools.forEach(s=>$('dashSchool').add(new Option(s,s)));
 if(schools.includes(old))$('dashSchool').value=old;
 const rows=all.filter(r=>(!school||r.schoolName===school)&&(!from||String(r.savedAt||'').slice(0,10)>=from)&&(!to||String(r.savedAt||'').slice(0,10)<=to));
 const n=rows.length, count=fn=>rows.filter(fn).length;
 const c11=count(r=>/11(th)?/i.test(String(r.currentClass||''))),c12=count(r=>/12(th)?/i.test(String(r.currentClass||'')));
 const interested=count(r=>/\byes\b|definitely interested|interested!/i.test(String(r.skillxInterest||''))&&!/\bno\b/i.test(String(r.skillxInterest||'')));
 $('total').textContent=n;$('class11').textContent=c11;$('class12').textContent=c12;$('skillx').textContent=interested;
 $('schoolCount').textContent=new Set(rows.map(r=>String(r.schoolName||'').trim().toLowerCase()).filter(Boolean)).size;
 $('class11Pct').textContent=(n?Math.round(c11/n*100):0)+'% of students';
 $('class12Pct').textContent=(n?Math.round(c12/n*100):0)+'% of students';
 const other=Math.max(0,n-c11-c12);
 const donut=$('classDonut');
 donut.style.background=n?`conic-gradient(#e75b24 0 ${c11/n*100}%, #253c67 ${c11/n*100}% ${(c11+c12)/n*100}%, #b9c2cf ${(c11+c12)/n*100}% 100%)`:'conic-gradient(#e9edf2 0 100%)';
 donut.replaceChildren();
 const middle=document.createElement('div');middle.className='donut-middle';
 const num=document.createElement('strong');num.textContent=n;
 const lbl=document.createElement('small');lbl.textContent='Students';middle.append(num,lbl);donut.append(middle);
 const legend=$('classLegend');legend.replaceChildren();
 [['Class 11th',c11,'#e75b24'],['Class 12th',c12,'#253c67'],['Unspecified',other,'#b9c2cf']].forEach(([label,value,color])=>{
  const item=document.createElement('div');item.className='legend-item';
  const dot=document.createElement('i');dot.style.background=color;
  const txt=document.createElement('span');txt.textContent=label;
  const count=document.createElement('b');count.textContent=value;
  item.append(dot,txt,count);legend.append(item);
 });
 const group=(field,missing)=>{const counts=new Map();rows.forEach(r=>{const key=String(r[field]||'').trim()||missing;counts.set(key,(counts.get(key)||0)+1);});return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));};
 const schoolCounts=group('schoolName','School unspecified');
 function drawBars(hostId,items,limit){
  const host=$(hostId);host.replaceChildren();
  if(!items.length){host.textContent='No verified records for this selection.';return;}
  const max=Math.max(...items.map(x=>x[1]),1);
  items.slice(0,limit).forEach(([label,value],i)=>{
   const row=document.createElement('div');row.className='chart-bar-row';
   const heading=document.createElement('div');heading.className='bar-heading';
   const name=document.createElement('span');name.textContent=label;name.title=label;
   const count=document.createElement('b');count.textContent=value;heading.append(name,count);
   const track=document.createElement('div');track.className='bar-track';
   const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=(value/max*100)+'%';
   if(hostId==='courseBars')fill.classList.add('blue');track.append(fill);row.append(heading,track);host.append(row);
  });
 }
 drawBars('schoolBars',schoolCounts,7);
 const courses=group('careerDomain','Not specified');drawBars('courseBars',courses,7);
 const table=$('schoolTable');table.replaceChildren();
 if(!schoolCounts.length)table.textContent='No school data yet.';
 schoolCounts.forEach(([name,value],i)=>{
  const row=document.createElement('div');row.className='school-line';
  const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=name;
  const total=document.createElement('b');total.textContent=value+' student'+(value===1?'':'s');
  row.append(rank,label,total);table.append(row);
 });
 const dateCounts=new Map();
 rows.forEach(r=>{const d=String(r.savedAt||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(d))dateCounts.set(d,(dateCounts.get(d)||0)+1);});
 const trend=$('dateTrend');trend.replaceChildren();
 const dates=[...dateCounts].sort((a,b)=>a[0].localeCompare(b[0])).slice(-12);
 if(!dates.length){trend.textContent='No dated records to plot yet.';}
 else {
  const max=Math.max(...dates.map(d=>d[1]),1);
  const chart=document.createElement('div');chart.className='trend-bars';
  dates.forEach(([day,value])=>{
   const col=document.createElement('div');col.className='trend-col';col.title=`${day}: ${value} records`;
   const count=document.createElement('b');count.textContent=value;
   const bar=document.createElement('div');bar.className='trend-fill';bar.style.height=Math.max(8,value/max*165)+'px';
   const label=document.createElement('small');label.textContent=day.slice(5);
   col.append(count,bar,label);chart.append(col);
  });trend.append(chart);
 }
 const recent=$('recent');recent.replaceChildren();
 rows.slice().sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||''))).slice(0,6).forEach(r=>{
  const line=document.createElement('div');line.className='recent-line';
  const icon=document.createElement('div');icon.className='recent-avatar';icon.textContent=(r.studentName||'?').trim().slice(0,1).toUpperCase();
  const info=document.createElement('div');const name=document.createElement('strong');name.textContent=r.studentName||'Unnamed student';
  const desc=document.createElement('small');desc.textContent=[r.schoolName,r.currentClass].filter(Boolean).join(' • ')||'No school/class';
  info.append(name,desc);line.append(icon,info);recent.append(line);
 });
 if(!recent.children.length)recent.textContent='No records yet.';
}
['dashSchool','dashFrom','dashTo'].forEach(id=>$(id).addEventListener('change',renderOverview));
$('dashClear').onclick=()=>{$('dashSchool').value='';$('dashFrom').value='';$('dashTo').value='';renderOverview();};
$('dashRefresh').onclick=()=>loadRecords();
function filtered(){
 const q=$('search').value.toLowerCase(),c=$('classFilter').value,school=$('schoolFilter').value,
 stream=$('streamFilter').value,from=$('dateFrom').value,to=$('dateTo').value;
 return state.records.filter(r=>{
  const day=String(r.savedAt||'').slice(0,10);
  return (!c||r.currentClass===c)&&(!school||r.schoolName===school)&&(!stream||r.stream===stream)
   &&(!from||day>=from)&&(!to||day<=to)
   &&[r.studentName,r.schoolName,r.studentPhone,r.residentialCity,r.guardianName,r.careerDomain].some(v=>String(v||'').toLowerCase().includes(q));
 });
}
function renderRecords(){renderCards();$('recordRows').replaceChildren();for(const r of filtered()){const tr=document.createElement('tr');for(const key of ['studentName','currentClass','schoolName','studentPhone','careerDomain','skillxInterest']){const td=document.createElement('td');td.textContent=r[key]||'—';tr.appendChild(td);}const td=document.createElement('td');if(/^https:\/\/drive\.google\.com\//.test(r.fileUrl||'')){const a=document.createElement('a');a.href=r.fileUrl;a.target='_blank';a.rel='noopener';a.textContent='View';td.appendChild(a);}else td.textContent='—';tr.appendChild(td);$('recordRows').appendChild(tr);}if(!$('recordRows').children.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=7;td.textContent='No matching student records.';tr.appendChild(td);$('recordRows').appendChild(tr);}}
$('search').oninput=renderRecords;$('classFilter').onchange=renderRecords;
['schoolFilter','streamFilter','dateFrom','dateTo'].forEach(id=>$(id).onchange=renderRecords);
function renderSchoolOptions(){
 const schools=[...new Set([...state.schools,...state.records.map(r=>r.schoolName)].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 for(const [id,placeholder] of [['uploadSchool','Select a school'],['schoolFilter','All schools']]){
  const el=$(id),old=el.value;el.replaceChildren();el.add(new Option(placeholder,''));schools.forEach(n=>el.add(new Option(n,n)));if(schools.includes(old))el.value=old;
 }
 const stream=$('streamFilter'),old=stream.value;stream.replaceChildren();stream.add(new Option('All streams',''));
 const streams=[...new Set(state.records.map(r=>r.stream).filter(Boolean))].sort();streams.forEach(n=>stream.add(new Option(n,n)));if(streams.includes(old))stream.value=old;
}
$('addSchool').onclick=async()=>{
 const name=$('newSchool').value.trim();if(name.length<3){$('schoolStatus').textContent='Enter a school name with at least 3 characters.';return;}
 try{const result=await post('addSchool',{schoolName:name});state.schools=result.schools||[];renderSchoolOptions();$('uploadSchool').value=result.schoolName;$('newSchool').value='';$('schoolStatus').textContent='School added and selected: '+result.schoolName;}
 catch(e){$('schoolStatus').textContent='Could not add school: '+e.message;}
};
function renderCards(){
 const data=filtered(),host=$('studentCards');host.replaceChildren();$('recordSummary').textContent=`Showing ${data.length} of ${state.records.length} verified student records`;
 for(const r of data){
  const card=document.createElement('article');card.className='studentcard';
  const head=document.createElement('div');head.className='student-head';
  const title=document.createElement('div'),h=document.createElement('h3');h.textContent=r.studentName||'Unnamed student';
  const school=document.createElement('div');school.className='school-name';school.textContent=r.schoolName||'School not specified';title.append(h,school);
  const pill=document.createElement('span');pill.className='pill';pill.textContent=r.currentClass||'Class not specified';head.append(title,pill);card.append(head);
  const dl=document.createElement('dl');
  const values=[['Student mobile','studentPhone'],['Parent mobile','parentPhone'],['Stream','stream'],['School city','schoolCity'],['Career interest','careerDomain'],['SkillX','skillxInterest'],['Counseling','counselingInterest'],['Residential city','residentialCity'],['Uploaded on','savedAt'],['Email','email']];
  for(const [label,key] of values){const box=document.createElement('div');if(key==='email')box.className='full';const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=key==='savedAt'?String(r[key]||'').slice(0,10)||'—':r[key]||'—';box.append(dt,dd);dl.append(box);}card.append(dl);
  const foot=document.createElement('div');foot.className='foot';const id=document.createElement('span');id.textContent='Record: '+String(r.recordId||'').slice(0,8);foot.append(id);
  if(/^https:\/\/drive\.google\.com\//.test(r.fileUrl||'')){const a=document.createElement('a');a.href=r.fileUrl;a.target='_blank';a.rel='noopener';a.textContent='View original form';foot.append(a);}card.append(foot);host.append(card);
 }
 if(!data.length){const p=document.createElement('p');p.textContent='No students match the selected filters.';host.append(p);}
}

$('csvBtn').onclick=()=>{const keys=['recordId','savedAt',...FIELDS.map(x=>x[0]),'fileUrl'];const rows=[keys,...filtered().map(r=>keys.map(k=>r[k]||''))];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='GJIMT_Student_Records.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
state.authenticated=false;show('settings');if(state.api&&state.pin){loadRecords(true).then(ok=>{if(ok){state.authenticated=true;show('overview');}else{state.pin='';sessionStorage.removeItem('gjimt_pin');$('pin').value='';}});}
