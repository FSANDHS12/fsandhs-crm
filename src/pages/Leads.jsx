import { useMemo,useState } from "react";
import { Search, Pencil, Trash2, UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { add,list,remove,update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Modal from "../components/Modal";
import { canonicalStage } from "../lib/lifecycle";
import { servicesFor, industriesFor } from "../lib/services";

export default function Leads() {
  const {unit,config} = useBusinessUnit();
  const navigate=useNavigate();
  const [tick,setTick] = useState(0);
  const [q,setQ] = useState("");
  const [stage,setStage] = useState("All");
  const [open,setOpen] = useState(false);
  const [editing,setEditing] = useState(null);
  const serviceOptions=servicesFor(unit);
  const industryOptions=industriesFor();
  const blank = {name:"",contact:"",phone:"",email:"",industry:"",service:serviceOptions[0]||"",source:config.sources[0],stage:config.pipeline[0],value:0,nextFollowUp:""};
  const [form,setForm] = useState(blank);
  const leads = list("leads",unit);
  const customers=list("customers",unit);

  const rows = useMemo(()=>leads
    .map(l=>({...l,displayStage:canonicalStage(unit,l.stage)}))
    .filter(l =>
      `${l.name} ${l.contact||""} ${l.industry||""} ${l.source||""}`.toLowerCase().includes(q.toLowerCase()) &&
      (stage==="All" || l.displayStage===stage)
    ),[leads,q,stage,tick,unit]);

  const save=e=>{
    e.preventDefault();
    const row={...form,businessUnit:unit,value:Number(form.value||0),stage:canonicalStage(unit,form.stage)};
    editing ? update("leads",editing.id,row) : add("leads",row);
    setOpen(false); setEditing(null); setTick(x=>x+1);
  };

  const isConverted=(lead)=>Boolean(lead.convertedToCustomer||lead.customerId||customers.some(c=>c.sourceLeadId===lead.id));

  return <>
    <PageHead title={`${config.label} Leads`} desc={config.dashboardDesc} action={<button className="btn primary" onClick={()=>{setEditing(null);setForm(blank);setOpen(true)}}>+ Add Lead</button>}/>
    <div className="toolbar card"><Search size={17}/><input placeholder="Search leads..." value={q} onChange={e=>setQ(e.target.value)}/><select value={stage} onChange={e=>setStage(e.target.value)}><option>All</option>{config.pipeline.map(s=><option key={s}>{s}</option>)}</select><span>{rows.length} records</span></div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Service</th><th>Industry</th><th>Source</th><th>Stage</th><th>Value</th><th>Follow-up</th><th>Customer</th><th></th></tr></thead><tbody>
      {rows.map(l=><tr key={l.id}>
        <td><b>{l.name}</b><div className="muted">{l.contact||"—"}</div></td>
        <td>{l.service||"—"}</td><td>{l.industry||"—"}</td><td>{l.source||"—"}</td>
        <td><select value={l.displayStage} onChange={e=>{update("leads",l.id,{stage:e.target.value});setTick(x=>x+1)}}>{config.pipeline.map(s=><option key={s}>{s}</option>)}</select></td>
        <td>₹{Number(l.value||0).toLocaleString("en-IN")}</td>
        <td>{l.nextFollowUp||"—"}</td>
        <td>{isConverted(l)?<span className="badge green">Converted</span>:<button className="btn primary" onClick={()=>navigate(`/customers?leadId=${l.id}`)}><UserRoundCheck size={15}/> Convert</button>}</td>
        <td><button className="icon" onClick={()=>{setEditing(l);setForm({...l,stage:l.displayStage});setOpen(true)}}><Pencil size={15}/></button><button className="icon" onClick={()=>{if(confirm("Delete lead?")){remove("leads",l.id);setTick(x=>x+1)}}}><Trash2 size={15}/></button></td>
      </tr>)}
    </tbody></table></div></div>
    <Modal open={open} title={editing?"Edit Lead":"Add Lead"} onClose={()=>setOpen(false)}><form className="form" onSubmit={save}>
      <label>Business / Name<input required value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Contact Person<input value={form.contact||""} onChange={e=>setForm({...form,contact:e.target.value})}/></label>
      <label>Phone<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label>Email<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Service<select value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})}>{serviceOptions.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Industry<select value={form.industry||""} onChange={e=>setForm({...form,industry:e.target.value})}><option value="">Select industry</option>{industryOptions.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Source<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{config.sources.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Stage<select value={canonicalStage(unit,form.stage)} onChange={e=>setForm({...form,stage:e.target.value})}>{config.pipeline.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Potential Value<input type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
      <label>Next Follow-up<input type="date" value={form.nextFollowUp||""} onChange={e=>setForm({...form,nextFollowUp:e.target.value})}/></label>
      <div className="form-actions"><button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Cancel</button><button className="btn primary">Save</button></div>
    </form></Modal>
  </>;
}