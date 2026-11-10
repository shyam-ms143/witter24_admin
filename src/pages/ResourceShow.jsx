import { useCallback, useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useRunner } from "../ui-context";
import Page from "../components/Page";
import CommentsPanel from "../components/CommentsPanel";
import { ActionButton, AttributesTable, ErrorBox, Loading, Panel } from "../components/ui";
import { short_id } from "../utils/format";
import { all_rows, breadcrumbs_for, can, display_name } from "../resources/helpers";

// hah-admin view page: a title card ("X Details - <badge>id</badge>" + Edit) followed by detail cards
export default function ResourceShow({ cfg }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/${cfg.path}/${id}`);
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [cfg.path, id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = useRunner(load);
  const name = data ? display_name(cfg, data) : cfg.singular;

  return (
    <Page title={name} breadcrumbs={breadcrumbs_for(cfg, [{ label: data ? name : short_id(id) }])}>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <>
          <Card>
            <Card.Header className="d-flex flex-wrap align-items-center justify-content-between">
              <Card.Title as="h4" className="d-inline mb-0">
                {cfg.singular} Details - <span className="badge bg-primary card-title-badge">{short_id(data.id)}</span>
              </Card.Title>
              <div className="card-header-actions">
                {cfg.show_actions && cfg.show_actions(data, { run })}
                {can(cfg, "update") && (
                  <ActionButton to={`/${cfg.path}/${id}/edit`} icon="edit" gradient>
                    Edit
                  </ActionButton>
                )}
                {can(cfg, "destroy") && (
                  <ActionButton
                    variant="outline-danger"
                    icon="trash-2"
                    onClick={() =>
                      run("del", `/${cfg.path}/${id}`, { confirm: `Are you sure you want to delete this ${cfg.singular}?`, redirect: `/${cfg.path}` })
                    }
                  >
                    {cfg.delete_label || "Delete"}
                  </ActionButton>
                )}
              </div>
            </Card.Header>
          </Card>
          {cfg.show ? (
            cfg.show(data, { run, reload: load })
          ) : (
            <Panel title="Primary Details" icon="file-text">
              <AttributesTable rows={all_rows(data)} />
            </Panel>
          )}
          {(cfg.comments ?? !cfg.show) && cfg.model && (
            <CommentsPanel resource_type={cfg.model} resource_id={data.id} comments={data.active_admin_comments} reload={load} />
          )}
        </>
      )}
    </Page>
  );
}
