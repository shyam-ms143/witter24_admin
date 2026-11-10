import { useEffect, useState } from "react";
import { Alert, Button, Card, InputGroup, Form } from "react-bootstrap";
import { Navigate, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { notify } from "../ui-context";
import logo from "../assets/images/logo.jpeg";

// hah-admin auth page: auth-wrapper > card (left visual panel + form). Witter24 uses a brand panel
// where hah shows its image slider.
function AuthCard({ title, subtitle, children }) {
  useEffect(() => {
    document.title = `${title} | Witter24 Admin`;
  }, [title]);
  return (
    <div className="auth-wrapper">
      <div className="auth-content">
        <Card className="auth-card">
          <div className="auth-side">
            <img className="auth-side-logo" src={logo} alt="" />
            <h3>Witter24 Admin</h3>
            <p>Review businesses, manage users, plans and payments — all in one place.</p>
          </div>
          <Card.Body className="text-center">
            <img className="auth-logo" src={logo} alt="Witter24" />
            <h4 className="auth-title">{title}</h4>
            {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
            <div className="text-start">{children}</div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <InputGroup>
      <Form.Control
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroup.Text
        role="button"
        aria-label={show ? "Hide password" : "Show password"}
        className={`feather ${show ? "icon-eye-off" : "icon-eye"}`}
        onClick={() => setShow((s) => !s)}
      />
    </InputGroup>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (status === "signed_in") return <Navigate to="/dashboard" replace />;

  const email_error = !email.trim() ? "Email is required" : !EMAIL.test(email.trim()) ? "Must be a valid email" : null;
  const password_error = !password ? "Password is required" : null;

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (email_error || password_error) return;
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      notify.success("Signed in successfully.");
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ""}` : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Sign In" subtitle="Sign in to the admin panel">
      <form noValidate onSubmit={submit}>
        <div className="form-group mb-3">
          <Form.Control type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          {touched && email_error && <small className="text-danger form-text">{email_error}</small>}
        </div>
        <div className="form-group mb-4">
          <PasswordInput value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" />
          {touched && password_error && <small className="text-danger form-text">{password_error}</small>}
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button className="btn-block w-100 mb-4" disabled={busy} type="submit" variant="primary">
          {busy ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      <p className="mb-2 text-muted text-center">
        Forgot password?{" "}
        <NavLink to="/password/new" className="f-w-400">
          Reset
        </NavLink>
      </p>
    </AuthCard>
  );
}

// POST /password
export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const email_error = !email.trim() ? "Email is required" : !EMAIL.test(email.trim()) ? "Must be a valid email" : null;

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (email_error) return;
    setBusy(true);
    try {
      const r = await api.post("/password", { email: email.trim() });
      notify.success(r.message);
      navigate("/login");
    } catch (err) {
      notify.error(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Forgot Password" subtitle="We'll email you a link to reset your password.">
      <form noValidate onSubmit={submit}>
        <div className="form-group mb-3">
          <Form.Control type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          {touched && email_error && <small className="text-danger form-text">{email_error}</small>}
        </div>
        <Button className="btn-block w-100 mb-3" disabled={busy} type="submit" variant="primary">
          Send Reset Password Link
        </Button>
      </form>
      <p className="text-muted text-center">
        <NavLink to="/login">Sign In</NavLink>
      </p>
    </AuthCard>
  );
}

// PUT /password — opened from the emailed link /admin/password/edit?reset_password_token=...
export function ResetPassword() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const token_missing = !sp.get("reset_password_token");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const r = await api.put("/password", {
        reset_password_token: sp.get("reset_password_token") || "",
        password,
        password_confirmation: confirmation,
      });
      notify.success(`${r.message} Please sign in.`);
      navigate("/login");
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else notify.error(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Reset Password" subtitle="Choose a new password (6–128 characters).">
      {token_missing && <Alert variant="warning">This link is missing its reset token. Please use the link from the email.</Alert>}
      {errors.length > 0 && (
        <Alert variant="danger">
          {errors.map((er) => (
            <div key={er}>{er}</div>
          ))}
        </Alert>
      )}
      <form noValidate onSubmit={submit}>
        <div className="form-group mb-3">
          <PasswordInput value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" />
        </div>
        <div className="form-group mb-4">
          <PasswordInput value={confirmation} onChange={setConfirmation} placeholder="Confirm new password" autoComplete="new-password" />
        </div>
        <Button className="btn-block w-100 mb-3" disabled={busy || token_missing} type="submit" variant="primary">
          Change Password
        </Button>
      </form>
      <p className="text-muted text-center">
        <NavLink to="/login">Sign In</NavLink>
      </p>
    </AuthCard>
  );
}
