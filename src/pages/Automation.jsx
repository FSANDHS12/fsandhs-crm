import { useState } from "react";
import { list, add, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Modal from "../components/Modal";

export default function Automation(){
  const {unit}=useBusinessUnit();
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({name:"",trigger:"",delay:"",action:"",active:true});
  const rows=list("automations",unit);
  function save(e){e.preventDefault();add("automations",{...form,businessUnit:unit});setOpen(false);location.reload();}
  return <>
    <PageHead title="Automation" desc="Automate follow-ups and business actions." action={<button className="btn primary" onClick={()=>setOpen(true)}>+ New Automation</button>}/>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Trigger</th><th>Delay</th><th>Action</th><th>Status</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id}><td><b>{r.name}</b></td><td>{r.trigger}</td><td>{r.delay}</td><td>{r.action}</td><td><button className="btn ghost" onClick={()=>{update("automations",r.id,{active:!r.active});location.reload();}}>{r.active?"Active":"Paused"}</button></td></tr>)}
    </tbody></table></div></div>
    <Modal open={open} title="New Automation" onClose={()=>setOpen(false)}><form className="form" onSubmit={save}>
      <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
      <label>Trigger<input value={form.trigger} onChange={e=>setForm({...form,trigger:e.target.value})}/></label>
      <label>Delay<input value={form.delay} onChange={e=>setForm({...form,delay:e.target.value})}/></label>
      <label>Action<input value={form.action} onChange={e=>setForm({...form,action:e.target.value})}/></label>
      <div className="form-actions"><button className="btn primary">Save</button></div>
    </form></Modal>
  </>;
}