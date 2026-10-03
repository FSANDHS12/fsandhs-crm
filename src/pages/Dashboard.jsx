import { Users, Target, IndianRupee, TrendingUp, Clock } from "lucide-react";
import { list } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Kpi from "../components/Kpi";
import { servicesFor, serviceFor } from "../lib/services";
import { canonicalStage } from "../lib/lifecycle";

export default function Dashboard(){
  const {unit,config}=useBusinessUnit();
  const leads=list("leads",unit);
  const customers=list("customers",unit);
  const transactions=list("transactions",unit);
  const normalized=leads.map(l=>({...l,displayStage:canonicalStage(unit,l.stage)}));
  const convertedIds=new Set(customers.map(c=>c.sourceLeadId).filter(Boolean));
  const converted=normalized.filter(l=>l.convertedToCustomer||l.customerId||convertedIds.has(l.id)).length;
  const open=normalized.filter(l=>!l.convertedToCustomer&&!convertedIds.has(l.id)).length;
  const income=transactions.filter(x=>x.type==="Income"&&x.status==="Paid").reduce((s,x)=>s+Number(x.amount||0),0);
  const conv=leads.length?Math.round((converted/leads.length)*100):0;

  const serviceRows=servicesFor(unit).map(service=>{
    const serviceLeads=leads.filter(l=>serviceFor(l)===service);
    const serviceCustomers=customers.filter(c=>serviceFor(c)===service);
    const ids=new Set(serviceCustomers.map(c=>c.id));
    const revenue=transactions.filter(t=>t.type==="Income"&&t.status==="Paid"&&ids.has(t.customerId)).reduce((s,t)=>s+Number(t.amount||0),0);
    return {service,leads:serviceLeads.length,customers:serviceCustomers.length,revenue};
  });

  const flow=unit==="media"
    ?["Lead","Commercial","Customer","Delivery","Payment","Billing Closed"]
    :["Employer Lead","Requirement","Candidate","Joining","Invoice","Payment"];

  return <>
    <PageHead title={`${config.label} Dashboard`} desc="Complete flow from lead generation through project delivery, balance collection and billing closure."/>

    <div className="card card-pad" style={{marginBottom:16}}>
      <div className="card-head"><div><h3>End-to-End Business Flow</h3><p>No lead is closed until delivery and billing are completed.</p></div></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginTop:14}}>
        {flow.map((step,i)=><span key={step} style={{display:"flex",gap:10,alignItems:"center"}}><span className="btn ghost">{step}</span>{i<flow.length-1&&<b>→</b>}</span>)}
      </div>
    </div>

    <div className="kpis">
      <Kpi label="Total Leads" value={leads.length} note="Current projection" icon={Users}/>
      <Kpi label="Open Pipeline" value={open} note="Needs follow-up" icon={Target}/>
      <Kpi label="Customers" value={customers.length} note="Converted accounts" icon={TrendingUp}/>
      <Kpi label="Revenue" value={`₹${income.toLocaleString("en-IN")}`} note="Recorded income" icon={IndianRupee}/>
      <Kpi label="Conversion" value={`${conv}%`} note="Lead to customer" icon={Clock}/>
    </div>

    <div className="card" style={{marginBottom:16}}>
      <div className="card-pad"><h3>{config.label} Services</h3><p className="muted">Leads, customers and collected revenue by service</p></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Service</th><th>Leads</th><th>Customers</th><th>Revenue</th></tr></thead>
        <tbody>{serviceRows.map(r=><tr key={r.service}><td><b>{r.service}</b></td><td>{r.leads}</td><td>{r.customers}</td><td>₹{r.revenue.toLocaleString("en-IN")}</td></tr>)}</tbody>
      </table></div>
    </div>

    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Lead</th><th>Service</th><th>Stage</th><th>Potential</th><th>Follow-up</th></tr></thead>
      <tbody>{normalized.map(l=><tr key={l.id}><td><b>{l.name}</b><div className="muted">{l.contact||"—"}</div></td><td>{serviceFor(l)||"—"}</td><td><span className="badge">{l.displayStage}</span></td><td>₹{Number(l.value||0).toLocaleString("en-IN")}</td><td>{l.nextFollowUp||"—"}</td></tr>)}</tbody>
    </table></div></div>
  </>;
}