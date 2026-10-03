import { Users, Target, IndianRupee, TrendingUp, Clock } from "lucide-react";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie } from "recharts";
import { list } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Kpi from "../components/Kpi";
import { canonicalStage } from "../lib/lifecycle";

export default function Dashboard(){
  const {unit,config}=useBusinessUnit();
  const leads=list("leads",unit);
  const customers=list("customers",unit);
  const transactions=list("transactions",unit);
  const normalized=leads.map(l=>({...l,displayStage:canonicalStage(unit,l.stage)}));
  const income=transactions.filter(x=>x.type==="Income"&&x.status==="Paid").reduce((s,x)=>s+Number(x.amount||0),0);
  const open=normalized.filter(x=>x.displayStage!=="Payment"&&!x.convertedToCustomer).length;
  const convertedIds=new Set(customers.map(c=>c.sourceLeadId).filter(Boolean));
  const converted=normalized.filter(l=>l.convertedToCustomer||l.customerId||convertedIds.has(l.id)).length;
  const conv=leads.length?Math.round((converted/leads.length)*100):0;
  const stages=config.pipeline.map(stage=>({stage,count:normalized.filter(l=>l.displayStage===stage).length}));
  const sourceMap={}; leads.forEach(l=>sourceMap[l.source]=(sourceMap[l.source]||0)+1);
  const sourceData=Object.entries(sourceMap).map(([name,value])=>({name,value}));
  return <>
    <PageHead title={`${config.label} Dashboard`} desc={config.dashboardDesc}/>
    <div className="kpis">
      <Kpi label="Total Leads" value={leads.length} note="Current projection" icon={Users}/>
      <Kpi label="Open Pipeline" value={open} note="Before payment/customer" icon={Target}/>
      <Kpi label="Customers" value={customers.length} note="Converted accounts" icon={TrendingUp}/>
      <Kpi label="Revenue" value={`₹${income.toLocaleString("en-IN")}`} note="Paid income" icon={IndianRupee}/>
      <Kpi label="Conversion" value={`${conv}%`} note="Lead to customer" icon={Clock}/>
    </div>
    <div className="grid2">
      <div className="card card-pad"><div className="card-head"><div><h3>Conversion Pipeline</h3><p>{config.label} stages</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={stages}><XAxis dataKey="stage" tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="currentColor" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div className="card card-pad"><div className="card-head"><div><h3>Lead Sources</h3><p>Channel mix</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} label/><Tooltip/></PieChart></ResponsiveContainer></div></div>
    </div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Lead</th><th>Industry</th><th>Source</th><th>Stage</th><th>Potential</th><th>Follow-up</th></tr></thead><tbody>{normalized.map(l=><tr key={l.id}><td><b>{l.name}</b><div className="muted">{l.contact||"—"}</div></td><td>{l.industry||"—"}</td><td>{l.source||"—"}</td><td><span className="badge">{l.displayStage}</span></td><td>₹{Number(l.value||0).toLocaleString("en-IN")}</td><td>{l.nextFollowUp||"—"}</td></tr>)}</tbody></table></div></div>
  </>;
}