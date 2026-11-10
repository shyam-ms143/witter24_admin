import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, set_unauthorized_handler, token } from "./api";
import { notify } from "./ui-context";
import { Loading } from "./components/ui";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState(() => (token.get() ? "checking" : "signed_out"));

  const sign_out_local = useCallback(() => {
    token.clear();
    setAdmin(null);
    setStatus("signed_out");
  }, []);

  useEffect(() => {
    set_unauthorized_handler(() => {
      sign_out_local();
      notify.error("Your session expired. Please sign in again.");
    });
  }, [sign_out_local]);

  useEffect(() => {
    if (status !== "checking") return;
    api
      .get("/me")
      .then((r) => {
        setAdmin(r.admin_user);
        setStatus("signed_in");
      })
      .catch(sign_out_local);
    // only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/login", { email, password });
    token.set(r.token);
    setAdmin(r.admin_user);
    setStatus("signed_in");
  };

  // POST /logout bumps token_version: every token of this admin stops working.
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      /* signed out locally either way */
    }
    sign_out_local();
    notify.success("Signed out successfully.");
  };

  return <AuthContext.Provider value={{ admin, status, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "checking") return <Loading full />;
  if (status !== "signed_in") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
