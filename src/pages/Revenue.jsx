import { useMemo, useState } from "react";
import { IndianRupee, Receipt, Clock, TrendingUp, Pencil, Trash2, CheckCircle2, Eye } from "lucide-react";
import { add, list, update, remove } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Kpi from "../components/Kpi";
import Modal from "../components/Modal";
import { serviceFor, balanceAmount } from "../lib/services";

const EXPENSE_CATEGORIES=[
  "Salary / Payroll",
  "Freelancer / Vendor",
  "Advertising / Meta Ads",
  "Google Ads",
  "Software / SaaS",
  "Hosting / Domain",
  "Travel / Transport",
  "Office / Utilities",
  "Equipment",
  "Photography / Production",
  "Marketing",
  "Professional Fees",
  "Tax / Government Fees",
  "Other"
];

const INCOME_CATEGORIES=[
  "Other Income",
  "Refund / Reimbursement",
  "Adjustment"
];

const today=()=>new Date().toISOString().slice(0,10);

export default function Revenue(){
  const {unit,config}=useBusinessUnit();
  const [tick,setTick]=useState(0);
  const [open,setOpen]=useState(false);
  const [viewOpen,setViewOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);

  const blank={date:today(),type:"Expense",category:EXPENSE_CATEGORIES[0],description:"",amount:0,status:"Paid",vendor:"",reference:"",notes:""};
  const [form,setForm]=useState(blank);

  const manualRows=list("transactions",unit);
  const customers=list("customers",unit);

  const customerRows=useMemo(()=>customers
    .map(c=>{
      const total=Number(c.total ?? c.amount ?? 0);
      const advance=Number(c.advance ?? 0);
      const paid=Number(c.paid ?? c.amountPaid ?? (c.paymentStatus==="Paid"?total:advance) ?? 0);
      return {
        id:`customer-${c.id}`,
        date:c.startDate||c.createdAt?.slice(0,10)||"",
        type:"Income",
        category:"Advance / Service Payment",
        description:`${c.business} - Payment`,
        amount:paid,
        status:paid>0?"Paid":"Pending",
        customerId:c.id,
        service:serviceFor(c),
        derived:true,
        balance:balanceAmount(total,paid)
      };
    })
    .filter(r=>r.amount>0),[customers,tick]);

  const expenseRows=manualRows.filter(r=>r.type==="Expense");
  const extraIncomeRows=manualRows.filter(r=>r.type==="Income" && !r.customerId);

  const rows=[...customerRows,...extraIncomeRows,...expenseRows]
    .sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const collectedIncome=customerRows.reduce((s,x)=>s+Number(x.amount||0),0)
    + extraIncomeRows.filter(x=>x.status==="Paid").reduce((s,x)=>s+Number(x.amount||0),0);

  const paidExpenses=expenseRows.filter(x=>x.status==="Paid").reduce((s,x)=>s+Number(x.amount||0),0);
  const pendingExpenses=expenseRows.filter(x=>x.status==="Pending").reduce((s,x)=>s+Number(x.amount||0),0);

  const receivables=customers.reduce((s,c)=>{
    const total=Number(c.total ?? c.amount ?? 0);
    const paid=Number(c.paid ?? c.amountPaid ?? (c.paymentStatus==="Paid"?total:Number(c.advance||0)) ?? 0);
    return s+balanceAmount(total,paid);
  },0);

  const net=collectedIncome-paidExpenses;

  const openNew=()=>{
    setEditing(null);
    setForm({...blank,date:today()});
    setOpen(true);
  };

  const openEdit=(row)=>{
    if(row.derived)return;
    setEditing(row);
    setForm({
      date:row.date||today(),
      type:row.type||"Expense",
      category:row.category||"",
      description:row.description||"",
      amount:Number(row.amount||0),
      status:row.status||"Paid",
      vendor:row.vendor||"",
      reference:row.reference||"",
      notes:row.notes||""
    });
    setOpen(true);
  };

  const save=e=>{
    e.preventDefault();
    const payload={...form,businessUnit:unit,amount:Number(form.amount||0)};
    if(editing) update("transactions",editing.id,payload);
    else add("transactions",payload);
    setOpen(false);
    setEditing(null);
    setTick(x=>x+1);
  };

  const markPaid=(row)=>{
    if(row.derived||row.status==="Paid")return;
    update("transactions",row.id,{status:"Paid",paidAt:new Date().toISOString()});
    setTick(x=>x+1);
  };

  const deleteRow=(row)=>{
    if(row.derived)return;
    if(confirm("Delete this transaction?")){
      remove("transactions",row.id);
      setTick(x=>x+1);
    }
  };

  const viewRow=(row)=>{setSelected(row);setViewOpen(true)};

  const categoryOptions=form.type==="Expense"?EXPENSE_CATEGORIES:INCOME_CATEGORIES;

  return <>
    <PageHead
      title={`${config.label} Revenue`}
      desc="Clear cash-flow view: collected income, paid expenses, customer receivables, vendor payables and net cash position."
      action={<button className="btn primary" onClick={openNew}>+ Add Transaction</button>}
    />

    <div className="kpis">
      <Kpi label="Collected Income" value={`₹${collectedIncome.toLocaleString("en-IN")}`} note="Money actually received" icon={IndianRupee}/>
      <Kpi label="Paid Expenses" value={`₹${paidExpenses.toLocaleString("en-IN")}`} note="Money actually spent" icon={Receipt}/>
      <Kpi label="Receivables" value={`₹${receivables.toLocaleString("en-IN")}`} note="Customer balance to collect" icon={Clock}/>
      <Kpi label="Payables" value={`₹${pendingExpenses.toLocaleString("en-IN")}`} note="Pending expenses to pay" icon={Clock}/>
      <Kpi label="Net Cash" value={`₹${net.toLocaleString("en-IN")}`} note="Collected income - paid expenses" icon={TrendingUp}/>
    </div>

    <div className="card card-pad" style={{marginBottom:16}}>
      <h3 style={{marginTop:0}}>How the calculation works</h3>
      <div className="grid3">
        <div><b>Income</b><p className="muted">Only customer collections and manual income marked Paid.</p></div>
        <div><b>Expenses</b><p className="muted">Only expenses marked Paid reduce Net Cash.</p></div>
        <div><b>Pending</b><p className="muted">Receivables and Payables stay separate so cash flow is clear.</p></div>
      </div>
    </div>

    <div className="card"><div className="table-wrap"><table>
      <thead>
        <tr>
          <th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Party</th><th>Service</th><th>Amount</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>{rows.map(r=><tr key={r.id}>
        <td>{r.date||"—"}</td>
        <td>{r.type}</td>
        <td>{r.category||"—"}</td>
        <td>{r.description||"—"}</td>
        <td>{r.vendor||"—"}</td>
        <td>{r.service||"—"}</td>
        <td>₹{Number(r.amount||0).toLocaleString("en-IN")}</td>
        <td><span className={`badge ${r.status==="Paid"?"green":"orange"}`}>{r.status}</span></td>
        <td className="action-row">
          <button className="icon" title="View" onClick={()=>viewRow(r)}><Eye size={15}/></button>
          {!r.derived && <button className="icon" title="Edit" onClick={()=>openEdit(r)}><Pencil size={15}/></button>}
          {!r.derived && r.status==="Pending" && <button className="icon" title="Mark Paid" onClick={()=>markPaid(r)}><CheckCircle2 size={15}/></button>}
          {!r.derived && <button className="icon danger-icon" title="Delete" onClick={()=>deleteRow(r)}><Trash2 size={15}/></button>}
        </td>
      </tr>)}</tbody>
    </table></div></div>

    <Modal open={open} title={editing?"Edit Transaction":"Add Transaction"} onClose={()=>setOpen(false)}>
      <form className="form" onSubmit={save}>
        <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>

        <label>Type
          <select value={form.type} onChange={e=>{
            const type=e.target.value;
            const options=type==="Expense"?EXPENSE_CATEGORIES:INCOME_CATEGORIES;
            setForm({...form,type,category:options[0]});
          }}>
            <option>Expense</option>
            <option>Income</option>
          </select>
        </label>

        <label>Category
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {categoryOptions.map(x=><option key={x}>{x}</option>)}
          </select>
        </label>

        <label>{form.type==="Expense"?"Vendor / Paid To":"Received From"}
          <input value={form.vendor||""} onChange={e=>setForm({...form,vendor:e.target.value})}/>
        </label>

        <label>Amount
          <input type="number" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/>
        </label>

        <label>Status
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Paid</option>
            <option>Pending</option>
          </select>
        </label>

        <label className="wide">Description
          <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/>
        </label>

        <label>Reference / Invoice No.
          <input value={form.reference||""} onChange={e=>setForm({...form,reference:e.target.value})}/>
        </label>

        <label className="wide">Notes
          <textarea rows="3" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
        </label>

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn primary">{editing?"Save Changes":"Save Transaction"}</button>
        </div>
      </form>
    </Modal>

    <Modal open={viewOpen} title="Transaction Details" onClose={()=>setViewOpen(false)}>
      {selected&&<div className="customer-detail">
        <div><span>Date</span><b>{selected.date||"—"}</b></div>
        <div><span>Type</span><b>{selected.type||"—"}</b></div>
        <div><span>Category</span><b>{selected.category||"—"}</b></div>
        <div><span>Status</span><b>{selected.status||"—"}</b></div>
        <div><span>Amount</span><b>₹{Number(selected.amount||0).toLocaleString("en-IN")}</b></div>
        <div><span>Party</span><b>{selected.vendor||"—"}</b></div>
        <div><span>Reference</span><b>{selected.reference||"—"}</b></div>
        <div><span>Service</span><b>{selected.service||"—"}</b></div>
        <div className="wide-detail"><span>Description</span><b>{selected.description||"—"}</b></div>
        <div className="wide-detail"><span>Notes</span><b>{selected.notes||"—"}</b></div>
        {selected.derived&&<div className="wide-detail"><span>Source</span><b>Auto-derived from Customer collections. Edit it from the Customer record, not Revenue.</b></div>}
      </div>}
    </Modal>
  </>;
}