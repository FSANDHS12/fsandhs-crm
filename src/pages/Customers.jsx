import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Eye, IndianRupee, RefreshCcw, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { add, list, remove, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Modal from "../components/Modal";
import Kpi from "../components/Kpi";

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

export default function Customers(){
  const {unit,config}=useBusinessUnit();
  const [searchParams,setSearchParams]=useSearchParams();
  const [tick,setTick]=useState(0);
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [viewOpen,setViewOpen]=useState(false);
  const [paymentOpen,setPaymentOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);
  const [selectedLeadId,setSelectedLeadId]=useState("");

  const [paymentForm,setPaymentForm]=useState({
    date:new Date().toISOString().slice(0,10),amount:0,mode:"UPI",reference:"",status:"Paid",notes:""
  });

  const blank={
    business:"",contact:"",phone:"",email:"",plan:"",billing:"Monthly",amount:0,
    startDate:new Date().toISOString().slice(0,10),renewalDate:"",
    status:"Active",paymentStatus:"Paid",notes:"",sourceLeadId:""
  };

  const [form,setForm]=useState(blank);
  const customers=list("customers",unit);
  const leads=list("leads",unit);
  const payments=list("customerPayments",unit);

  const convertedLeadIds=new Set(customers.map(c=>c.sourceLeadId).filter(Boolean));

  const rows=useMemo(
    ()=>customers.filter(c=>`${c.business} ${c.contact||""} ${c.phone||""} ${c.plan||""}`.toLowerCase().includes(q.toLowerCase())),
    [customers,q,tick]
  );

  const income=customers.reduce((s,c)=>s+Number(c.amount||0),0);
  const active=customers.filter(c=>c.status==="Active").length;
  const due=customers.filter(c=>["Pending","Overdue","Partial"].includes(c.paymentStatus)).length;

  const applyLead=(leadId)=>{
    setSelectedLeadId(leadId);
    if(!leadId){
      setForm({...blank});
      return;
    }
    const lead=leads.find(l=>l.id===leadId);
    if(!lead)return;
    setForm(prev=>({
      ...prev,
      business:lead.name||"",
      contact:lead.contact||"",
      phone:lead.phone||"",
      email:lead.email||"",
      plan:prev.plan||lead.industry||"",
      amount:Number(lead.value||0),
      sourceLeadId:lead.id,
      notes:prev.notes||`Converted from lead • Source: ${lead.source||"—"} • Stage: ${lead.stage||"—"}`
    }));
  };

  useEffect(()=>{
    const leadId=searchParams.get("leadId");
    if(!leadId)return;
    const lead=leads.find(l=>l.id===leadId);
    if(!lead)return;
    setEditing(null);
    setForm({...blank});
    setOpen(true);
    setTimeout(()=>applyLead(leadId),0);
    setSearchParams({}, {replace:true});
  },[unit]);

  const openNew=()=>{
    setEditing(null);
    setSelectedLeadId("");
    setForm({...blank});
    setOpen(true);
  };

  const save=e=>{
    e.preventDefault();

    if(!editing && form.sourceLeadId){
      const existing=customers.find(c=>c.sourceLeadId===form.sourceLeadId);
      if(existing){
        alert(`${existing.business} is already linked to this lead.`);
        return;
      }
    }

    const data={
      ...form,
      businessUnit:unit,
      amount:Number(form.amount||0),
      renewalDate:form.renewalDate||nextRenewal(form.startDate,form.billing)
    };

    if(editing){
      update("customers",editing.id,data);
    }else{
      const created=add("customers",data);
      if(form.sourceLeadId){
        update("leads",form.sourceLeadId,{
          stage:"Payment",
          convertedToCustomer:true,
          customerId:created.id,
          convertedAt:new Date().toISOString()
        });
      }
      if(data.paymentStatus==="Paid"){
        add("customerPayments",{
          businessUnit:unit,
          customerId:created.id,
          date:data.startDate,
          amount:Number(data.amount||0),
          mode:"Initial Payment",
          reference:"",
          status:"Paid",
          notes:"Customer conversion payment"
        });
        add("transactions",{
          businessUnit:unit,
          customerId:created.id,
          sourceLeadId:form.sourceLeadId||"",
          date:data.startDate,
          type:"Income",
          category:unit==="recruitment"?"Placement / Client Payment":"Customer Payment",
          description:`${data.business} - ${data.plan||"Service"}`,
          amount:Number(data.amount||0),
          status:"Paid"
        });
      }
    }

    setOpen(false);
    setEditing(null);
    setSelectedLeadId("");
    setForm({...blank});
    setTick(x=>x+1);
  };

  const openEdit=c=>{
    setEditing(c);
    setSelectedLeadId(c.sourceLeadId||"");
    setForm({...blank,...c});
    setOpen(true);
  };

  const openView=c=>{setSelected(c);setViewOpen(true)};
  const openPayment=c=>{
    setSelected(c);
    setPaymentForm({
      date:new Date().toISOString().slice(0,10),
      amount:Number(c.amount||0),mode:"UPI",reference:"",status:"Paid",notes:""
    });
    setPaymentOpen(true);
  };

  const savePayment=e=>{
    e.preventDefault();
    add("customerPayments",{...paymentForm,amount:Number(paymentForm.amount||0),customerId:selected.id,businessUnit:unit});
    update("customers",selected.id,{paymentStatus:paymentForm.status});
    if(paymentForm.status==="Paid"){
      add("transactions",{
        businessUnit:unit,
        customerId:selected.id,
        sourceLeadId:selected.sourceLeadId||"",
        date:paymentForm.date,
        type:"Income",
        category:"Customer Payment",
        description:`${selected.business} - ${selected.plan||"Service"}`,
        amount:Number(paymentForm.amount||0),
        status:"Paid"
      });
      if(selected.sourceLeadId){
        update("leads",selected.sourceLeadId,{stage:"Payment",paymentStatus:"Paid"});
      }
    }
    setPaymentOpen(false);
    setTick(x=>x+1);
  };

  const renew=c=>{
    if(c.billing==="One-Time"){alert("One-Time customers do not require renewal.");return;}
    const base=c.renewalDate||new Date().toISOString().slice(0,10);
    update("customers",c.id,{renewalDate:nextRenewal(base,c.billing),status:"Active",paymentStatus:"Pending"});
    setTick(x=>x+1);
  };

  return <>
    <PageHead
      title={`${config.label} Customers`}
      desc="Convert existing leads into customers and manage subscriptions, payments and renewals."
      action={<button className="btn primary" onClick={openNew}>+ Add Customer</button>}
    />

    <div className="kpis">
      <Kpi label="Customers" value={customers.length} note="Current business unit" icon={UserRoundCheck}/>
      <Kpi label="Active" value={active} note="Active accounts" icon={UserRoundCheck}/>
      <Kpi label="Listed Value" value={`₹${income.toLocaleString("en-IN")}`} note="Plan / service value" icon={IndianRupee}/>
      <Kpi label="Payment Due" value={due} note="Pending / overdue" icon={IndianRupee}/>
    </div>

    <div className="toolbar card">
      <Search size={17}/>
      <input placeholder="Search customer, contact, phone or plan..." value={q} onChange={e=>setQ(e.target.value)}/>
      <span>{rows.length} customers</span>
    </div>

    <div className="card">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Business</th><th>Source Lead</th><th>Plan</th><th>Billing</th><th>Amount</th><th>Status</th><th>Payment</th><th>Renewal</th><th>Actions</th></tr></thead>
          <tbody>{rows.map(c=>{
            const lead=leads.find(l=>l.id===c.sourceLeadId);
            return <tr key={c.id}>
              <td><b>{c.business}</b><div className="muted">{c.contact||"—"} • {c.phone||"—"}</div></td>
              <td>{lead?<><b>{lead.name}</b><div className="muted">{lead.stage||"—"}</div></>:"—"}</td>
              <td>{c.plan||"—"}</td><td>{c.billing||"—"}</td>
              <td>₹{Number(c.amount||0).toLocaleString("en-IN")}</td>
              <td><span className={`badge ${c.status==="Active"?"green":c.status==="Expired"?"orange":""}`}>{c.status}</span></td>
              <td><span className={`badge ${c.paymentStatus==="Paid"?"green":c.paymentStatus==="Overdue"?"orange":""}`}>{c.paymentStatus||"—"}</span></td>
              <td>{c.billing==="One-Time"?"Not Applicable":(c.renewalDate||"—")}</td>
              <td className="action-row">
                <button className="icon" onClick={()=>openView(c)}><Eye size={15}/></button>
                <button className="icon" onClick={()=>openEdit(c)}><Pencil size={15}/></button>
                <button className="icon" onClick={()=>openPayment(c)}><IndianRupee size={15}/></button>
                <button className="icon" onClick={()=>renew(c)}><RefreshCcw size={15}/></button>
                <button className="icon danger-icon" onClick={()=>{if(confirm(`Delete ${c.business}? This will remove the customer record.`)){remove("customers",c.id);setTick(x=>x+1)}}}><Trash2 size={15}/></button>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>

    <Modal open={open} title={editing?"Edit Customer":"Convert Lead to Customer"} onClose={()=>setOpen(false)}>
      <form className="form" onSubmit={save}>
        <label className="wide">Select Lead
          <select
            value={selectedLeadId}
            disabled={Boolean(editing)}
            onChange={e=>applyLead(e.target.value)}
          >
            <option value="">Select from existing leads</option>
            {leads.map(l=><option key={l.id} value={l.id}>
              {l.name} — {l.stage||"No Stage"}{convertedLeadIds.has(l.id)?" — Already Converted":""}
            </option>)}
          </select>
        </label>

        <label>Business / Customer Name<input required value={form.business||""} onChange={e=>setForm({...form,business:e.target.value})}/></label>
        <label>Contact Person<input value={form.contact||""} onChange={e=>setForm({...form,contact:e.target.value})}/></label>
        <label>Phone<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Email<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label>Plan / Service<input value={form.plan||""} onChange={e=>setForm({...form,plan:e.target.value})}/></label>
        <label>Billing<select value={form.billing} onChange={e=>setForm({...form,billing:e.target.value})}>{billingOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Amount<input type="number" value={form.amount||0} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
        <label>Start Date<input type="date" value={form.startDate||""} onChange={e=>setForm({...form,startDate:e.target.value})}/></label>
        <label>Renewal Date<input type="date" disabled={form.billing==="One-Time"} value={form.billing==="One-Time"?"":(form.renewalDate||"")} onChange={e=>setForm({...form,renewalDate:e.target.value})}/></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{statusOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Payment Status<select value={form.paymentStatus} onChange={e=>setForm({...form,paymentStatus:e.target.value})}>{paymentOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="wide">Notes<textarea rows="3" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn primary">{editing?"Save Customer":"Convert & Save Customer"}</button>
        </div>
      </form>
    </Modal>

    <Modal open={viewOpen} title={selected?.business||"Customer"} onClose={()=>setViewOpen(false)}>
      {selected&&<div className="customer-detail">
        <div><span>Business Unit</span><b>{config.label}</b></div>
        <div><span>Contact</span><b>{selected.contact||"—"}</b></div>
        <div><span>Phone</span><b>{selected.phone||"—"}</b></div>
        <div><span>Email</span><b>{selected.email||"—"}</b></div>
        <div><span>Plan / Service</span><b>{selected.plan||"—"}</b></div>
        <div><span>Billing</span><b>{selected.billing||"—"}</b></div>
        <div><span>Amount</span><b>₹{Number(selected.amount||0).toLocaleString("en-IN")}</b></div>
        <div><span>Start Date</span><b>{selected.startDate||"—"}</b></div>
        <div><span>Renewal</span><b>{selected.billing==="One-Time"?"Not Applicable":selected.renewalDate||"—"}</b></div>
        <div><span>Status</span><b>{selected.status||"—"}</b></div>
        <div><span>Payment Status</span><b>{selected.paymentStatus||"—"}</b></div>
        <div className="wide-detail"><span>Notes</span><b>{selected.notes||"—"}</b></div>
        <div className="wide-detail">
          <span>Payment History</span>
          <div className="payment-history">
            {payments.filter(p=>p.customerId===selected.id).length
              ?payments.filter(p=>p.customerId===selected.id).map(p=><div key={p.id}><b>{p.date}</b><span>₹{Number(p.amount||0).toLocaleString("en-IN")} • {p.mode} • {p.status}</span></div>)
              :<span>No payments recorded.</span>}
          </div>
        </div>
      </div>}
    </Modal>

    <Modal open={paymentOpen} title={`Add Payment - ${selected?.business||""}`} onClose={()=>setPaymentOpen(false)}>
      <form className="form" onSubmit={savePayment}>
        <label>Date<input type="date" value={paymentForm.date} onChange={e=>setPaymentForm({...paymentForm,date:e.target.value})}/></label>
        <label>Amount<input type="number" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})}/></label>
        <label>Mode<select value={paymentForm.mode} onChange={e=>setPaymentForm({...paymentForm,mode:e.target.value})}><option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Card</option><option>Razorpay</option><option>Other</option></select></label>
        <label>Reference<input value={paymentForm.reference} onChange={e=>setPaymentForm({...paymentForm,reference:e.target.value})}/></label>
        <label>Status<select value={paymentForm.status} onChange={e=>setPaymentForm({...paymentForm,status:e.target.value})}>{paymentOptions.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="wide">Notes<textarea rows="3" value={paymentForm.notes} onChange={e=>setPaymentForm({...paymentForm,notes:e.target.value})}/></label>
        <div className="form-actions"><button className="btn primary">Save Payment</button></div>
      </form>
    </Modal>
  </>;
}