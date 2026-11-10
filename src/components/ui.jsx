import { Alert, Button, Card, Col, Row, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { fmt_datetime, human_size, is_blank, is_date_string } from "../utils/format";

// hah-admin card: <Card><Card.Header><Card.Title as="h5"><span className="feather icon-x" /> Title</Card.Title></Card.Header>
export const Panel = ({ title, icon, actions, children, className = "", bodyClass }) => (
  <Card className={className}>
    {title && (
      <Card.Header className={actions ? "d-flex flex-wrap align-items-center justify-content-between" : undefined}>
        <Card.Title as="h5">
          {icon && <span className={`feather icon-${icon} me-1`} />} {title}
        </Card.Title>
        {actions && <div className="card-header-actions">{actions}</div>}
      </Card.Header>
    )}
    <Card.Body className={bodyClass}>{children}</Card.Body>
  </Card>
);

export const Columns = ({ children }) => <Row>{children}</Row>;
export const Column = ({ children, md = 6 }) => <Col md={md}>{children}</Col>;

// tone → bootstrap contextual colour
const VARIANT = { green: "success", amber: "warning", red: "danger", gray: "secondary", slate: "secondary", blue: "info", purple: "primary" };
export const BUSINESS_TONE = { approved: "green", submitted: "amber", draft: "gray", rejected: "red" };
export const PAYMENT_TONE = { paid: "green", pending: "amber", failed: "red", expired: "slate" };
export const REQUEST_TONE = { pending: "amber", approved: "green", rejected: "red" };

export const Badge = ({ tone = "gray", big = false, children }) => {
  const v = VARIANT[tone] || "secondary";
  return <span className={`badge rounded-pill bg-${v}${v === "warning" || v === "info" ? " text-dark" : ""}${big ? " badge-lg" : ""}`}>{children}</span>;
};

export const StatusTag = ({ value, yes = "Yes", no = "No" }) => <Badge tone={value ? "green" : "gray"}>{value ? yes : no}</Badge>;

export const Muted = ({ children }) => <span className="text-muted">{children}</span>;

// Generic value rendering for detail grids and default index columns
export function display(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return <StatusTag value={value} />;
  if (is_date_string(value)) return fmt_datetime(value);
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== "object")) return value.join(", ");
    return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
  }
  if (typeof value === "object") return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
  return String(value);
}

const is_wide = (value) =>
  (typeof value === "string" && value.length > 60) || (value && typeof value === "object" && value.type === "pre");

// hah-admin detail layout: <Col md={4}><h6>Label</h6><h5>Value</h5></Col>
// rows: [[label, value], ...] (falsy rows are skipped)
export function AttributesTable({ rows, md = 4 }) {
  return (
    <Row className="detail-grid">
      {rows.filter(Boolean).map(([label, value]) => (
        <Col key={label} md={is_wide(value) ? 12 : md} sm={6}>
          <h6>{label}</h6>
          <h5>{is_blank(value) ? <span className="empty-value">-</span> : value}</h5>
        </Col>
      ))}
    </Row>
  );
}

// columns [{ title, render(row) }]
export function TableFor({ rows, columns, empty = "No records found." }) {
  if (!rows || !rows.length) return <p className="text-muted mb-0">{empty}</p>;
  return (
    <Table striped hover responsive className="admin-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.title}>{c.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id || i}>
            {columns.map((c) => (
              <td key={c.title}>{c.render(r)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

// A button that is either a router link (`to`) or an action (`onClick`)
export function ActionButton({ to, onClick, variant = "outline-primary", icon, children, gradient = false, disabled }) {
  const className = gradient ? "btn-gradient" : undefined;
  const body = (
    <>
      {icon && <span className={`feather icon-${icon} me-1`} />}
      {children}
    </>
  );
  return to ? (
    <Button as={Link} to={to} size="sm" variant={variant} className={className}>
      {body}
    </Button>
  ) : (
    <Button size="sm" variant={variant} className={className} onClick={onClick} disabled={disabled}>
      {body}
    </Button>
  );
}

export const Loading = ({ full = false }) => (
  <div className={`d-flex justify-content-center align-items-center ${full ? "vh-100" : "py-5"}`}>
    <Spinner animation="border" variant="primary" role="status">
      <span className="visually-hidden">Loading…</span>
    </Spinner>
  </div>
);

export const ErrorBox = ({ children }) => <Alert variant="danger">{children}</Alert>;

// Attachment from the API: { id, filename, content_type, byte_size, created_at, url }
export function AttachmentCard({ file, label }) {
  if (!file) return null;
  const image = String(file.content_type || "").startsWith("image/");
  return (
    <div className="attachment-card">
      {image ? (
        <a href={file.url} target="_blank" rel="noopener noreferrer" title="Open full size">
          <img src={file.url} alt={file.filename} />
        </a>
      ) : (
        <a className="attachment-file" href={file.url} target="_blank" rel="noopener noreferrer">
          <span className="feather icon-download" /> {file.content_type || "file"}
        </a>
      )}
      <div className="attachment-meta">
        {label && <strong>{label}</strong>}
        {file.filename}
        <div>{human_size(file.byte_size)}</div>
      </div>
    </div>
  );
}

export function AttachmentGrid({ files, empty = "No media attached." }) {
  const list = (files || []).filter(Boolean);
  if (!list.length) return <p className="text-muted mb-0">{empty}</p>;
  return (
    <div className="attachment-grid">
      {list.map((f, i) => (
        <AttachmentCard key={f.id || i} file={f} label={`File ${i + 1}`} />
      ))}
    </div>
  );
}
