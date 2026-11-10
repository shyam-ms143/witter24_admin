import { AttributesTable, Badge, Panel, StatusTag, TableFor } from "../components/ui";
import { fmt_datetime } from "../utils/format";
import SubscriptionPlanForm from "../pages/SubscriptionPlanForm";

// app/admin/subscription_plans.rb
const set = (v) => v !== null && v !== undefined;

const cfg = {
  path: "subscription_plans",
  label: "Subscription Plans",
  singular: "Subscription Plan",
  model: "SubscriptionPlan",
  param_key: "subscription_plan",
  actions: ["index", "show", "create", "update", "destroy"],
  filters: [
    { key: "plan_type", type: "string" },
    { key: "is_active", type: "boolean", label: "Active" },
    { key: "created_at", type: "date" },
  ],
  title: (p) => String(p.plan_type || "").toUpperCase() || null,
  columns: [
    { key: "plan_type", title: "Plan Type" },
    "amounts",
    "position",
    { key: "is_active", title: "Status", render: (p) => (p.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>) },
    { key: "subscribers", title: "Subscribers", sort: false },
    { key: "updated_at", title: "Updated On" },
  ],
  show: (p) => (
    <>
      <Panel title="Plan Details" icon="award">
        <AttributesTable
          rows={[
            ["Plan type", p.plan_type],
            ["Amounts", p.amounts],
            ["Position", String(p.position ?? "")],
            ["Active", <StatusTag value={p.is_active} />],
            ["Subscribers", `${p.subscribers} user(s) on this plan`],
            ["Updated on", fmt_datetime(p.updated_at)],
          ]}
        />
      </Panel>
      <Panel title="Features, Limits & Ranges" icon="sliders">
        <TableFor
          rows={p.feature_table}
          columns={[
            { title: "Feature", render: (f) => <span className="fw-semibold">{f.label}</span> },
            { title: "Enabled", render: (f) => (f.enabled ? <Badge tone="green">Yes</Badge> : <span className="text-muted">—</span>) },
            { title: "Post Limit", render: (f) => (!f.enabled ? "—" : set(f.limit) ? `${f.limit} posts` : "Unlimited") },
            { title: "Range (km)", render: (f) => (!f.enabled ? "—" : set(f.range) ? `${f.range} km` : "Unlimited") },
          ]}
        />
      </Panel>
      <Panel title="Post Expiry (Disappear in Days)" icon="clock">
        <TableFor
          rows={p.disappear_table}
          columns={[
            { title: "Feature", render: (f) => <span className="fw-semibold">{f.label}</span> },
            { title: "Enabled", render: (f) => (f.enabled ? <Badge tone="green">Yes</Badge> : <span className="text-muted">—</span>) },
            { title: "Disappear in Days", render: (f) => (!f.enabled ? "—" : set(f.disappear_days) ? `${f.disappear_days} days` : "Never") },
          ]}
        />
      </Panel>
    </>
  ),
  FormPage: SubscriptionPlanForm,
};

export default cfg;
