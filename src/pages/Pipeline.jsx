import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { list, update } from "../lib/store";
import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";
import { canonicalStage, nextStage, previousStage, isConversionReady } from "../lib/lifecycle";

export default function Pipeline(){
  const {unit,config}=useBusinessUnit();
  const navigate=useNavigate();
  const [tick,setTick]=useState(0);
  const leads=list("leads",unit);

  const normalized=useMemo(
    ()=>leads.map(l=>({...l,displayStage:canonicalStage(unit,l.stage)})),
    [leads,unit,tick]
  );

  const move=(lead,target)=>{
    update("leads",lead.id,{stage:target});
    setTick(x=>x+1);
  };

  return <>
    <PageHead
      title={`${config.label} Revenue Pipeline`}
      desc={config.dashboardDesc}
    />
    <div className="pipeline">
      {config.pipeline.map(stage=>{
        const stageLeads=normalized.filter(l=>l.displayStage===stage);
        return <div className="pipe-col" key={stage}>
          <div className="pipe-head"><span>{stage}</span><span>{stageLeads.length}</span></div>
          {stageLeads.map(l=>{
            const prev=previousStage(unit,l.displayStage);
            const next=nextStage(unit,l.displayStage);
            const conversionReady=isConversionReady(unit,l.displayStage);
            return <div className="leadcard" key={l.id}>
              <b>{l.name}</b>
              <span>{l.industry||"—"} • {l.source||"—"}</span>
              <div>₹{Number(l.value||0).toLocaleString("en-IN")}</div>
              <div style={{display:"flex",gap:6,justifyContent:"space-between",marginTop:10}}>
                {prev?<button className="btn" onClick={()=>move(l,prev)}>← {prev}</button>:<span/>}
                {next
                  ?<button className="btn primary" onClick={()=>move(l,next)}>{next} →</button>
                  :conversionReady
                    ?<button className="btn primary" onClick={()=>navigate(`/customers?leadId=${l.id}`)}>Convert to Customer</button>
                    :null}
              </div>
            </div>;
          })}
        </div>;
      })}
    </div>
  </>;
}