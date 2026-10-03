import { Routes,Route } from "react-router-dom";
import { BusinessUnitProvider } from "./components/BusinessUnitContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Automation from "./pages/Automation";
import Customers from "./pages/Customers";
import Revenue from "./pages/Revenue";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import GenericList from "./pages/GenericList";
import Trials from "./pages/Trials";
import Renewals from "./pages/Renewals";
import CommercialsBilling from "./pages/CommercialsBilling";

export default function App() {
  return (
    <BusinessUnitProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/leads" element={<Leads/>}/>
          <Route path="/pipeline" element={<Pipeline/>}/>
          <Route path="/campaigns" element={<GenericList type="campaigns"/>}/>
          <Route path="/automation" element={<Automation/>}/>
          <Route path="/customers" element={<Customers/>}/>
          <Route path="/commercials" element={<CommercialsBilling/>}/>
          <Route path="/revenue" element={<Revenue/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/jobs" element={<GenericList type="jobs"/>}/>
          <Route path="/candidates" element={<GenericList type="candidates"/>}/>
          <Route path="/trials" element={<Trials/>}/>
          <Route path="/renewals" element={<Renewals/>}/>
        </Routes>
      </Layout>
    </BusinessUnitProvider>
  );
}
