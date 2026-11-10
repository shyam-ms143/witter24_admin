import { Link } from "react-router-dom";
import { ActionButton, AttributesTable, Badge, Panel, REQUEST_TONE, StatusTag } from "../components/ui";
import { capitalize, fmt_datetime } from "../utils/format";
import { UpgradeRequestReject } from "../pages/RejectPages";

// app/admin/business_upgrade_requests.rb — list + view + approve/reject
const Status = ({ value }) => <Badge tone={REQUEST_TONE[value]}>{capitalize(value)}</Badge>;

const approve = (r, run, question) =>
  run("put", `/business_upgrade_requests/${r.id}/approve`, {
    confirm: question,
    confirm_label: "Approve",
    variant: "success",
    redirect: "/business_upgrade_requests",
  });

const cfg = {
  path: "business_upgrade_requests",
  label: "Upgrade Requests",
  singular: "Upgrade Request",
  model: "BusinessUpgradeRequest",
  actions: ["index", "show"],
  batch_actions: [],
  filters: [
    { key: "request_status", type: "select", options: ["pending", "approved", "rejected"] },
    { key: "requested_at", type: "date" },
    { key: "approved_by", type: "string" },
    { key: "approved_at", type: "date" },
    { key: "rejected_by", type: "string" },
    { key: "rejected_at", type: "date" },
    { key: "created_at", type: "date" },
  ],
  title: (r) => (r.user?.name ? `Upgrade Request — ${r.user.name}` : "Upgrade Request"),
  columns: [
    {
      key: "user",
      title: "User",
      sort: false,
      render: (r) => (r.user ? <Link to={`/users/${r.user.id}`}>{`${r.user.name} (${r.user.phone_number})`}</Link> : "Unknown"),
    },
    { key: "account_type", title: "Account Type", sort: false, render: (r) => r.user?.account_type || "—" },
    { key: "request_status", title: "Status", render: (r) => <Status value={r.request_status} /> },
    { key: "requested_at", title: "Requested On" },
    { key: "reviewed_by", title: "Reviewed By", sort: false },
    { key: "reviewed_at", title: "Reviewed On", sort: false, render: (r) => fmt_datetime(r.reviewed_at) },
  ],
  row_actions: (r, { run }) =>
    r.request_status === "pending"
      ? [
          {
            key: "approve",
            label: "Approve",
            variant: "success",
            onClick: () =>
              approve(
                r,
                run,
                "Approve this upgrade request? The user will be immediately converted to a business account and their current session will be invalidated."
              ),
          },
          { key: "reject", label: "Reject", variant: "danger", to: `/business_upgrade_requests/${r.id}/reject` },
        ]
      : [],
  show_actions: (r, { run }) =>
    r.request_status === "pending" && (
      <>
        <ActionButton variant="success" icon="check" onClick={() => approve(r, run, "Approve this upgrade request?")}>
          Approve Request
        </ActionButton>
        <ActionButton variant="danger" icon="x" to={`/business_upgrade_requests/${r.id}/reject`}>
          Reject Request
        </ActionButton>
      </>
    ),
  show: (r) => (
    <>
      <Panel title="Request Details" icon="file-text">
        <AttributesTable
          rows={[
            ["Status", <Status value={r.request_status} />],
            ["Requested on", fmt_datetime(r.requested_at)],
            r.request_status === "approved" && ["Approved by", r.approved_by],
            r.request_status === "approved" && ["Approved on", fmt_datetime(r.approved_at)],
            r.request_status === "rejected" && ["Rejected by", r.rejected_by],
            r.request_status === "rejected" && ["Rejected on", fmt_datetime(r.rejected_at)],
            ["Created on", fmt_datetime(r.created_at)],
            ["Updated on", fmt_datetime(r.updated_at)],
          ]}
        />
        {r.request_status === "rejected" && (
          <div className="rejection-box">
            <strong>Rejection Reason:</strong>
            {r.rejection_reason}
          </div>
        )}
      </Panel>
      <Panel title="User Details" icon="user">
        {r.user ? (
          <>
            <AttributesTable
              rows={[
                ["Name", r.user.name],
                ["Email", r.user.email],
                ["Phone number", r.user.phone_number],
                ["Account type", r.user.account_type],
                ["Active", <StatusTag value={r.user.is_active} />],
                ["Joined on", fmt_datetime(r.user.created_at)],
              ]}
            />
            <Link className="d-inline-block mt-3 fw-semibold" to={`/users/${r.user.id}`}>
              View User <span className="feather icon-arrow-right" />
            </Link>
          </>
        ) : (
          <p className="text-muted mb-0">User not found.</p>
        )}
      </Panel>
    </>
  ),
  routes: [{ path: "business_upgrade_requests/:id/reject", element: <UpgradeRequestReject /> }],
};

export default cfg;
