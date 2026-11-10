import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { Card } from "react-bootstrap";
import { AuthProvider, RequireAuth } from "./auth";
import { ConfirmProvider } from "./ui-context";
import Layout from "./components/Layout";
import Page from "./components/Page";
import { ForgotPassword, Login, ResetPassword } from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import ResourceIndex from "./pages/ResourceIndex";
import ResourceShow from "./pages/ResourceShow";
import ResourceForm from "./pages/ResourceForm";
import { RESOURCES } from "./resources";
import { can } from "./resources/helpers";

// One set of routes per resource; `key` makes React start fresh when switching resources.
const resource_routes = (cfg) => {
  const Form = cfg.FormPage || ResourceForm;
  return [
    <Route key={`${cfg.path}-index`} path={cfg.path} element={<ResourceIndex key={cfg.path} cfg={cfg} />} />,
    can(cfg, "create") && <Route key={`${cfg.path}-new`} path={`${cfg.path}/new`} element={<Form key={`${cfg.path}-new`} cfg={cfg} />} />,
    ...(cfg.routes || []).map((r) => <Route key={r.path} path={r.path} element={r.element} />),
    <Route key={`${cfg.path}-show`} path={`${cfg.path}/:id`} element={<ResourceShow key={cfg.path} cfg={cfg} />} />,
    can(cfg, "update") && <Route key={`${cfg.path}-edit`} path={`${cfg.path}/:id/edit`} element={<Form key={`${cfg.path}-edit`} cfg={cfg} />} />,
  ].filter(Boolean);
};

function NotFound() {
  return (
    <Page title="Page not found">
      <Card>
        <Card.Body className="empty-state">
          <span className="feather icon-alert-circle" />
          The page you were looking for doesn&apos;t exist. <Link to="/dashboard">Back to the dashboard</Link>
        </Card.Body>
      </Card>
    </Page>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <ConfirmProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/password/new" element={<ForgotPassword />} />
            <Route path="/password/edit" element={<ResetPassword />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              {RESOURCES.flatMap(resource_routes)}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
