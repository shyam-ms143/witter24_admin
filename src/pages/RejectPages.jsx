import { useEffect, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { notify, useConfirm } from "../ui-context";
import Page from "../components/Page";
import { ErrorBox, Loading } from "../components/ui";
import { fmt_day_time, short_id } from "../utils/format";

// GET /businesses/:id/reject, POST /businesses/:id/do_reject
export function BusinessReject() {
  const { id } = useParams();
  return (
    <RejectForm
      path={`/businesses/${id}`}
      crumbs={[
        { label: "Businesses", to: "/businesses" },
        { label: short_id(id), to: `/businesses/${id}` },
        { label: "Reject" },
      ]}
      title={(d) => `Reject: ${d.name || "Business"}`}
      subtitle={(d) => `${d.name || ""} — ${d.category || ""}`}
      intro="Provide a clear reason for rejection. This message will be shown to the business owner inside the app and sent via email so they know exactly what to fix before resubmitting."
      placeholder="e.g. Documents are blurry or unreadable. GSTIN could not be verified. Please re-upload clear copies of all documents and ensure your business details are accurate."
      hint="This reason will be visible to the business owner in the app and included in the rejection email."
      submit_label="Confirm Rejection & Notify Owner"
      cancel_to={`/businesses/${id}`}
      done_to={`/businesses/${id}`}
    />
  );
}

// GET /business_upgrade_requests/:id/reject, POST .../do_reject (reason required)
export function UpgradeRequestReject() {
  const { id } = useParams();
  return (
    <RejectForm
      path={`/business_upgrade_requests/${id}`}
      crumbs={[
        { label: "Upgrade Requests", to: "/business_upgrade_requests" },
        { label: short_id(id), to: `/business_upgrade_requests/${id}` },
        { label: "Reject" },
      ]}
      title={() => "Reject Upgrade Request"}
      subtitle={(d) => `User: ${d.user?.name || "Unknown"} (${d.user?.phone_number || "—"}) · Requested At: ${fmt_day_time(d.requested_at)}`}
      placeholder="Explain why this request is being rejected…"
      submit_label="Confirm Rejection"
      confirm="Are you sure you want to reject this request?"
      cancel_to={`/business_upgrade_requests/${id}`}
      done_to="/business_upgrade_requests"
    />
  );
}

function RejectForm({ path, crumbs, title, subtitle, intro, placeholder, hint, submit_label, confirm: question, cancel_to, done_to }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`${path}/reject`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  }, [path]);

  const submit = async (e) => {
    e.preventDefault();
    if (question && !(await confirm({ body: question, variant: "danger", confirm_label: "Reject" }))) return;
    setBusy(true);
    try {
      const r = await api.post(`${path}/do_reject`, { rejection_reason: reason });
      notify.success(r.message);
      navigate(done_to);
    } catch (err) {
      notify.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Page title={data ? title(data) : "Reject"} breadcrumbs={crumbs}>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <Card>
          <Card.Header>
            <Card.Title as="h5">{title(data)}</Card.Title>
            <span className="d-block text-muted mt-1">{subtitle(data)}</span>
          </Card.Header>
          <Card.Body>
            {intro && <p>{intro}</p>}
            <Form onSubmit={submit}>
              <Form.Group className="mb-3" controlId="rejection_reason">
                <Form.Label>Rejection Reason *</Form.Label>
                <Form.Control as="textarea" rows={5} required value={reason} placeholder={placeholder} onChange={(e) => setReason(e.target.value)} />
                {hint && <Form.Text muted>{hint}</Form.Text>}
              </Form.Group>
              <Button type="submit" variant="danger" disabled={busy || !reason.trim()}>
                {submit_label}
              </Button>
              <Button variant="default" onClick={() => navigate(cancel_to)}>
                Cancel
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Page>
  );
}
