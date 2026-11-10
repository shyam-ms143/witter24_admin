import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { notify } from "../ui-context";
import Page from "../components/Page";
import { ErrorBox, Loading } from "../components/ui";
import { short_id } from "../utils/format";
import { breadcrumbs_for } from "../resources/helpers";

// SubscriptionPlan::FEATURES / DISAPPEARABLE_FEATURES / FEATURE_LABELS
export const FEATURES = [
  "global_feed",
  "local_feed",
  "job_posts",
  "offers",
  "post_radius",
  "domain_page",
  "post_anywhere",
  "global_search",
  "domain_uploads",
];
export const DISAPPEARABLE = ["global_feed", "local_feed", "job_posts", "offers"];
export const FEATURE_LABELS = {
  global_feed: "Global Feed",
  local_feed: "Local Feed",
  job_posts: "Job Posts",
  offers: "Offers",
  post_radius: "Post by Radius",
  domain_page: "Domain Page",
  post_anywhere: "Post from Any Location",
  global_search: "Global Search Visibility",
  domain_uploads: "Domain Uploads",
};

const GUIDE = [
  ["Global Feed", "Business can publish posts visible across the entire platform, regardless of location. Use Post Limit to cap how many global posts they can create per subscription period. Use Range to restrict how far (in km) those posts are discoverable."],
  ["Local Feed", "Business can publish posts visible only to users within their local area (defined by the business location + reach distance). Use Post Limit to cap how many local posts they can create. Use Range to set the maximum radius (km) those posts travel."],
  ["Job Posts", "Business can post job listings. Use Post Limit to cap the number of active job listings allowed at once. Use Range to restrict how far (in km) job listings are discoverable to job seekers."],
  ["Offers", "Business can post promotional offers or deals. Use Post Limit to cap how many active offers they can run at a time. Use Range to restrict offer visibility to users within a given km radius."],
  ["Post by Radius", "Controls how far a post is discoverable from the business's location. The Range value (km) is the maximum radius within which other users can see that post. Example: Range = 10 km means only users within 10 km of the business will see the post. Leave Range blank for unlimited reach."],
  ["Domain Page", "The business gets a dedicated public profile / storefront page on the platform. This is an on/off access flag — Post Limit and Range are not applicable; leave them blank."],
  ["Post from Any Location", "By default a post gets the registered business location. With this feature the business can pick any custom location on the map when posting. On/off flag; no Limit or Range needed."],
  ["Global Search Visibility", "When enabled, this business's profile and posts appear in platform-wide search results for all users, not just those in their local area. On/off flag; no Limit or Range needed."],
  ["Domain Uploads", "The number of images / media files the business may upload to their Domain Page. Use Post Limit for the maximum number of images (e.g. 10). Leave blank for unlimited uploads. Range is not applicable."],
];

const present = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const sub_state = (obj, key) => ({ on: present(obj?.[key]), value: present(obj?.[key]) ? String(obj[key]) : "" });

const from_plan = (p) => ({
  plan_type: p?.plan_type ?? "",
  amounts: p?.amounts ?? "",
  position: p?.position ?? "",
  is_active: p ? Boolean(p.is_active) : true,
  features: new Set(p?.features || []),
  limits: Object.fromEntries(FEATURES.map((k) => [k, sub_state(p?.limits, k)])),
  ranges: Object.fromEntries(FEATURES.map((k) => [k, sub_state(p?.ranges, k)])),
  disappear_days: Object.fromEntries(DISAPPEARABLE.map((k) => [k, sub_state(p?.disappear_days, k)])),
});

