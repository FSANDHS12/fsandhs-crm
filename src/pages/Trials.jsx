import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { list, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import { canonicalStage, nextStage } from "../lib/lifecycle";

export default function Trials(){
  const {unit}=useBusinessUnit();
  const navigate=useNavigate();
  if(unit!=="media"){
    return <><PageHead title="Trials / Demos" desc="This module is available for the Media projection."/><div className="card card-pad">Switch to <b>Media</b> to view demo and trial conversion records.</div></>;
  }

  const leads=list("leads",unit);
  const rows=useMemo(
    ()=>leads.map(l=>({...l,displayStage:canonicalStage(unit,l.stage)}))
      .filter(x=>["Demo","14-Day Trial","Payment"].includes(x.displayStage)),
    [leads]
  );

  return <>
    <PageHead title="Trials / Demos" desc="Demo → 14-Day Trial → Payment → Customer"/>
    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Business</th><th>Source</th><th>Stage</th><th>Potential</th><th>Follow-up</th><th>Action</th></tr></thead>
      <tbody>{rows.length?rows.map(l=>{
        const next=nextStage(unit,l.displayStage);
        return <tr key={l.id}>
          <td><b>{l.name}</b><div className="muted">{l.contact||"—"}</div></td>
          <td>{l.source||"—"}</td>
          <td><span className="badge">{l.displayStage}</span></td>
          <td>₹{Number(l.value||0).toLocaleString("en-IN")}</td>
          <td>{l.nextFollowUp||"—"}</td>
          <td>{next
            ?<button className="btn primary" onClick={()=>{update("leads",l.id,{stage:next});location.reload();}}>Move to {next}</button>
            :<button className="btn primary" onClick={()=>navigate(`/customers?leadId=${l.id}`)}>Convert to Customer</button>}
          </td>
        </tr>;
      }):<tr><td colSpan="6" className="empty">No demo or trial records.</td></tr>}</tbody>
    </table></div></div>
  </>;
}