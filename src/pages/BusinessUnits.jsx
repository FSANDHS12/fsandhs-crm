import { useBusinessUnit } from "../components/BusinessUnitContext";
import PageHead from "../components/PageHead";

export default function BusinessUnits(){
  const {unit,setUnit}=useBusinessUnit();
  return <>
    <PageHead title="Business Units" desc="Switch between Recruitment and Media projections."/>
    <div className="grid2">
      <div className="card card-pad"><h3>Recruitment</h3><p>Employer leads, jobs, candidates, placements and revenue.</p><button className={"btn "+(unit==="recruitment"?"primary":"ghost")} onClick={()=>setUnit("recruitment")}>Use Recruitment</button></div>
      <div className="card card-pad"><h3>Media</h3><p>Lead generation, demos, trials, customers, renewals and revenue.</p><button className={"btn "+(unit==="media"?"primary":"ghost")} onClick={()=>setUnit("media")}>Use Media</button></div>
    </div>
  </>;
}