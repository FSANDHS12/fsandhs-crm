export const PIPELINES = {
  recruitment: ["New Lead","Requirement","Sourcing","Submission","Interview","Offer","Joining","Invoice","Payment"],
  media: ["New Lead","Follow-up","Demo","14-Day Trial","Payment"]
};

const aliases = {
  recruitment: {
    "Submitted":"Submission",
    "Joined":"Joining",
    "Paid":"Payment"
  },
  media: {
    "Contacted":"Follow-up",
    "Interested":"Follow-up",
    "Payment Pending":"Payment",
    "Paid":"Payment"
  }
};

export function canonicalStage(unit, stage) {
  if (!stage) return PIPELINES[unit]?.[0] || "New Lead";
  return aliases[unit]?.[stage] || stage;
}

export function stagesFor(unit) {
  return PIPELINES[unit] || [];
}

export function nextStage(unit, stage) {
  const stages=stagesFor(unit);
  const current=canonicalStage(unit,stage);
  const i=stages.indexOf(current);
  return i>=0 && i<stages.length-1 ? stages[i+1] : null;
}

export function previousStage(unit, stage) {
  const stages=stagesFor(unit);
  const current=canonicalStage(unit,stage);
  const i=stages.indexOf(current);
  return i>0 ? stages[i-1] : null;
}

export function paymentStage(unit) {
  return "Payment";
}

export function isConversionReady(unit, stage) {
  return canonicalStage(unit,stage) === paymentStage(unit);
}
