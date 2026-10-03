const KEY="fsandhs_unified_business_platform_v2";
export const seed={activeBusinessUnit:"recruitment",users:[],leads:[],customers:[],transactions:[],automations:[],jobs:[],candidates:[],resumeServices:[],bookings:[],shoots:[],postProduction:[],mediaTeam:[],campaigns:[],customerPayments:[]};
let memoryData=null,cloudReady=false,syncPromise=Promise.resolve();
function readLocal(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null}catch{return null}}
function writeLocal(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
function normalize(data){return {...structuredClone(seed),...(data||{})}}
function currentData(){if(!memoryData){memoryData=normalize(readLocal());writeLocal(memoryData)}return memoryData}
async function pushCloud(data){if(!cloudReady)return;const {db}=await import("./firebase");if(!db)return;const {doc,setDoc,serverTimestamp}=await import("firebase/firestore");const payload=structuredClone(data);syncPromise=syncPromise.catch(()=>{}).then(()=>setDoc(doc(db,"crmState","main"),{...payload,_meta:{updatedAt:serverTimestamp(),schemaVersion:1}}));return syncPromise}
export async function initializeStore(){memoryData=normalize(readLocal());writeLocal(memoryData);try{const {db,firebaseEnabled}=await import("./firebase");if(!firebaseEnabled||!db)return{mode:"local"};const {doc,getDoc,setDoc,serverTimestamp}=await import("firebase/firestore");const ref=doc(db,"crmState","main");const snap=await getDoc(ref);if(snap.exists()){const cloud=snap.data();const {_meta,...crmData}=cloud;memoryData=normalize(crmData);writeLocal(memoryData);cloudReady=true;return{mode:"firestore",migrated:false}}await setDoc(ref,{...memoryData,_meta:{migratedAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:1}});cloudReady=true;return{mode:"firestore",migrated:true}}catch(error){console.error("Firestore initialization failed; using local cache.",error);cloudReady=false;return{mode:"local",error}}}
export function readData(){return currentData()}
export function writeData(data){memoryData=normalize(data);writeLocal(memoryData);void pushCloud(memoryData).catch(error=>console.error("Firestore sync failed; local cache retained.",error))}
export function getActiveBusinessUnit(){return readData().activeBusinessUnit||"recruitment"}
export function setActiveBusinessUnit(unit){const d=structuredClone(readData());d.activeBusinessUnit=unit;writeData(d)}
export function list(name,businessUnit=null){const rows=readData()[name]||[];return businessUnit?rows.filter(x=>x.businessUnit===businessUnit):rows}
export function add(name,item){const d=structuredClone(readData());const row={...item,id:crypto.randomUUID(),createdAt:new Date().toISOString()};d[name]=[row,...(d[name]||[])];writeData(d);return row}
export function update(name,id,changes){const d=structuredClone(readData());d[name]=(d[name]||[]).map(x=>x.id===id?{...x,...changes}:x);writeData(d)}
export function remove(name,id){const d=structuredClone(readData());d[name]=(d[name]||[]).filter(x=>x.id!==id);writeData(d)}
export function resetData(){writeData(structuredClone(seed))}
