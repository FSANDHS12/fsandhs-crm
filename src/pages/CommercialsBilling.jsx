import { list } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import { serviceFor, commercialStatus, balanceAmount } from "../lib/services";

export default function CommercialsBilling(){
  const {unit}=useBusinessUnit();
  const customers=list("customers",unit).map(c=>{
    const total=Number(c.total ?? c.amount ?? 0);
    const advance=Number(c.advance ?? Math.min(Number(c.paid||0),total));
    const paid=Number(c.paid ?? c.amountPaid ?? (c.paymentStatus==="Paid"?total:advance) ?? 0);
    const balance=balanceAmount(total,paid);
    return {...c,total,advance,paid,balance,lifecycle:c.lifecycle||commercialStatus(total,advance,paid)};
  });
  return <>
    <PageHead title="Commercials & Billing" desc="Commercial value, collections, balance and billing closure across converted customers."/>
    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Business</th><th>Service</th><th>Lifecycle</th><th>Billing</th><th>Total</th><th>Advance</th><th>Paid</th><th>Balance</th><th>Payment</th></tr></thead>
      <tbody>{customers.map(c=><tr key={c.id}>
        <td><b>{c.business}</b><div className="muted">{c.contact||"—"} • {c.phone||"—"}</div></td>
        <td>{serviceFor(c)||"—"}</td>
        <td><span className="badge">{c.lifecycle}</span></td>
        <td>{c.billing||"—"}</td>
        <td>₹{c.total.toLocaleString("en-IN")}</td>
        <td>₹{c.advance.toLocaleString("en-IN")}</td>
        <td>₹{c.paid.toLocaleString("en-IN")}</td>
        <td>₹{c.balance.toLocaleString("en-IN")}</td>
        <td><span className={`badge ${c.balance<=0?"green":"orange"}`}>{c.balance<=0?"Paid":"Partial"}</span></td>
      </tr>)}</tbody>
    </table></div></div>
  </>;
}