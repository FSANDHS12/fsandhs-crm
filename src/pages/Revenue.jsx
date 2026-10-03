import { useMemo, useState } from "react";
import { IndianRupee,Receipt,Clock,TrendingUp } from "lucide-react";
import { add,list } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import Kpi from "../components/Kpi";
import Modal from "../components/Modal";
import { serviceFor, balanceAmount } from "../lib/services";

export default function Revenue(){
  const {unit,config}=useBusinessUnit();
  const [tick,setTick]=useState(0);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),type:"Income",category:"",description:"",amount:0,status:"Paid"});

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

  const income=customerRows.reduce((s,x)=>s+Number(x.amount||0),0)
    + extraIncomeRows.filter(x=>x.status!=="Pending").reduce((s,x)=>s+Number(x.amount||0),0);

  const expense=expenseRows.reduce((s,x)=>s+Number(x.amount||0),0);

  const pending=customers.reduce((s,c)=>{
    const total=Number(c.total ?? c.amount ?? 0);
    const paid=Number(c.paid ?? c.amountPaid ?? (c.paymentStatus==="Paid"?total:Number(c.advance||0)) ?? 0);
    return s+balanceAmount(total,paid);
  },0);

  const save=e=>{
    e.preventDefault();
    add("transactions",{...form,businessUnit:unit,amount:Number(form.amount)});
    setOpen(false);
    setTick(x=>x+1);
  };

  return <>
    <PageHead title={`${config.label} Revenue`} desc="Revenue is derived from customer collections, with manual expenses and adjustments kept separately." action={<button className="btn primary" onClick={()=>setOpen(true)}>+ Transaction</button>}/>
    <div className="kpis">
      <Kpi label="Income" value={`₹${income.toLocaleString("en-IN")}`} note="Customer collections" icon={IndianRupee}/>
      <Kpi label="Expenses" value={`₹${expense.toLocaleString("en-IN")}`} note="Operating spend" icon={Receipt}/>
      <Kpi label="Pending" value={`₹${pending.toLocaleString("en-IN")}`} note="Collections due" icon={Clock}/>
      <Kpi label="Net" value={`₹${(income-expense).toLocaleString("en-IN")}`} note="Income - expense" icon={TrendingUp}/>
    </div>
    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Service</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.id}>
        <td>{r.date||"—"}</td>
        <td>{r.type}</td>
        <td>{r.category}</td>
        <td>{r.description}</td>
        <td>{r.service||"—"}</td>
        <td>₹{Number(r.amount||0).toLocaleString("en-IN")}</td>
        <td><span className={`badge ${r.status==="Paid"?"green":"orange"}`}>{r.status}</span></td>
      </tr>)}</tbody>
    </table></div></div>

    <Modal open={open} title="Add Transaction" onClose={()=>setOpen(false)}>
      <form className="form" onSubmit={save}>
        <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Income</option><option>Expense</option></select></label>
        <label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label>
        <label>Amount<input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
        <label className="wide">Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Paid</option><option>Pending</option></select></label>
        <div className="form-actions"><button className="btn primary">Save</button></div>
      </form>
    </Modal>
  </>;
}