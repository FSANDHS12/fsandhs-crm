import { useMemo } from "react";
import { add, list, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";

function addPeriod(date,billing){
  if(!date||billing==="One-Time")return "";
  const d=new Date(date+"T00:00:00");
  if(billing==="Monthly")d.setMonth(d.getMonth()+1);
  if(billing==="Yearly")d.setFullYear(d.getFullYear()+1);
  return d.toISOString().slice(0,10);
}

export default function Renewals(){
  const {unit,config}=useBusinessUnit();
  const customers=list("customers",unit);
  const rows=useMemo(
    ()=>customers.filter(c=>c.billing!=="One-Time").sort((a,b)=>(a.renewalDate||"").localeCompare(b.renewalDate||"")),
    [customers]
  );

  const markRenewed=(c)=>{
    const today=new Date().toISOString().slice(0,10);
    const base=c.renewalDate||today;
    add("customerPayments",{
      businessUnit:unit,
      customerId:c.id,
      date:today,
      amount:Number(c.amount||0),
      mode:"Renewal",
      reference:"",
      status:"Paid",
      notes:"Renewal payment"
    });
    add("transactions",{
      businessUnit:unit,
      customerId:c.id,
      date:today,
      type:"Income",
      category:"Renewal",
      description:`${c.business} - ${c.plan||"Service"} renewal`,
      amount:Number(c.amount||0),
      status:"Paid"
    });
    update("customers",c.id,{
      renewalDate:addPeriod(base,c.billing),
      paymentStatus:"Paid",
      status:"Active",
      lastRenewedAt:new Date().toISOString()
    });
    location.reload();
  };

  return <>
    <PageHead title={`${config.label} Renewals`} desc="Customer → Renewal → Revenue"/>
    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Customer</th><th>Plan / Service</th><th>Billing</th><th>Amount</th><th>Renewal Date</th><th>Payment</th><th>Action</th></tr></thead>
      <tbody>{rows.length?rows.map(c=><tr key={c.id}>
        <td><b>{c.business}</b><div className="muted">{c.contact||"—"}</div></td>
        <td>{c.plan||"—"}</td><td>{c.billing}</td>
        <td>₹{Number(c.amount||0).toLocaleString("en-IN")}</td>
        <td>{c.renewalDate||"—"}</td>
        <td><span className={`badge ${c.paymentStatus==="Paid"?"green":"orange"}`}>{c.paymentStatus||"—"}</span></td>
        <td><button className="btn primary" onClick={()=>markRenewed(c)}>Record Renewal Payment</button></td>
      </tr>):<tr><td colSpan="7" className="empty">No recurring customers.</td></tr>}</tbody>
    </table></div></div>
  </>;
}