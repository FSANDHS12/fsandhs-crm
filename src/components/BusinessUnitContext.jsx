import { createContext, useContext, useMemo, useState } from "react";
import { getActiveBusinessUnit, setActiveBusinessUnit } from "../lib/store";
import { BUSINESS_UNITS } from "../config";

const Ctx = createContext(null);

export function BusinessUnitProvider({children}) {
  const [unit, setUnitState] = useState(getActiveBusinessUnit());
  const setUnit = (u) => {
    setActiveBusinessUnit(u);
    setUnitState(u);
  };
  const value = useMemo(() => ({ unit, setUnit, config: BUSINESS_UNITS[unit] }), [unit]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusinessUnit() {
  return useContext(Ctx);
}
