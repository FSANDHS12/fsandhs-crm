import {
  LayoutDashboard, Users, KanbanSquare, Briefcase, UserSearch,
  Megaphone, Workflow, IndianRupee, BarChart3, Settings,
  Clock3, RefreshCcw
} from "lucide-react";
import { PIPELINES } from "./lib/lifecycle";

export const BUSINESS_UNITS = {
  recruitment: {
    label: "Recruitment",
    brand: "FSANDHS Recruitment",
    accent: "Recruitment Projection",
    pipeline: PIPELINES.recruitment,
    sources: ["LinkedIn","Email","WhatsApp","Website","Referral","Meta Ads","Google Ads","Manual"],
    dashboardDesc: "Employer Lead → Requirement → Sourcing → Submission → Interview → Offer → Joining → Invoice → Payment → Customer Revenue",
    nav: [
      ["/","Dashboard",LayoutDashboard],
      ["/leads","Employer Leads",Users],
      ["/pipeline","Pipeline",KanbanSquare],
      ["/jobs","Job Requirements",Briefcase],
      ["/candidates","Candidates / ATS",UserSearch],
      ["/campaigns","Campaigns",Megaphone],
      ["/automation","Automation",Workflow],
      ["/customers","Customers",Users],
      ["/revenue","Revenue",IndianRupee],
      ["/reports","Reports",BarChart3],
      ["/settings","Settings",Settings]
    ]
  },
  media: {
    label: "Media",
    brand: "FSANDHS Media",
    accent: "Media Projection",
    pipeline: PIPELINES.media,
    sources: ["Instagram","Facebook","Meta Ads","WhatsApp","Website","Google Ads","Google Business","Email","Referral","Manual"],
    dashboardDesc: "Lead Generation → Follow-up → Demo → 14-Day Trial → Payment → Customer → Renewal → Revenue",
    nav: [
      ["/","Dashboard",LayoutDashboard],
      ["/leads","Leads",Users],
      ["/pipeline","Pipeline",KanbanSquare],
      ["/campaigns","Campaigns",Megaphone],
      ["/automation","Automation",Workflow],
      ["/trials","Trials / Demos",Clock3],
      ["/customers","Customers",Users],
      ["/revenue","Revenue",IndianRupee],
      ["/renewals","Renewals",RefreshCcw],
      ["/reports","Reports",BarChart3],
      ["/settings","Settings",Settings]
    ]
  }
};
