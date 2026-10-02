import { createContext, useContext } from "react";

export const AccessContext = createContext(null);

export const useAccess = () => {
  const value = useContext(AccessContext);
  if (!value) throw new Error("useAccess must be used inside <AccessProvider>");
  return value;
};
