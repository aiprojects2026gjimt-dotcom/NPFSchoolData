/** GJIMT GitHub Pages -> Google Sheets API. Apps Script is BACKEND ONLY.
 * 1. Set PIN in setStaffPin() and run it once.
 * 2. Run setup() once.
 * 3. Add Advanced Google service Drive API v3 (optional OCR).
 * 4. Deploy as Web App, execute as Me. Restrict access if possible.
 * WARNING: PIN-only protection is a prototype, not adequate for sensitive production student data.
 */
const HEADERS=['recordId','savedAt','studentName','currentClass','schoolName','schoolCity','stream','percentage11','guardianName','parentPhone','studentPhone','whatsapp','email','category','residentialCity','preferredContact','careerDomain','entranceExam','studyAbroad','counselingInterest','skillxInterest','preferredSlot','preferredDates','selectionFactors','careerQuery','consent','signaturePresent','formDate','fileUrl','filename'];
function setStaffPin(){PropertiesService.getScriptProperties().setProperty('STAFF_PIN','REPLACE_WITH_A_LONG_RANDOM_PIN');}
function setup(){const p=PropertiesService.getScriptProperties();if(!p.getProperty('SHEET_ID')){const ss=SpreadsheetApp.create('GJIMT Student Counseling Records');const sh=ss.getSheets()[0];sh.setName('Students');sh.appendRow(HEADERS);sh.setFrozenRows(1);p.setProperty('SHEET_ID',ss.getId());}if(!p.getProperty('FOLDER_ID'))p.setProperty('FOLDER_ID',DriveApp.createFolder('GJIMT Uploaded Student Forms').getId());Logger.log('Google Sheet: https://docs.google.com/spreadsheets/d/'+p.getProperty('SHEET_ID')+'/edit');}
function auth_(pin){const expected=PropertiesService.getScriptProperties().getProperty('STAFF_PIN');if(!expected||expected==='REPLACE_WITH_A_LONG_RANDOM_PIN')throw Error('Configure STAFF_PIN first.');if(String(pin||'')!==expected)throw Error('Invalid staff PIN.');}
function doGet(e){const p=e.parameter||{};const callback=String(p.callback||'');if(!/^gjimt_cb_[a-zA-Z0-9_]+$/.test(callback))return ContentService.createTextOutput('Invalid callback');let result;try{auth_(p.pin);if(p.action==='records')result={ok:true,records:readRecords_(),schools:listSchools_()};else result={ok:false,error:'Unknown action'};}catch(err){result={ok:false,error:String(err.message||err)};}return ContentService.createTextOutput(callback+'('+JSON.stringify(result)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function doPost(e){const p=e.parameter||{};const requestId=String(p.requestId||'');let result;try{auth_(p.pin);const payload=JSON.parse(p.payload||'{}');if(p.action==='scan')result=scan_(payload);else if(p.action==='save')result=save_(payload);else if(p.action==='addSchool')result=addSchool_(payload);else throw Error('Unknown action');result.ok=true;}catch(err){result={ok:false,error:String(err.message||err)};}result.app='GJIMT_API';result.requestId=requestId;
// Escape < to prevent injected HTML / script breaking out of response.
const json=JSON.stringify(result).replace(/</g,'\\u003c');const html='<!doctype html><html><body><script>window.top.postMessage('+json+',"*");<\/script></body></html>';
return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function readRecords_(){const sh=sheet_();const data=sh.getDataRange().getDisplayValues();if(data.length<2)return [];const headers=data[0];return data.slice(1).filter(row=>row.some(Boolean)).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]||''])));}
function sheet_(){const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');if(!id)throw Error('Run setup() first.');return SpreadsheetApp.openById(id).getSheetByName('Students');}
function listSchools_(){
 const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
 const sh=ss.getSheetByName('Schools')||ss.insertSheet('Schools');
 if(sh.getLastRow()===0)sh.appendRow(['School Name','Added At']);
 const a=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues().flat():[];
 const fromRecords=readRecords_().map(r=>r.schoolName);
 return [...new Set(a.concat(fromRecords).map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function addSchool_(p){
 const name=String(p.schoolName||'').trim().replace(/[\r\n\t]/g,' ').slice(0,150);
 if(name.length<3)throw Error('Enter a school name (at least 3 characters).');
 const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
 let sh=ss.getSheetByName('Schools');if(!sh){sh=ss.insertSheet('Schools');sh.appendRow(['School Name','Added At']);}
 const existing=listSchools_();const matched=existing.find(x=>x.toLowerCase()===name.toLowerCase());
 if(!matched)sh.appendRow([name,new Date()]);return {schoolName:matched||name,schools:listSchools_()};
}
function scan_(p){const name=String(p.filename||'form').replace(/[\\/<>]/g,'_');const mime=String(p.mimeType||'');if(!['image/jpeg','image/png','application/pdf'].includes(mime))throw Error('Unsupported file type');if(!p.base64||p.base64.length>12e6)throw Error('File too large or empty');const bytes=Utilities.base64Decode(p.base64);const folder=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));const blob=Utilities.newBlob(bytes,mime,name);const file=folder.createFile(blob);let ocrText='',ocrWarning='';
try{
  // Requires Advanced Drive API v3. Convert the uploaded image/PDF into a temporary Google Doc.
  const converted=Drive.Files.create({name:'OCR '+name,mimeType:'application/vnd.google-apps.document'},blob,{fields:'id'});
  ocrText=DocumentApp.openById(converted.id).getBody().getText();
  DriveApp.getFileById(converted.id).setTrashed(true);
}catch(err){ocrWarning='OCR unavailable: '+String(err.message||err).slice(0,200);}
return {fileUrl:file.getUrl(),ocrText,ocrWarning,record:extract_(ocrText)};}
function extract_(text){
 // Conservative fixed-template parsing. Never infer checked boxes from OCR text.
 const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 const r={};
 const labels={
  studentName:/^student\s*name\s*:/i,schoolName:/^school\s*name\s*:/i,
  schoolCity:/^school\s*city\s*\/\s*location\s*:/i,
  guardianName:/^father.?s\s*\/\s*guardian.?s\s*name\s*:/i,
  parentPhone:/^parent.?s\s*contact\s*no\s*:/i,
  studentPhone:/^student\s*mobile\s*no\s*:/i,
  whatsapp:/^whatsapp\s*no\b[^:]*:/i,
  email:/^email\s*id\s*:/i,
  residentialCity:/^residential\s*town\s*\/\s*city\s*:/i,
  percentage11:/^11th\s*class\s*\(?%\)?\s*:/i,
  preferredDates:/^preferred\s*dates\s*:/i,
  formDate:/^date\s*:/i
 };
 const labelLine=x=>Object.values(labels).some(re=>re.test(x))||/^(PART\s*\d|Stream\s*:|Category\s*:|Preferred Contact\s*:|Current Class\s*:|\d+[.)]\s|GIAN JYOTI|CAREER COUNSELING|For Classes|Are you|What top|Would you|Student Signature\s*:)/i.test(x);
 const clean=x=>String(x||'').replace(/^[:\s_\-.]+|[\s_\-.]+$/g,'').trim();
 const plausible=x=>x&&x.length<=70&&!labelLine(x)&&!/^\[\s*\]|^\(\s*\)/.test(x)&&!/^\d+\s*\./.test(x);
 // Same-line values are most trustworthy. OCR may put values in consecutive lines after two labels.
 const consumed=new Set();
 for(let i=0;i<lines.length;i++){
  for(const [key,re] of Object.entries(labels)){
   const m=lines[i].match(re);if(!m)continue;
   const value=clean(lines[i].slice(m[0].length));
   if(plausible(value)){r[key]=value;consumed.add(i);}
  }
 }
 // A common fixed-form OCR pattern is Student Name:, School Name:, name, school.
 const findIndex=key=>lines.findIndex(x=>labels[key].test(x));
 const ni=findIndex('studentName'),si=findIndex('schoolName');
 if(ni>=0&&si===ni+1&&!r.studentName&&!r.schoolName){
  const one=clean(lines[si+1]||''),two=clean(lines[si+2]||'');
  if(plausible(one)&&plausible(two)){r.studentName=one;r.schoolName=two;consumed.add(si+1);consumed.add(si+2);}
 }
 // For other labels, use next line only if it is not a label and not already used.
 for(const [key,re] of Object.entries(labels)){
  if(r[key])continue;const i=findIndex(key);if(i<0)continue;
  const candidate=clean(lines[i+1]||'');
  if(!consumed.has(i+1)&&plausible(candidate)){r[key]=candidate;consumed.add(i+1);}
 }
 // Recover phone and email from a single OCR line; do not guess missing values.
 const phone=x=>{const m=String(x||'').match(/(?:\+?91[\s-]?)?([6-9]\d{9})/);return m?m[1]:'';};
 for(const k of ['studentPhone','parentPhone','whatsapp']){
  r[k]=phone(r[k]);if(!r[k])delete r[k];
 }
 const emailText=lines.join(' ');const em=emailText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
 if(em)r.email=em[0];else delete r.email;
 if(r.percentage11){const m=r.percentage11.match(/\b(?:100|\d{1,2})(?:\.\d+)?\b/);if(m)r.percentage11=m[0];else delete r.percentage11;}
 // Reject printed choices and obvious OCR artifacts from names and places.
 const printed=/\b(class\s*11th|class\s*12th|medical|non.med|commerce|preferred|whatsapp\s*\[|call\s*\[|sms\s*\[|category|\bgen\s*\[)\b/i;
 for(const k of ['studentName','schoolName','schoolCity','guardianName','residentialCity']){
  if(r[k]&&(printed.test(r[k])||/\[\s*\]/.test(r[k])))delete r[k];
 }
 // These options require checking marks in the original image, not just plain OCR.
 return r;
}
function save_(p){const r=p.record||{};if(!String(r.studentName||'').trim())throw Error('Student name is required');const sh=sheet_();const lock=LockService.getScriptLock();lock.waitLock(15000);try{const id=Utilities.getUuid();const savedAt=new Date().toISOString();const row=HEADERS.map(k=>k==='recordId'?id:k==='savedAt'?savedAt:k==='fileUrl'?String(p.fileUrl||''):k==='filename'?String(p.filename||''):safeCell_(r[k]));sh.appendRow(row);return {recordId:id};}finally{lock.releaseLock();}}

function safeCell_(v){const s=String(v||'');return /^[=+@\-]/.test(s)?'\''+s:s;}
