import { Link } from "react-router-dom";
import { ActionButton, AttributesTable, Badge, BUSINESS_TONE, Column, Columns, Panel } from "../components/ui";
import { capitalize, fmt_datetime } from "../utils/format";

// app/admin/users.rb — lists soft-deleted users too; DELETE is a soft delete
const ACCOUNT_TONE = { Active: "green", Inactive: "amber", Deleted: "red" };

// Rails: restore redirects to the list, (de)activate to the user's page
const restore = (u, run) =>
  run("put", `/users/${u.id}/restore`, { confirm: `Restore account for ${u.name}?`, confirm_label: "Restore", variant: "success", redirect: "/users" });
const deactivate = (u, run, redirect) =>
  run("put", `/users/${u.id}/deactivate`, {
    confirm: `Deactivate ${u.name}? They will not be able to login.`,
    confirm_label: "Deactivate",
    variant: "warning",
    redirect,
  });
const activate = (u, run, redirect) =>
  run("put", `/users/${u.id}/activate`, { confirm: `Activate ${u.name}?`, confirm_label: "Activate", variant: "success", redirect });

const cfg = {
  path: "users",
  label: "Users",
  singular: "User",
  model: "User",
  param_key: "user",
  // no "Create User": password is not a permitted param, so the API can never create one
  actions: ["index", "show", "update", "destroy"],
  delete_label: "Soft Delete",
  filters: [
    { key: "name", type: "string" },
    { key: "phone_number", type: "string" },
    { key: "email", type: "string" },
    { key: "account_type", type: "select", options: ["user", "business"] },
    { key: "is_active", type: "boolean", label: "Active" },
    { key: "created_at", type: "date" },
    { key: "deleted_at", type: "date" },
  ],
  batch_actions: [
    {
      name: "destroy",
      label: "Soft Delete Selected",
      confirm: "Selected users will be soft deleted and can be restored later.",
      variant: "danger",
      confirm_label: "Soft delete",
    },
  ],
  columns: [
    "name",
    "phone_number",
    "email",
    {
      key: "account_type",
      title: "Type",
      render: (u) => <Badge tone={u.account_type === "business" ? "purple" : "blue"}>{capitalize(u.account_type)}</Badge>,
    },
    {
      key: "business_status",
      title: "Business Status",
      sort: false,
      render: (u) => (u.business_status ? <Badge tone={BUSINESS_TONE[u.business_status]}>{capitalize(u.business_status)}</Badge> : "-"),
    },
    {
      key: "account_status",
      title: "Account Status",
      sort: false,
      render: (u) => <Badge tone={ACCOUNT_TONE[u.account_status]}>{u.account_status}</Badge>,
    },
    { key: "created_at", title: "Joined On" },
  ],
  row_actions: (u, { run }) => [
    u.deleted_at && { key: "restore", label: "♻️ Restore", variant: "success", onClick: () => restore(u, run) },
    !u.deleted_at && u.is_active && { key: "deactivate", label: "🔴 Deactivate", variant: "warning", onClick: () => deactivate(u, run, `/users/${u.id}`) },
    !u.deleted_at && !u.is_active && { key: "activate", label: "🟢 Activate", variant: "success", onClick: () => activate(u, run, `/users/${u.id}`) },
  ],
  show: (u, { run }) => (
    <>
      {u.deleted_at ? (
        <Panel title="Account Deleted" icon="trash-2">
          <div className="status-strip">
            <Badge tone="red" big>
              DELETED on {fmt_datetime(u.deleted_at)}
            </Badge>
            <ActionButton variant="success" icon="rotate-ccw" onClick={() => restore(u, run)}>
              Restore This Account
            </ActionButton>
          </div>
        </Panel>
      ) : (
        <Panel title="Account Access" icon="shield">
          <div className="status-strip">
            {u.is_active ? (
              <>
                <span className="fw-bold text-success">🟢 ACTIVE — User can login normally.</span>
                <ActionButton variant="warning" icon="slash" onClick={() => deactivate(u, run)}>
                  Deactivate Account
                </ActionButton>
              </>
            ) : (
              <>
                <span className="fw-bold text-warning">🔴 INACTIVE — User is blocked from the platform.</span>
                <ActionButton variant="success" icon="check-circle" onClick={() => activate(u, run)}>
                  Activate Account
                </ActionButton>
              </>
            )}
          </div>
        </Panel>
      )}
      <Columns>
        <Column>
          <Panel title="Primary Details" icon="user">
            <AttributesTable
              md={6}
              rows={[
                ["Name", u.name],
                ["Phone number", u.phone_number],
                ["Email", u.email],
                ["Account type", capitalize(u.account_type)],
                ["Account status", u.is_active ? <span className="fw-bold text-success">Active</span> : <span className="fw-bold text-warning">Inactive</span>],
                ["Joined on", fmt_datetime(u.created_at)],
                u.deleted_at && ["Deleted on", fmt_datetime(u.deleted_at)],
              ]}
            />
          </Panel>
        </Column>
        <Column>
          {u.account_type === "business" && u.business && (
            <Panel title="Business" icon="briefcase">
              <AttributesTable
                md={6}
                rows={[
                  ["Name", u.business.name],
                  ["Category", u.business.category],
                  ["Status", <Badge tone={BUSINESS_TONE[u.business.status]}>{capitalize(u.business.status)}</Badge>],
                ]}
              />
              <Link className="d-inline-block mt-3 fw-semibold" to={`/businesses/${u.business.id}`}>
                Open Business <span className="feather icon-arrow-right" />
              </Link>
            </Panel>
          )}
        </Column>
      </Columns>
    </>
  ),
  form: [
    {
      title: "User Details",
      fields: [
        { key: "name" },
        { key: "phone_number" },
        { key: "email", as: "email" },
        {
          key: "account_type",
          as: "select",
          options: [
            ["User", "user"],
            ["Business", "business"],
          ],
        },
        { key: "is_active", as: "boolean", label: "Account Active", hint: "Turn off to prevent this user from logging in (fraud prevention)" },
      ],
    },
  ],
};

export default cfg;
