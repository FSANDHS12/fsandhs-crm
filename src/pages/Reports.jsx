import { list } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";

export default function Reports(){
  const {unit}=useBusinessUnit();
  const leads=list("leads",unit);
  const customers=list("customers",unit);
  const tx=list("transactions",unit);
  const income=tx.filter(x=>x.type==="Income").reduce((s,x)=>s+Number(x.amount||0),0);
  return <>
    <PageHead title="Reports" desc="High-level business performance summary."/>
    <div className="grid3">
      <div className="card report-card"><h3>Leads</h3><b>{leads.length}</b><p>Total leads in this business unit.</p></div>
      <div className="card report-card"><h3>Customers</h3><b>{customers.length}</b><p>Active and historical customers.</p></div>
      <div className="card report-card"><h3>Revenue</h3><b>₹{income.toLocaleString("en-IN")}</b><p>Total recorded income.</p></div>
    </div>
  </>;
}