export default function SubscriptionPlanForm({ cfg }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(editing ? null : from_plan(null));
  const [errors, setErrors] = useState([]);
  const [load_error, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/subscription_plans/${id}`)
      .then((r) => setForm(from_plan(r.data)))
      .catch((e) => setLoadError(e.message));
  }, [editing, id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggle_feature = (key, on) =>
    setForm((f) => {
      const features = new Set(f.features);
      if (on) features.add(key);
      else features.delete(key);
      // disabling a feature clears its sub-fields (as the Rails form's JS did)
      const clear = (group) => (on || !f[group][key] ? f[group] : { ...f[group], [key]: { on: false, value: "" } });
      return { ...f, features, limits: clear("limits"), ranges: clear("ranges"), disappear_days: clear("disappear_days") };
    });

  const set_sub = (group, key, patch) =>
    setForm((f) => {
      const next = { ...f[group][key], ...patch };
      if (patch.on === false) next.value = "";
      return { ...f, [group]: { ...f[group], [key]: next } };
    });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    // blank values are stripped server-side (nil = unlimited / never)
    const values = (group, keys) =>
      Object.fromEntries(keys.map((k) => [k, form.features.has(k) && form[group][k].on ? form[group][k].value.trim() : ""]));
    const body = {
      subscription_plan: {
        plan_type: form.plan_type,
        amounts: form.amounts,
        position: form.position === "" ? "" : Number(form.position),
        is_active: form.is_active,
        features: FEATURES.filter((k) => form.features.has(k)),
        limits: values("limits", FEATURES),
        ranges: values("ranges", FEATURES),
        disappear_days: values("disappear_days", DISAPPEARABLE),
      },
    };
    try {
      const r = editing ? await api.put(`/subscription_plans/${id}`, body) : await api.post("/subscription_plans", body);
      notify.success(`Subscription plan ${editing ? "updated" : "created"} successfully!`);
      navigate(`/subscription_plans/${r.data?.id || id}`);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else notify.error(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // a render helper, not a component: a component defined here would remount (and lose focus) on every keystroke
  const sub_field = (group, k, label, unit) => {
    const enabled = form.features.has(k);
    const s = form[group][k];
    return (
      <div className={`sub-field${enabled ? "" : " disabled"}`}>
        <Form.Check
          id={`${group}-${k}`}
          className="small"
          label={label}
          disabled={!enabled}
          checked={s.on}
          onChange={(e) => set_sub(group, k, { on: e.target.checked })}
        />
        {s.on && (
          <div className="sub-input">
            <Form.Control
              size="sm"
              type="number"
              min="0"
              value={s.value}
              aria-label={`${FEATURE_LABELS[k]} ${label}`}
              onChange={(e) => set_sub(group, k, { value: e.target.value })}
            />
            <span className="text-muted small">{unit}</span>
          </div>
        )}
      </div>
    );
  };

  const title = editing ? "Edit Subscription Plan" : "Create Subscription Plan";
  const crumbs = editing
    ? breadcrumbs_for(cfg, [{ label: short_id(id), to: `/subscription_plans/${id}` }, { label: "Edit" }])
    : breadcrumbs_for(cfg, [{ label: "New" }]);

  return (
    <Page title={title} breadcrumbs={crumbs}>
      {load_error && <ErrorBox>{load_error}</ErrorBox>}
      {!form && !load_error && <Loading />}
      {form && (
        <Form noValidate onSubmit={submit}>
          {errors.length > 0 && (
            <Alert variant="danger">
              <ul className="mb-0 ps-3">
                {errors.map((er) => (
                  <li key={er}>{er}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Card>
            <Card.Header>
              <Card.Title as="h5">{title}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="plan_type">
                    <Form.Label>Plan Type</Form.Label>
                    <Form.Control placeholder="Enter Plan Type" value={form.plan_type} onChange={(e) => set({ plan_type: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="amounts">
                    <Form.Label>Amounts</Form.Label>
                    <Form.Control placeholder="e.g. 20 per day" value={form.amounts} onChange={(e) => set({ amounts: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="position">
                    <Form.Label>Position</Form.Label>
                    <Form.Control type="number" value={form.position} onChange={(e) => set({ position: e.target.value })} />
                    <Form.Text muted>Lower number = shown first (0, 1, 2 ...)</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-center">
                  <Form.Check type="switch" id="is_active" label="Active" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title as="h5">
                <span className="feather icon-sliders me-1" /> Features, Limits &amp; Ranges
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Enable features using the checkbox. Optionally set a Post Limit or Range (km) — toggle each with its own checkbox. Leave toggles
                off for no restriction (unlimited).
              </p>
              <details className="feature-guide">
                <summary>
                  <span className="feather icon-info me-1" /> Feature Guide — click to expand
                </summary>
                {GUIDE.map(([name, text]) => (
                  <div key={name} className="feature-guide-row">
                    <strong>{name}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </details>
              <Table striped hover responsive className="feature-table admin-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Enable</th>
                    <th>Post Limit</th>
                    <th>Range (km)</th>
                    <th>Disappear in Days</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((k) => (
                    <tr key={k}>
                      <td className="fw-semibold">{FEATURE_LABELS[k]}</td>
                      <td>
                        <Form.Check
                          type="switch"
                          id={`feature-${k}`}
                          aria-label={`Enable ${FEATURE_LABELS[k]}`}
                          checked={form.features.has(k)}
                          onChange={(e) => toggle_feature(k, e.target.checked)}
                        />
                      </td>
                      <td>{sub_field("limits", k, "Set Limit", "posts")}</td>
                      <td>{sub_field("ranges", k, "Set Range", "km")}</td>
                      <td>{DISAPPEARABLE.includes(k) ? sub_field("disappear_days", k, "Set Days", "days") : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="mb-4">
            <Button className="btn-gradient" type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
            <Button variant="default" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </Page>
  );
}
