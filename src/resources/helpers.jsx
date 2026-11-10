import { Link } from "react-router-dom";
import { AttributesTable, Panel, TableFor, display } from "../components/ui";
import { fmt_datetime } from "../utils/format";

export const can = (cfg, action) => (cfg.actions || []).includes(action);

export const breadcrumbs_for = (cfg, extra = []) => [{ label: cfg.label, to: `/${cfg.path}` }, ...extra];

// name / title / email ... or "Business #a1b2c3"
export const display_name = (cfg, r) =>
  (cfg.title && cfg.title(r)) || r.name || r.title || r.job_title || r.email || r.plan_type || `${cfg.singular} #${String(r.id).slice(-6)}`;

export const date_col = (key, title) => ({ key, title, render: (r) => fmt_datetime(r[key]) });

// detail grid with every field of a record (for resources without a custom view)
export const all_rows = (data, omit = []) =>
  Object.keys(data)
    .filter((k) => !["active_admin_comments", ...omit].includes(k))
    .sort((a, b) => (a === "id" ? -1 : b === "id" ? 1 : 0))
    .map((k) => [k === "id" ? "ID" : k.replace(/_/g, " "), display(data[k])]);

export function UserPanel({ user, title = "Posted By" }) {
  return (
    <Panel title={title} icon="user">
      {user ? (
        <>
          <AttributesTable
            md={6}
            rows={[
              ["Name", user.name],
              ["Phone number", user.phone_number],
              ["Email", user.email],
              ["Account type", user.account_type],
            ]}
          />
          <Link className="d-inline-block mt-3 fw-semibold" to={`/users/${user.id}`}>
            View User <span className="feather icon-arrow-right" />
          </Link>
        </>
      ) : (
        <p className="text-muted mb-0">No user linked.</p>
      )}
    </Panel>
  );
}

export function LinksPanel({ links }) {
  return (
    <Panel title="Links" icon="link">
      <TableFor
        rows={Array.isArray(links) ? links : []}
        empty="No links added."
        columns={[
          { title: "Button Name", render: (l) => l.button_name || l.name },
          {
            title: "URL",
            render: (l) => (
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.url}
              </a>
            ),
          },
        ]}
      />
    </Panel>
  );
}
