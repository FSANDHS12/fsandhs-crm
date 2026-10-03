export const MEDIA_SERVICES = [
  "Technology & Digital Solutions",
  "Digital Marketing & Lead Generation",
  "Branding & Creative Design",
  "Video & AI Content",
  "Website Development",
  "Photography & Videography",
  "Social Media Management"
];

export const RECRUITMENT_SERVICES = [
  "IT Recruitment",
  "Non-IT Recruitment",
  "Contract Staffing",
  "Permanent Staffing",
  "RPO / Recruitment Support"
];

export function servicesFor(unit){
  return unit==="media" ? MEDIA_SERVICES : RECRUITMENT_SERVICES;
}

export function serviceFor(record) {
  return record?.service || record?.plan || record?.industry || "";
}

export function commercialStatus(total, advance, paid){
  const t=Number(total||0);
  const a=Number(advance||0);
  const p=Number(paid||0);
  if(t>0 && p>=t) return "Billing Closed";
  if(p>0 && p<t) return "Partially Paid";
  if(a>0) return "Advance Received";
  return "Payment Pending";
}

export function balanceAmount(total, paid){
  return Math.max(0, Number(total||0)-Number(paid||0));
}
