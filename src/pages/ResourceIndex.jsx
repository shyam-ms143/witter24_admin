import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Dropdown, Form, Nav, Table } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { api, download } from "../api";
import { notify, useConfirm, useRunner } from "../ui-context";
import Page from "../components/Page";
import Filters, { active_filter_count } from "../components/Filters";
import Pagination from "../components/Pagination";
import { ErrorBox, Loading, display } from "../components/ui";
import { humanize, short_id } from "../utils/format";
import { can } from "../resources/helpers";

const DESTROY_BATCH = { name: "destroy", label: "Delete Selected", confirm: "Are you sure you want to delete the selected records?", variant: "danger" };

const normalize = (c) => (typeof c === "string" ? { key: c } : c);

export default function ResourceIndex({ cfg }) {
  const confirm = useConfirm();
  const [sp, setSp] = useSearchParams();
  const qs = sp.toString();
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [show_filters, setShowFilters] = useState(() => cfg.filters && active_filter_count(cfg.filters, sp) > 0);

  useEffect(() => {
    document.title = `${cfg.label} | Witter24 Admin`;
  }, [cfg.label]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/${cfg.path}`, qs);
      setRes(r);
      setError(null);
      setSelected([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cfg.path, qs]);

  useEffect(() => {
    load();
  }, [load]);

  const run = useRunner(load);
  const rows = useMemo(() => res?.data || [], [res]);
  const meta = res?.meta;

  const batch_actions = cfg.batch_actions ?? (can(cfg, "destroy") ? [DESTROY_BATCH] : []);
  const selectable = batch_actions.length > 0;

  const set_params = (changes) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === undefined || v === "" ? next.delete(k) : next.set(k, v)));
    setSp(next);
  };

  // ?order=<field>_asc|_desc (default id_desc)
  const [order_key, order_dir] = (() => {
    const m = /^(.+)_(asc|desc)$/.exec(sp.get("order") || cfg.default_order || "id_desc");
    return m ? [m[1], m[2]] : ["id", "desc"];
  })();
  const sort_by = (key) => set_params({ order: order_key === key && order_dir === "desc" ? `${key}_asc` : `${key}_desc`, page: null });

  const columns = useMemo(() => {
    const base = cfg.columns
      ? cfg.columns.map(normalize)
      : Object.keys(rows[0] || {})
          .filter((k) => k !== "id")
          .map((k) => ({ key: k }));
    const id_col = {
      key: "id",
      title: "#ID",
      render: (r) => (
        <Link to={`/${cfg.path}/${r.id}`} title={r.id} className="id-cell">
          {short_id(r.id)}
        </Link>
      ),
    };
    return cfg.id_column === false ? base : [id_col, ...base];
  }, [cfg, rows]);

  // eye / edit icons + a "more" dropdown with the member actions, as in hah-admin lists
  const row_menu = (r) =>
    [
      ...(cfg.row_actions ? cfg.row_actions(r, { run }) : []),
      can(cfg, "destroy") && {
        key: "delete",
        label: cfg.delete_label || "Delete",
        variant: "danger",
        onClick: () => run("del", `/${cfg.path}/${r.id}`, { confirm: `Are you sure you want to delete this ${cfg.singular}?` }),
      },
    ].filter(Boolean);

  const run_batch = async (action) => {
    let inputs = {};
    if (action.input) {
      const value = await confirm({
        title: action.label,
        body: `Applies to ${selected.length} selected record(s).`,
        input: action.input,
        variant: action.variant || "primary",
        confirm_label: action.confirm_label || "Submit",
      });
      if (value === false) return;
      inputs = { [action.input.key]: value };
    } else if (!(await confirm({ title: action.label, body: action.confirm, variant: action.variant || "primary", confirm_label: action.confirm_label || "Confirm" }))) {
      return;
    }
    try {
      const r = await api.post(`/${cfg.path}/batch_action`, {
        batch_action: action.name,
        collection_selection: selected,
        batch_action_inputs: inputs,
      });
      notify.success(r.message);
      await load();
    } catch (e) {
      notify.error(e.message);
      // refresh anyway so the table reflects whatever the server did; load() also clears the selection
      setSelected([]);
      await load();
    }
  };

  const do_download = async (format) => {
    const next = new URLSearchParams(sp);
    next.delete("page");
    next.delete("per_page");
    try {
      await download(`/${cfg.path}.${format}`, next.toString(), `${cfg.path}.${format}`);
    } catch (e) {
      notify.error(e.message);
    }
  };

  const all_selected = rows.length > 0 && selected.length === rows.length;
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const filter_count = cfg.filters ? active_filter_count(cfg.filters, sp) : 0;

  return (
    <Page title={cfg.label} breadcrumbs={[{ label: cfg.label, to: `/${cfg.path}` }]}>
      {meta?.scopes && (
        <Nav variant="tabs" className="scope-tabs">
          {meta.scopes.map((s) => (
            <Nav.Item key={s.id}>
              <Nav.Link active={meta.scope === s.id} onClick={() => set_params({ scope: s.id, page: null })}>
                {s.name}
                <span className={`badge rounded-pill scope-count ${meta.scope === s.id ? "bg-primary" : "bg-light text-dark"}`}>{s.count}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      )}
      <Card>
        <Card.Header className="d-flex flex-wrap align-items-center justify-content-between">
          <div>
            <Card.Title as="h5" className="d-inline">
              {cfg.label}
            </Card.Title>{" "}
            {meta && <span className="badge bg-primary card-title-badge">{meta.total}</span>}
          </div>
          <div className="card-header-actions">
            {cfg.filters && (
              <Button size="sm" variant={show_filters ? "primary" : "outline-primary"} onClick={() => setShowFilters((s) => !s)}>
                <span className="feather icon-filter me-1" /> Filters{filter_count ? ` (${filter_count})` : ""}
              </Button>
            )}
            {selectable && selected.length > 0 && (
              <Dropdown>
                <Dropdown.Toggle size="sm" variant="outline-secondary">
                  Bulk Actions ({selected.length})
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {batch_actions.map((a) => (
                    <Dropdown.Item key={a.name} className={a.variant === "danger" ? "text-danger" : undefined} onClick={() => run_batch(a)}>
                      {a.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
            <Dropdown>
              <Dropdown.Toggle size="sm" variant="outline-secondary">
                <span className="feather icon-download me-1" /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => do_download("csv")}>CSV</Dropdown.Item>
                <Dropdown.Item onClick={() => do_download("json")}>JSON</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {can(cfg, "create") && (
              <Button as={Link} to={`/${cfg.path}/new`} size="sm" variant="outline-primary" className="btn-gradient m-0">
                <span className="feather icon-plus" /> Create {cfg.singular}
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {cfg.filters && show_filters && <Filters filters={cfg.filters} sp={sp} setSp={setSp} />}
          {cfg.sidebar && res && cfg.sidebar(res)}
          {error && <ErrorBox>{error}</ErrorBox>}
          {!res && loading && <Loading />}
          {res && (
            <>
              {rows.length === 0 ? (
                <div className="empty-state">
                  <span className="feather icon-inbox" />
                  {filter_count ? `No ${cfg.label.toLowerCase()} match these filters.` : `No ${cfg.label.toLowerCase()} found.`}
                </div>
              ) : (
                <div className={loading ? "opacity-50" : undefined}>
                  <Table striped hover responsive className="admin-table">
                    <thead>
                      <tr>
                        {selectable && (
                          <th style={{ width: 36 }}>
                            <Form.Check
                              aria-label="Select all"
                              checked={all_selected}
                              onChange={() => setSelected(all_selected ? [] : rows.map((r) => r.id))}
                            />
                          </th>
                        )}
                        {columns.map((c) => {
                          const sort_key = c.sort === false ? null : c.sort || c.key;
                          const title = c.title ?? humanize(c.key);
                          const sorted = order_key === sort_key;
                          return sort_key ? (
                            <th key={c.key || c.title} className={`sortable-th${sorted ? " sorted" : ""}`} onClick={() => sort_by(sort_key)}>
                              {title}
                              <span className={`feather icon-${sorted && order_dir === "asc" ? "chevron-up" : "chevron-down"}`} />
                            </th>
                          ) : (
                            <th key={c.key || c.title}>{title}</th>
                          );
                        })}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const menu = row_menu(r);
                        return (
                          <tr key={r.id} className={selected.includes(r.id) ? "selected-row" : undefined}>
                            {selectable && (
                              <td>
                                <Form.Check aria-label={`Select ${r.id}`} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                              </td>
                            )}
                            {columns.map((c) => (
                              <td key={c.key || c.title}>{c.render ? c.render(r, { run }) : display(r[c.key])}</td>
                            ))}
                            <td>
                              <div className="row-actions">
                                <Link title="View" className="feather icon-eye text-decoration-none" to={`/${cfg.path}/${r.id}`} />
                                {can(cfg, "update") && (
                                  <Link title="Edit" className="feather icon-edit text-decoration-none" to={`/${cfg.path}/${r.id}/edit`} />
                                )}
                                {menu.length > 0 && (
                                  <Dropdown className="d-inline">
                                    <Dropdown.Toggle as="a" href="#more" className="text-decoration-none" onClick={(e) => e.preventDefault()} aria-label="More actions">
                                      <span className="feather icon-more-vertical" />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
                                      {menu.map((a) =>
                                        a.to ? (
                                          <Dropdown.Item key={a.key} as={Link} to={a.to} className={a.variant ? `text-${a.variant}` : undefined}>
                                            {a.label}
                                          </Dropdown.Item>
                                        ) : (
                                          <Dropdown.Item key={a.key} onClick={a.onClick} className={a.variant ? `text-${a.variant}` : undefined}>
                                            {a.label}
                                          </Dropdown.Item>
                                        )
                                      )}
                                    </Dropdown.Menu>
                                  </Dropdown>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
              <Pagination
                meta={meta}
                onPage={(p) => set_params({ page: p === 1 ? null : p })}
                onPerPage={(n) => set_params({ per_page: n === 30 ? null : n, page: null })}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </Page>
  );
}
