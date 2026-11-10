import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { api } from "../api";
import { notify, useConfirm } from "../ui-context";
import { fmt_datetime } from "../utils/format";
import { Panel } from "./ui";

// Admin notes on a record (ActiveAdmin comments). resource_type is the model name ("Business", "Job", ...).
export default function CommentsPanel({ resource_type, resource_id, comments = [], reload }) {
  const confirm = useConfirm();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/comments", { resource_type, resource_id, body });
      notify.success("Comment was successfully created.");
      setBody("");
      await reload();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!(await confirm({ title: "Confirm Deletion", body: "Are you sure you want to delete this comment?", variant: "danger", confirm_label: "Delete" })))
      return;
    try {
      const r = await api.del(`/comments/${c.id}`);
      notify.success(r.message);
      await reload();
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <Panel title={`Comments (${comments.length})`} icon="message-square">
      {comments.length === 0 && <p className="text-muted">No comments yet.</p>}
      {comments.map((c) => (
        <div className="comment-item" key={c.id}>
          <div className="comment-meta">
            <strong>{c.author_email || "Unknown"}</strong>
            <span>{fmt_datetime(c.created_at)}</span>
            <Button variant="link" size="sm" className="ms-auto p-0 text-danger" onClick={() => remove(c)}>
              <span className="feather icon-trash-2" /> Delete
            </Button>
          </div>
          <div className="comment-body">{c.body}</div>
        </div>
      ))}
      <Form onSubmit={add} className="mt-3">
        <Form.Control as="textarea" rows={3} placeholder="Add a comment…" value={body} onChange={(e) => setBody(e.target.value)} aria-label="New comment" />
        <Button type="submit" size="sm" className="btn-gradient mt-2" disabled={saving || !body.trim()}>
          <span className="feather icon-message-circle me-1" /> Add Comment
        </Button>
      </Form>
    </Panel>
  );
}
