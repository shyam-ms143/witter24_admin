import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useRunner } from "../ui-context";
import Page from "../components/Page";
import { ErrorBox, Loading } from "../components/ui";
import { capitalize, fmt_day, fmt_day_time, titleize } from "../utils/format";

// GET /dashboard — the Rails admin dashboard, laid out like hah-admin's (KPI strip + glass cards)
function KPI({ title, value, sub, color, link }) {
  return (
    <div className="kpi-card">
      <span>{title}</span>
      <h3 style={color ? { color } : undefined}>{value ?? 0}</h3>
      {sub && <small>{sub}</small>}
      {link && (
        <Link className="kpi-link" to={link.to}>
          {link.label} <span className="feather icon-arrow-right" />
        </Link>
      )}
    </div>
  );
}

function GlassTable({ title, rows, empty, columns, action }) {
  return (
    <Card className="glass">
      <Card.Body>
        <div className="card-head d-flex justify-content-between align-items-center">
          <h5>{title}</h5>
          {action}
        </div>
        {rows?.length ? (
          <div className="table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.title}>{c.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    {columns.map((c) => (
                      <td key={c.title}>{c.render(r)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0">{empty}</p>
        )}
      </Card.Body>
    </Card>
  );
}

// validity: no_expiry | expired | active
export function Validity({ offer, prefix = false }) {
  if (offer.validity === "no_expiry" || !offer.valid_till) return <span className="text-muted small">No expiry</span>;
  if (offer.validity === "expired")
    return <span className="text-danger small fw-bold">{prefix ? `Expired ${fmt_day(offer.valid_till)}` : "Expired"}</span>;
  return <span className="text-success small fw-bold">{prefix ? `Until ${fmt_day(offer.valid_till)}` : fmt_day(offer.valid_till)}</span>;
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setD(await api.get("/dashboard"));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = useRunner(load);
  const s = d?.stats;

  return (
    <Page title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="dash-root">
        <div className="dash-header">
          <h2>Welcome, {admin?.email?.split("@")[0]}</h2>
          <span className="sub">Dashboard overview</span>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        {!d && !error && <Loading />}
        {d && (
          <>
            <div className="kpi-grid">
              <KPI
                title="Pending Approval"
                value={s.pending_approval}
                color="#d97706"
                sub="Businesses waiting review"
                link={{ to: "/businesses?scope=pending_review", label: "Review now" }}
              />
              <KPI title="Approved Businesses" value={s.approved_businesses} color="#16a34a" sub="Live on the platform" />
              <KPI title="Total Users" value={s.total_users.total} sub={`${s.total_users.regular} regular · ${s.total_users.business} business`} />
              <KPI title="Draft (Incomplete)" value={s.draft_businesses} color="#6b7280" sub="Onboarding not complete" />
              <KPI title="Total Jobs" value={s.jobs.total} sub={`${s.jobs.local} local · ${s.jobs.global} global`} link={{ to: "/jobs", label: "View all jobs" }} />
              <KPI title="Active Offers" value={s.offers.active} color="#059669" sub={`${s.offers.expired} expired`} link={{ to: "/offers", label: "View all offers" }} />
            </div>

            <div className="dash-grid">
              <Card className="glass">
                <Card.Body>
                  <h5>Jobs by Type</h5>
                  {Object.entries(s.jobs_by_type).map(([k, v]) => (
                    <div key={k} className="breakdown-row">
                      <span>{titleize(k)}</span>
                      <span className="pill">{v}</span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
              <Card className="glass">
                <Card.Body>
                  <h5>Offers by Type</h5>
                  {[
                    ["Local", s.offers_by_type.local],
                    ["Global", s.offers_by_type.global],
                    ["Total", s.offers_by_type.total],
                  ].map(([k, v]) => (
                    <div key={k} className="breakdown-row">
                      <span>{k}</span>
                      <span className="pill">{v}</span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </div>

            <div className="mb-4">
              <GlassTable
                title="Businesses Pending Approval"
                rows={d.pending_businesses}
                empty="🎉 No pending businesses. All caught up!"
                action={
                  <Link to="/businesses?scope=pending_review" className="small fw-semibold">
                    View all
                  </Link>
                }
                columns={[
                  { title: "Name", render: (b) => <Link to={`/businesses/${b.id}`}>{b.name || "(unnamed)"}</Link> },
                  { title: "Category", render: (b) => <span className="pill">{b.category || "-"}</span> },
                  { title: "Owner", render: (b) => b.owner || "-" },
                  { title: "Phone", render: (b) => b.phone || "-" },
                  { title: "City", render: (b) => b.city || "-" },
                  { title: "Submitted", render: (b) => fmt_day(b.submitted_at) },
                  {
                    title: "Action",
                    render: (b) => (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          run("put", `/businesses/${b.id}/approve`, { confirm: `Approve ${b.name}?`, confirm_label: "Approve", variant: "success", redirect: `/businesses/${b.id}` })
                        }
                      >
                        <span className="feather icon-check me-1" /> Approve
                      </Button>
                    ),
                  },
                ]}
              />
            </div>

            <div className="dash-grid">
              <GlassTable
                title="Recent Jobs"
                rows={d.recent_jobs}
                empty="No jobs posted yet."
                columns={[
                  { title: "Title", render: (j) => <Link to={`/jobs/${j.id}`}>{j.job_title}</Link> },
                  { title: "Type", render: (j) => <span className="pill">{titleize(j.job_type)}</span> },
                  { title: "Post", render: (j) => capitalize(j.post_type) },
                  { title: "Posted By", render: (j) => j.posted_by || "-" },
                  { title: "Salary", render: (j) => (j.salary ? `₹${Math.trunc(Number(j.salary)).toLocaleString("en-IN")}` : "—") },
                  { title: "Posted", render: (j) => fmt_day(j.created_at) },
                ]}
              />
              <GlassTable
                title="Recent Offers"
                rows={d.recent_offers}
                empty="No offers posted yet."
                columns={[
                  { title: "Title", render: (o) => <Link to={`/offers/${o.id}`}>{o.title}</Link> },
                  { title: "Type", render: (o) => <span className="pill">{capitalize(o.offer_type)}</span> },
                  { title: "Posted By", render: (o) => o.posted_by || "-" },
                  { title: "Valid Till", render: (o) => <Validity offer={o} /> },
                ]}
              />
            </div>

            <GlassTable
              title="Recently Approved"
              rows={d.recently_approved}
              empty="No approved businesses yet."
              columns={[
                { title: "Name", render: (b) => <Link to={`/businesses/${b.id}`}>{b.name}</Link> },
                { title: "Category", render: (b) => <span className="pill">{b.category || "-"}</span> },
                { title: "Owner", render: (b) => b.owner || "-" },
                { title: "Approved", render: (b) => fmt_day_time(b.approved_at) },
              ]}
            />
          </>
        )}
      </div>
    </Page>
  );
}
