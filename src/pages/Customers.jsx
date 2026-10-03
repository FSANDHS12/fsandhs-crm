import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Eye, IndianRupee, RefreshCcw, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { add, list, remove, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Modal from "../components/Modal";
import Kpi from "../components/Kpi";
import { servicesFor, serviceFor, commercialStatus, balanceAmount } from "../lib/services";

const billingOptions=["Monthly","Yearly","One-Time"];
const statusOptions=["Active","Trial","Expired","Cancelled","Suspended"];
const paymentOptions=["Paid","Pending","Overdue","Partial"];

function nextRenewal(startDate,billing){
  if(!startDate||billing==="One-Time")return "";
  const d=new Date(startDate+"T00:00:00");
  if(billing==="Monthly")d.setMonth(d.getMonth()+1);
  if(billing==="Yearly")d.setFullYear(d.getFullYear()+1);
  return d.toISOString().slice(0,10);
}

function normalizeCommercial(c){
  const total=Number(c.total ?? c.amount ?? 0);
  const advance=Number(c.advance ?? Math.min(Number(c.paid||0),total));
  const paid=Number(c.paid ?? c.amountPaid ?? (c.paymentStatus==="Paid"?total:advance) ?? 0);
  const balance=balanceAmount(total,paid);
  return {...c,total,advance,paid,balance,lifecycle:c.lifecycle||commercialStatus(total,advance,paid)};
}

export default function Customers(){
  const {unit,config}=useBusinessUnit();
  const serviceOptions=servicesFor(unit);
  const [searchParams,setSearchParams]=useSearchParams();
  const [tick,setTick]=useState(0);
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [viewOpen,setViewOpen]=useState(false);
  const [paymentOpen,setPaymentOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);
  const [selectedLeadId,setSelectedLeadId]=useState("");

  const blank={
    business:"",contact:"",phone:"",email:"",service:serviceOptions[0]||"",billing:"Monthly",
    total:0,advance:0,paid:0,startDate:new Date().toISOString().slice(0,10),renewalDate:"",
    status:"Active",paymentStatus:"Pending",notes:"",sourceLeadId:""
  };
  const [form,setForm]=useState(blank);
  const [paymentForm,setPaymentForm]=useState({date:new Date().toISOString().slice(0,10),amount:0,mode:"UPI",reference:"",status:"Paid",notes:""});

  const customers=list("customers",unit).map(normalizeCommercial);
  const leads=list("leads",unit);
  const payments=list("customerPayments",unit);
  const convertedLeadIds=new Set(customers.map(c=>c.sourceLeadId).filter(Boolean));

  const rows=useMemo(()=>customers.filter(c=>
    `${c.business} ${c.contact||""} ${c.phone||""} ${serviceFor(c)}`.toLowerCase().includes(q.toLowerCase())
  ),[customers,q,tick]);

  const active=customers.filter(c=>c.status==="Active").length;
  const listedValue=customers.reduce((s,c)=>s+c.total,0);
  const paymentDue=customers.reduce((s,c)=>s+c.balance,0);

  const applyLead=(leadId)=>{
    setSelectedLeadId(leadId);
    if(!leadId){setForm({...blank});return;}
    const lead=leads.find(l=>l.id===leadId);
    if(!lead)return;
    setForm(prev=>({
      ...prev,
      business:lead.name||"",
      contact:lead.contact||"",
      phone:lead.phone||"",
      email:lead.email||"",
      service:lead.service||prev.service||serviceOptions[0]||"",
      total:Number(lead.value||0),
      sourceLeadId:lead.id,
      notes:prev.notes||`Converted from lead • Source: ${lead.source||"—"}`
    }));
  };

  useEffect(()=>{
    const leadId=searchParams.get("leadId");
    if(!leadId)return;
    if(!leads.some(l=>l.id===leadId))return;
    setEditing(null);setForm({...blank});setOpen(true);
    setTimeout(()=>applyLead(leadId),0);
    setSearchParams({}, {replace:true});
  },[unit]);

  const openNew=()=>{setEditing(null);setSelectedLeadId("");setForm({...blank});setOpen(true)};

  const save=e=>{
    e.preventDefault();
    if(!editing && form.sourceLeadId && customers.some(c=>c.sourceLeadId===form.sourceLeadId)){
      alert("This lead is already converted to a customer.");return;
    }
    const total=Number(form.total||0);
    const advance=Math.min(total,Number(form.advance||0));
    const paid=Math.min(total,Math.max(advance,Number(form.paid||0)));
    const balance=balanceAmount(total,paid);
    const paymentStatus=balance<=0&&total>0?"Paid":paid>0?"Partial":"Pending";
    const lifecycle=commercialStatus(total,advance,paid);
    const data={...form,businessUnit:unit,total,amount:total,advance,paid,balance,paymentStatus,lifecycle,
      service:form.service||serviceOptions[0]||"",
      renewalDate:form.renewalDate||nextRenewal(form.startDate,form.billing)
    };

    if(editing){
      update("customers",editing.id,data);
    }else{
      const created=add("customers",data);
      if(form.sourceLeadId){
        update("leads",form.sourceLeadId,{stage:"Payment",convertedToCustomer:true,customerId:created.id,convertedAt:new Date().toISOString(),service:data.service});
      }
      if(paid>0){
        add("customerPayments",{businessUnit:unit,customerId:created.id,date:data.startDate,amount:paid,mode:"Initial Payment",reference:"",status:"Paid",notes:"Initial / advance payment"});
        add("transactions",{businessUnit:unit,customerId:created.id,sourceLeadId:form.sourceLeadId||"",date:data.startDate,type:"Income",category:"Customer Payment",description:`${data.business} - ${data.service}`,amount:paid,status:"Paid"});
      }
    }
    setOpen(false);setEditing(null);setSelectedLeadId("");setForm({...blank});setTick(x=>x+1);
  };

  const openEdit=c=>{setEditing(c);setSelectedLeadId(c.sourceLeadId||"");setForm({...blank,...c,service:serviceFor(c)});setOpen(true)};
  const openView=c=>{setSelected(c);setViewOpen(true)};
  const openPayment=c=>{setSelected(c);setPaymentForm({date:new Date().toISOString().slice(0,10),amount:c.balance,mode:"UPI",reference:"",status:"Paid",notes:""})};

  const savePayment=e=>{
    e.preventDefault();
    const amount=Math.min(Number(paymentForm.amount||0),selected.balance);
    const newPaid=Math.min(selected.total,selected.paid+amount);
    const balance=balanceAmount(selected.total,newPaid);
    const lifecycle=commercialStatus(selected.total,selected.advance,newPaid);
    const paymentStatus=balance<=0?"Paid":"Partial";
    add("customerPayments",{...paymentForm,amount,customerId:selected.id,businessUnit:unit,status:"Paid"});
    update("customers",selected.id,{paid:newPaid,balance,paymentStatus,lifecycle});
    add("transactions",{businessUnit:unit,customerId:selected.id,sourceLeadId:selected.sourceLeadId||"",date:paymentForm.date,type:"Income",category:"Customer Payment",description:`${selected.business} - ${serviceFor(selected)}`,amount,status:"Paid"});
    if(selected.sourceLeadId)update("leads",selected.sourceLeadId,{stage:"Payment",paymentStatus});
    setPaymentOpen(false);setTick(x=>x+1);
  };

  const renew=c=>{
    if(c.billing==="One-Time"){alert("One-Time customers do not require renewal.");return;}
    const base=c.renewalDate||new Date().toISOString().slice(0,10);
    update("customers",c.id,{renewalDate:nextRenewal(base,c.billing),status:"Active"});
    setTick(x=>x+1);
  };

  return <>
    <PageHead title={`${config.label} Customers`} desc="Manage customers, services, lifecycle, commercial value, collections and renewals." action={<button className="btn primary" onClick={openNew}>+ Add Customer</button>}/>
    <div className="kpis">
      <Kpi label="Customers" value={customers.length} note="Current business unit" icon={UserRoundCheck}/>
      <Kpi label="Active" value={active} note="Active accounts" icon={UserRoundCheck}/>
      <Kpi label="Listed Value" value={`₹${listedValue.toLocaleString("en-IN")}`} note="Total commercial value" icon={IndianRupee}/>
      <Kpi label="Payment Due" value={`₹${paymentDue.toLocaleString("en-IN")}`} note="Outstanding balance" icon={IndianRupee}/>
    </div>

    <div className="toolbar card"><Search size={17}/><input placeholder="Search customer, contact, phone or service..." value={q} onChange={e=>setQ(e.target.value)}/><span>{rows.length} customers</span></div>

    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Business</th><th>Service</th><th>Lifecycle</th><th>Billing</th><th>Total</th><th>Advance</th><th>Paid</th><th>Balance</th><th>Status</th><th>Payment</th><th>Renewal</th><th>Actions</th></tr></thead>
      <tbody>{rows.map(c=><tr key={c.id}>
        <td><b>{c.business}</b><div className="muted">{c.contact||"—"} • {c.phone||"—"}</div></td>
        <td>{serviceFor(c)||"—"}</td>
        <td><span className="badge">{c.lifecycle}</span></td>
        <td>{c.billing||"—"}</td>
        <td>₹{c.total.toLocaleString("en-IN")}</td>
        <td>₹{c.advance.toLocaleString("en-IN")}</td>
        <td>₹{c.paid.toLocaleString("en-IN")}</td>
        <td>₹{c.balance.toLocaleString("en-IN")}</td>
        <td><span className={`badge ${c.status==="Active"?"green":""}`}>{c.status}</span></td>
        <td><span className={`badge ${c.paymentStatus==="Paid"?"green":"orange"}`}>{c.paymentStatus}</span></td>
        <td>{c.billing==="One-Time"?"—":(c.renewalDate||"—")}</td>
        <td className="action-row">
          <button className="icon" onClick={()=>openView(c)}><Eye size={15}/></button>
          <button className="icon" onClick={()=>openEdit(c)}><Pencil size={15}/></button>
          <button className="icon" disabled={c.balance<=0} onClick={()=>{openPayment(c);setPaymentOpen(true)}}><IndianRupee size={15}/></button>
          <button className="icon" onClick={()=>renew(c)}><RefreshCcw size={15}/></button>
          <button className="icon danger-icon" onClick={()=>{if(confirm(`Delete ${c.business}?`)){remove("customers",c.id);setTick(x=>x+1)}}}><Trash2 size={15}/></button>
        </td>
      </tr>)}</tbody>
    </table></div></div>

    <Modal open={open} title={editing?"Edit Customer":"Convert Lead to Customer"} onClose={()=>setOpen(false)}>
      <form className="form" onSubmit={save}>
        <label className="wide">Select Lead<select value={selectedLeadId} disabled={Boolean(editing)} onChange={e=>applyLead(e.target.value)}><option value="">Select from existing leads</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name} — {l.stage||"No Stage"}{convertedLeadIds.has(l.id)?" — Already Converted":""}</option>)}</select></label>
        <label>Business / Customer Name<input required value={form.business||""} onChange={e=>setForm({...form,business:e.target.value})}/></label>
        <label>Contact Person<input value={form.contact||""} onChange={e=>setForm({...form,contact:e.target.value})}/></label>
        <label>Phone<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Email<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label>Service<select value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})}>{serviceOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Billing<select value={form.billing} onChange={e=>setForm({...form,billing:e.target.value})}>{billingOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Total Amount<input type="number" min="0" value={form.total||0} onChange={e=>setForm({...form,total:e.target.value})}/></label>
        <label>Advance<input type="number" min="0" value={form.advance||0} onChange={e=>setForm({...form,advance:e.target.value})}/></label>
        <label>Paid<input type="number" min="0" value={form.paid||0} onChange={e=>setForm({...form,paid:e.target.value})}/></label>
        <label>Balance<input disabled value={balanceAmount(form.total,form.paid)}/></label>
        <label>Start Date<input type="date" value={form.startDate||""} onChange={e=>setForm({...form,startDate:e.target.value})}/></label>
        <label>Renewal Date<input type="date" disabled={form.billing==="One-Time"} value={form.billing==="One-Time"?"":(form.renewalDate||"")} onChange={e=>setForm({...form,renewalDate:e.target.value})}/></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{statusOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="wide">Notes<textarea rows="3" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        <div className="form-actions"><button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Cancel</button><button className="btn primary">{editing?"Save Customer":"Convert & Save Customer"}</button></div>
      </form>
    </Modal>

    <Modal open={viewOpen} title={selected?.business||"Customer"} onClose={()=>setViewOpen(false)}>
      {selected&&<div className="customer-detail">
        <div><span>Service</span><b>{serviceFor(selected)||"—"}</b></div><div><span>Lifecycle</span><b>{selected.lifecycle}</b></div>
        <div><span>Total</span><b>₹{selected.total.toLocaleString("en-IN")}</b></div><div><span>Advance</span><b>₹{selected.advance.toLocaleString("en-IN")}</b></div>
        <div><span>Paid</span><b>₹{selected.paid.toLocaleString("en-IN")}</b></div><div><span>Balance</span><b>₹{selected.balance.toLocaleString("en-IN")}</b></div>
        <div><span>Payment Status</span><b>{selected.paymentStatus}</b></div><div><span>Renewal</span><b>{selected.billing==="One-Time"?"—":selected.renewalDate||"—"}</b></div>
        <div className="wide-detail"><span>Payment History</span><div className="payment-history">{payments.filter(p=>p.customerId===selected.id).length?payments.filter(p=>p.customerId===selected.id).map(p=><div key={p.id}><b>{p.date}</b><span>₹{Number(p.amount||0).toLocaleString("en-IN")} • {p.mode}</span></div>):<span>No payments recorded.</span>}</div></div>
      </div>}
    </Modal>

    <Modal open={paymentOpen} title={`Collect Balance - ${selected?.business||""}`} onClose={()=>setPaymentOpen(false)}>
      <form className="form" onSubmit={savePayment}>
        <label>Date<input type="date" value={paymentForm.date} onChange={e=>setPaymentForm({...paymentForm,date:e.target.value})}/></label>
        <label>Amount<input type="number" min="0" max={selected?.balance||0} value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})}/></label>
        <label>Mode<select value={paymentForm.mode} onChange={e=>setPaymentForm({...paymentForm,mode:e.target.value})}><option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Card</option><option>Razorpay</option><option>Other</option></select></label>
        <label>Reference<input value={paymentForm.reference} onChange={e=>setPaymentForm({...paymentForm,reference:e.target.value})}/></label>
        <label className="wide">Notes<textarea rows="3" value={paymentForm.notes} onChange={e=>setPaymentForm({...paymentForm,notes:e.target.value})}/></label>
        <div className="form-actions"><button className="btn primary">Save Payment</button></div>
      </form>
    </Modal>
  </>;
}