import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Repeat2 } from "lucide-react";
import { useState } from "react";
import { useBusinessUnit } from "./BusinessUnitContext";
import { auth, firebaseEnabled } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function Layout({children}) {
  const [open,setOpen] = useState(false);
  const {unit,setUnit,config} = useBusinessUnit();
  const navigate = useNavigate();

  const logout = async () => { if (auth) await signOut(auth); };
  const switchUnit = (u) => { setUnit(u); navigate("/"); };

  return <div className="shell">
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand"><div className="mark">F</div><div><b>FSANDHS</b><span>Unified Business Platform</span></div><button className="icon mobile close" onClick={()=>setOpen(false)}><X size={18}/></button></div>
      <div className="switcher"><small>BUSINESS UNIT</small><div className="switch-row"><button className={unit==="recruitment" ? "active" : ""} onClick={()=>switchUnit("recruitment")}>Recruitment</button><button className={unit==="media" ? "active" : ""} onClick={()=>switchUnit("media")}>Media</button></div></div>
      <div className="side-title">{config.accent.toUpperCase()}</div>
      <nav>{config.nav.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to==="/"} onClick={()=>setOpen(false)} className={({isActive})=>`nav ${isActive?"active":""}`}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
      <div className="system-card"><small>SYSTEM</small><b>{firebaseEnabled ? "Firebase Connected" : "Demo Mode"}</b><span>One codebase • Two projections</span></div>
    </aside>
    <main className="main"><header className="topbar"><button className="icon mobile" onClick={()=>setOpen(true)}><Menu size={19}/></button><div><b>{config.brand}</b><span>{config.dashboardDesc}</span></div><button className="top-switch" onClick={()=>switchUnit(unit==="recruitment"?"media":"recruitment")}><Repeat2 size={16}/> Switch to {unit==="recruitment"?"Media":"Recruitment"}</button><div className="user"><div className="avatar">RB</div><div><b>Rajesh</b><span>Super Admin</span></div></div><button className="logout-btn" onClick={logout}>Logout</button></header><section className="content">{children}</section></main>
  </div>
}
