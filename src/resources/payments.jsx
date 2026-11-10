import { Link } from "react-router-dom";
import { AttributesTable, Badge, Column, Columns, PAYMENT_TONE, Panel, TableFor } from "../components/ui";
import { capitalize, fmt_day_time, fmt_datetime, rupees } from "../utils/format";

// app/admin/payments.rb — only `status` is editable
const STATUSES = ["pending", "paid", "failed", "expired"];

const not_assigned = <span className="text-muted">Not yet assigned</span>;

const cfg = {
  path: "payments",
  label: "Payments",
  singular: "Payment",
  model: "Payment",
  param_key: "payment",
  // no "Create Payment": payments come from the checkout flow (only status is a permitted param)
  actions: ["index", "show", "update", "destroy"],
  filters: [
    { key: "status", type: "select", options: STATUSES },
    { key: "user_id", type: "id", label: "User ID" },
    { key: "subscription_plan_id", type: "id", label: "Subscription Plan ID" },
    { key: "razorpay_order_id", type: "string" },
    { key: "razorpay_payment_id", type: "string" },
    { key: "amount", type: "number", label: "Amount (paise)" },
    { key: "paid_at", type: "date" },
    { key: "created_at", type: "date" },
  ],
  columns: [
    { key: "user", title: "User", sort: false, render: (p) => (p.user ? <Link to={`/users/${p.user.id}`}>{p.user.name}</Link> : "—") },
    { key: "phone", title: "Phone", sort: false, render: (p) => p.user?.phone_number || "—" },
    { key: "plan_type", title: "Plan", sort: false, render: (p) => <span className="fw-bold text-primary small">{String(p.plan_type || "").toUpperCase()}</span> },
    { key: "amount", title: "Amount", render: (p) => <strong>{rupees(p.amount_in_rupees)}</strong> },
    { key: "status", title: "Status", render: (p) => <Badge tone={PAYMENT_TONE[p.status]}>{capitalize(p.status)}</Badge> },
    { key: "razorpay_order_id", title: "Razorpay Order ID", render: (p) => <code className="small">{p.razorpay_order_id || "—"}</code> },
    { key: "paid_at", title: "Paid On", render: (p) => (p.paid_at ? fmt_day_time(p.paid_at) : "—") },
    { key: "created_at", title: "Created On", render: (p) => fmt_day_time(p.created_at) },
  ],
  // "Payment Summary" (a sidebar in the Rails admin) as a KPI strip above the table
  sidebar: (res) => {
    const s = res.summary;
    if (!s) return null;
    return (
      <div className="kpi-grid mt-0">
        <div className="kpi-card">
          <span>Total Transactions</span>
          <h3>{s.total_transactions}</h3>
        </div>
        <div className="kpi-card">
          <span>✅ Paid</span>
          <h3 className="text-success">{s.paid}</h3>
        </div>
        <div className="kpi-card">
          <span>⏳ Pending</span>
          <h3 className="text-warning">{s.pending}</h3>
        </div>
        <div className="kpi-card">
          <span>❌ Failed</span>
          <h3 className="text-danger">{s.failed}</h3>
        </div>
        <div className="kpi-card">
          <span>⏱️ Expired</span>
          <h3 className="text-secondary">{s.expired}</h3>
        </div>
        <div className="kpi-card">
          <span>🎯 Subscriptions</span>
          <h3 className="text-info">{s.subscriptions}</h3>
        </div>
        <div className="kpi-card">
          <span>Total Revenue</span>
          <h3 className="text-success">{rupees(s.total_revenue)}</h3>
        </div>
      </div>
    );
  },
  show: (p) => {
    const u = p.user;
    const plan = p.subscription_plan;
    const sub = p.subscription;
    const has_response = p.razorpay_response && Object.keys(p.razorpay_response).length > 0;
    return (
      <>
        <Panel title="Payment Status" icon="credit-card">
          <div className="status-strip">
            <Badge tone={PAYMENT_TONE[p.status]} big>
              {String(p.status || "").toUpperCase()}
            </Badge>
            <span className="big-amount">{rupees(p.amount_in_rupees)}</span>
            {plan && <span className="badge bg-primary">{String(plan.plan_type).toUpperCase()}</span>}
          </div>
        </Panel>
        <Columns>
          <Column md={7}>
            <Panel title="Transaction Details" icon="file-text">
              <AttributesTable
                md={6}
                rows={[
                  ["Razorpay Order ID", p.razorpay_order_id ? <code>{p.razorpay_order_id}</code> : not_assigned],
                  ["Razorpay Payment ID", p.razorpay_payment_id ? <code>{p.razorpay_payment_id}</code> : not_assigned],
                  ["Amount (Paise)", p.amount],
                  ["Amount (Rupees)", rupees(p.amount_in_rupees)],
                  ["Currency", p.currency],
                  ["Status", capitalize(p.status)],
                  ["Expires at", p.expires_at ? fmt_datetime(p.expires_at) : "—"],
                  ["Paid at", p.paid_at ? fmt_datetime(p.paid_at) : "—"],
                  ["Transaction ID", p.transaction_id || "—"],
                  ["Failure reason", p.failure_reason || "—"],
                  ["Retry count", String(p.retry_count ?? 0)],
                  ["Last retry at", p.last_retry_at ? fmt_datetime(p.last_retry_at) : "—"],
                  ["Created on", fmt_datetime(p.created_at)],
                  ["Updated on", fmt_datetime(p.updated_at)],
                ]}
              />
            </Panel>
          </Column>
          <Column md={5}>
            <Panel title="User" icon="user">
              {u ? (
                <AttributesTable
                  md={6}
                  rows={[
                    ["Name", <Link to={`/users/${u.id}`}>{u.name}</Link>],
                    ["Phone", u.phone_number],
                    ["Email", u.email || "—"],
                    ["Type", capitalize(u.account_type)],
                  ]}
                />
              ) : (
                <p className="text-muted mb-0">No user.</p>
              )}
            </Panel>
            <Panel title="Subscription Plan" icon="award">
              {plan ? (
                <AttributesTable
                  md={6}
                  rows={[
                    ["Plan", <Link to={`/subscription_plans/${plan.id}`}>{String(plan.plan_type).toUpperCase()}</Link>],
                    ["Price", `₹${plan.amounts}`],
                    ["Features", (plan.features || []).join(", ")],
                  ]}
                />
              ) : (
                <p className="text-muted mb-0">No plan.</p>
              )}
            </Panel>
            {sub && (
              <Panel title="Linked Subscription" icon="repeat">
                <AttributesTable
                  md={6}
                  rows={[
                    ["Status", capitalize(sub.status)],
                    ["Days left", String(sub.days_remaining ?? "—")],
                    ["Start date", fmt_datetime(sub.start_date)],
                    ["End date", fmt_datetime(sub.end_date)],
                  ]}
                />
              </Panel>
            )}
          </Column>
        </Columns>
        <Panel title={`Payment Events Audit Trail${p.payment_events?.length ? ` (${p.payment_events_count})` : ""}`} icon="list">
          <TableFor
            rows={p.payment_events}
            empty="No payment events recorded yet."
            columns={[
              { title: "Event Type", render: (e) => e.event_type },
              {
                title: "Status",
                render: (e) => <Badge tone={e.event_status === "success" ? "green" : "red"}>{capitalize(e.event_status)}</Badge>,
              },
              { title: "Message", render: (e) => e.message || "—" },
              { title: "Created At", render: (e) => fmt_day_time(e.created_at) },
            ]}
          />
        </Panel>
        <Panel title="Razorpay Response" icon="file-text">
          {has_response ? <pre className="json dark">{JSON.stringify(p.razorpay_response, null, 2)}</pre> : <p className="text-muted mb-0">No Razorpay response recorded.</p>}
        </Panel>
      </>
    );
  },
  form: [{ title: "Payment", fields: [{ key: "status", as: "select", options: STATUSES.map((s) => [capitalize(s), s]) }] }],
};

export default cfg;
