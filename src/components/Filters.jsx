import { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { humanize } from "../utils/format";

// Filter row above the table. Values map to the API's Ransack-style params
// (?name_cont=, ?status_eq=, ?created_at_gteq= ...), see ADMIN_API.md.
const STRING_PREDICATES = [
  ["Contains", "cont"],
  ["Equals", "eq"],
  ["Starts with", "start"],
  ["Ends with", "end"],
];
const NUMBER_PREDICATES = [
  ["=", "eq"],
  [">", "gt"],
  ["<", "lt"],
];
const KEEP = ["scope", "order", "per_page"];

const predicates_for = (type) => (type === "number" ? NUMBER_PREDICATES : STRING_PREDICATES);
const options_of = (opts) => (opts || []).map((o) => (Array.isArray(o) ? o : [humanize(o), o]));

const read_values = (filters, sp) => {
  const v = {};
  filters.forEach((f) => {
    if (f.type === "string" || f.type === "number") {
      const preds = predicates_for(f.type);
      const found = preds.find(([, p]) => sp.has(`${f.key}_${p}`));
      v[f.key] = { pred: found ? found[1] : preds[0][1], value: found ? sp.get(`${f.key}_${found[1]}`) : "" };
    } else if (f.type === "date") {
      v[f.key] = { from: sp.get(`${f.key}_gteq`) || "", to: sp.get(`${f.key}_lteq`) || "" };
    } else {
      v[f.key] = sp.get(`${f.key}_eq`) || "";
    }
  });
  return v;
};

export const active_filter_count = (filters, sp) =>
  filters.filter((f) => [...sp.keys()].some((k) => k === f.key || k.startsWith(`${f.key}_`))).length;

export default function Filters({ filters, sp, setSp }) {
  const qs = sp.toString();
  const [values, setValues] = useState(() => read_values(filters, sp));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setValues(read_values(filters, sp)), [filters, qs]);

  const base_params = () => {
    const next = new URLSearchParams();
    KEEP.forEach((k) => sp.get(k) && next.set(k, sp.get(k)));
    return next;
  };

  const submit = (e) => {
    e.preventDefault();
    const next = base_params();
    filters.forEach((f) => {
      const v = values[f.key];
      if (f.type === "string" || f.type === "number") {
        if (v.value.trim() !== "") next.set(`${f.key}_${v.pred}`, v.value.trim());
      } else if (f.type === "date") {
        if (v.from) next.set(`${f.key}_gteq`, v.from);
        if (v.to) next.set(`${f.key}_lteq`, v.to);
      } else if (String(v).trim() !== "") {
        next.set(`${f.key}_eq`, String(v).trim());
      }
    });
    setSp(next);
  };

  const set = (key, value) => setValues((s) => ({ ...s, [key]: value }));

  return (
    <Form className="filters-panel" onSubmit={submit}>
      <Row>
        {filters.map((f) => {
          const label = f.label || humanize(f.key);
          const v = values[f.key];
          const id = `filter_${f.key}`;
          let control;
          if (f.type === "string" || f.type === "number") {
            control = (
              <InputGroup size="sm">
                <Form.Select
                  value={v.pred}
                  onChange={(e) => set(f.key, { ...v, pred: e.target.value })}
                  aria-label={`${label} match`}
                  style={{ maxWidth: f.type === "number" ? 60 : 118 }}
                >
                  {predicates_for(f.type).map(([l, p]) => (
                    <option key={p} value={p}>
                      {l}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  id={id}
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={label}
                  value={v.value}
                  onChange={(e) => set(f.key, { ...v, value: e.target.value })}
                />
              </InputGroup>
            );
          } else if (f.type === "date") {
            control = (
              <InputGroup size="sm">
                <Form.Control id={id} type="date" value={v.from} onChange={(e) => set(f.key, { ...v, from: e.target.value })} aria-label={`${label} from`} />
                <InputGroup.Text>to</InputGroup.Text>
                <Form.Control type="date" value={v.to} onChange={(e) => set(f.key, { ...v, to: e.target.value })} aria-label={`${label} to`} />
              </InputGroup>
            );
          } else if (f.type === "select" || f.type === "boolean") {
            const options = f.type === "boolean" ? [["Yes", "true"], ["No", "false"]] : options_of(f.options);
            control = (
              <Form.Select id={id} size="sm" value={v} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">All</option>
                {options.map(([l, o]) => (
                  <option key={o} value={o}>
                    {l}
                  </option>
                ))}
              </Form.Select>
            );
          } else {
            control = <Form.Control id={id} size="sm" placeholder="ID" value={v} onChange={(e) => set(f.key, e.target.value)} />;
          }
          return (
            <Col key={f.key} xs={12} sm={6} lg={4} className="mb-3">
              <Form.Label htmlFor={id}>{label}</Form.Label>
              {control}
            </Col>
          );
        })}
        <Col xs={12} className="mb-3 d-flex gap-2">
          <Button type="submit" size="sm" className="btn-gradient">
            <span className="feather icon-filter me-1" /> Apply Filters
          </Button>
          <Button type="button" size="sm" variant="outline-secondary" onClick={() => setSp(base_params())}>
            Reset
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
