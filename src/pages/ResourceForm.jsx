import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { notify } from "../ui-context";
import Page from "../components/Page";
import { ErrorBox, Loading } from "../components/ui";
import { humanize, short_id, to_local_input } from "../utils/format";
import { breadcrumbs_for } from "../resources/helpers";

// cfg.form: [{ title, fields: [field] }]
// field: { key, label?, as: string|text|number|select|boolean|datetime|email|password|csv|number_list|links,
//          options?, hint?, placeholder?, omit_blank?, rows?, mono?, default?, name_key? }
//   csv          array shown as "a, b" and sent as that string (the API splits it)
//   number_list  array shown as "1, 2" and sent as [1, 2]
//   links        array of { [name_key]: "", url: "" } edited as rows and sent as that array (name_key defaults to "name")
const fields_of = (form) => form.flatMap((s) => s.fields);

const initial_value = (f, data) => {
  const v = data?.[f.key];
  switch (f.as) {
    case "boolean":
      return data ? Boolean(v) : f.default ?? false;
    case "datetime":
      return to_local_input(v);
    case "password":
      return "";
    case "csv":
    case "number_list":
      return Array.isArray(v) ? v.join(", ") : v ?? "";
    case "links": {
      const name_key = f.name_key || "name";
      return Array.isArray(v) ? v.map((l) => ({ [name_key]: l?.[name_key] ?? "", url: l?.url ?? "" })) : [];
    }
    default:
      return v === null || v === undefined ? f.default ?? "" : String(v);
  }
};

const param_value = (f, v) => {
  switch (f.as) {
    case "boolean":
      return Boolean(v);
    case "number":
      return v === "" ? "" : Number(v);
    case "datetime":
      return v ? new Date(v).toISOString() : "";
    case "number_list":
      return String(v)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
    case "links": {
      const name_key = f.name_key || "name";
      // drop rows left completely blank; an untouched form sends the record's existing links back unchanged
      return (v || []).filter((l) => String(l[name_key] ?? "").trim() || String(l.url ?? "").trim());
    }
    default:
      return v;
  }
};

export default function ResourceForm({ cfg }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState([]);
  const [load_error, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = (data) => setValues(Object.fromEntries(fields_of(cfg.form).map((f) => [f.key, initial_value(f, data)])));
    if (editing) {
      api
        .get(`/${cfg.path}/${id}`)
        .then((r) => init(r.data))
        .catch((e) => setLoadError(e.message));
    } else if (cfg.check_new) {
      // e.g. GET /reach_distance_settings/new refuses when the singleton already exists
      api
        .get(`/${cfg.path}/new`)
        .then(() => init(null))
        .catch((e) => {
          notify.error(e.message);
          navigate(`/${cfg.path}`, { replace: true });
        });
    } else {
      init(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, id, editing]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    const attrs = {};
    fields_of(cfg.form).forEach((f) => {
      if (f.omit_blank && values[f.key] === "") return;
      attrs[f.key] = param_value(f, values[f.key]);
    });
    try {
      const body = { [cfg.param_key]: attrs };
      const r = editing ? await api.put(`/${cfg.path}/${id}`, body) : await api.post(`/${cfg.path}`, body);
      notify.success(`${cfg.singular} ${editing ? "updated" : "created"} successfully!`);
      navigate(`/${cfg.path}/${r.data?.id || id}`);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else notify.error(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const set = (key, v) => setValues((s) => ({ ...s, [key]: v }));
  const title = editing ? `Edit ${cfg.singular}` : `Create ${cfg.singular}`;
  const crumbs = editing
    ? breadcrumbs_for(cfg, [{ label: short_id(id), to: `/${cfg.path}/${id}` }, { label: "Edit" }])
    : breadcrumbs_for(cfg, [{ label: "New" }]);

  return (
    <Page title={title} breadcrumbs={crumbs}>
      {load_error && <ErrorBox>{load_error}</ErrorBox>}
      {!values && !load_error && <Loading />}
      {values && (
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
          {cfg.form.map((section, i) => (
            <Card key={section.title || i}>
              <Card.Header>
                <Card.Title as="h5">{i === 0 ? title : section.title}</Card.Title>
              </Card.Header>
              <Card.Body>
                {i === 0 && section.title && cfg.form.length > 1 && <h6 className="text-muted mb-3">{section.title}</h6>}
                <Row>
                  {section.fields.map((f) => (
                    <Field key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
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

function Field({ field: f, value, onChange }) {
  const id = `field_${f.key}`;
  const label = f.label || humanize(f.key);
  const wide = f.as === "text" || f.as === "links";

  if (f.as === "boolean") {
    return (
      <Col md={6}>
        <Form.Group className="mb-3" controlId={id}>
          <Form.Check type="switch" label={label} checked={value} onChange={(e) => onChange(e.target.checked)} />
          {f.hint && <Form.Text muted>{f.hint}</Form.Text>}
        </Form.Group>
      </Col>
    );
  }

  let control;
  if (f.as === "links") {
    const name_key = f.name_key || "name";
    const rows = value || [];
    const update = (i, k, v) => onChange(rows.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
    control = (
      <div>
        {rows.length === 0 && <p className="text-muted mb-2">No links added.</p>}
        {rows.map((l, i) => (
          <Row key={i} className="g-2 mb-2">
            <Col md={4}>
              <Form.Control id={`${id}_${i}_name`} value={l[name_key]} placeholder="Name" onChange={(e) => update(i, name_key, e.target.value)} />
            </Col>
            <Col md={6}>
              <Form.Control id={`${id}_${i}_url`} value={l.url} placeholder="https://..." onChange={(e) => update(i, "url", e.target.value)} />
            </Col>
            <Col md={2}>
              <Button variant="outline-danger" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <span className="feather icon-trash-2" /> Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Button variant="outline-primary" size="sm" onClick={() => onChange([...rows, { [name_key]: "", url: "" }])}>
          <span className="feather icon-plus me-1" /> Add Link
        </Button>
      </div>
    );
  } else if (f.as === "text") {
    control = (
      <Form.Control
        as="textarea"
        rows={f.rows || 5}
        value={value}
        placeholder={f.placeholder || `Enter ${label}`}
        style={f.mono ? { fontFamily: "SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13 } : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (f.as === "select") {
    const options = f.options.map((o) => (Array.isArray(o) ? o : [o, o]));
    control = (
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {label}</option>
        {options.map(([l, v]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Form.Select>
    );
  } else {
    const type = { number: "number", datetime: "datetime-local", email: "email", password: "password" }[f.as] || "text";
    control = (
      <Form.Control
        type={type}
        step={f.as === "number" ? "any" : undefined}
        value={value}
        placeholder={f.placeholder || (f.as === "datetime" ? undefined : `Enter ${label}`)}
        autoComplete={f.as === "password" ? "new-password" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Col md={wide ? 12 : 6}>
      <Form.Group className="mb-3" controlId={id}>
        <Form.Label>{label}</Form.Label>
        {control}
        {f.hint && <Form.Text muted>{f.hint}</Form.Text>}
      </Form.Group>
    </Col>
  );
}
