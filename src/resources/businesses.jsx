import { Link } from "react-router-dom";
import { ActionButton, AttachmentCard, AttributesTable, Badge, BUSINESS_TONE, Column, Columns, Panel, TableFor, display } from "../components/ui";
import { capitalize, fmt_datetime, human_size } from "../utils/format";
import { BusinessReject } from "../pages/RejectPages";

// app/admin/businesses.rb
const approve = (b, run, redirect) =>
  run("put", `/businesses/${b.id}/approve`, { confirm: `Approve ${b.name}?`, confirm_label: "Approve", variant: "success", redirect });

const cfg = {
  path: "businesses",
  label: "Businesses",
  singular: "Business",
  model: "Business",
  param_key: "business",
  actions: ["index", "show", "create", "update", "destroy"],
  filters: [
    { key: "name", type: "string" },
    { key: "category", type: "string" },
    { key: "status", type: "select", options: ["draft", "submitted", "approved", "rejected"] },
    { key: "created_at", type: "date" },
    { key: "user_id", type: "id", label: "User ID" },
  ],
  batch_actions: [
    { name: "batch_approve", label: "Approve Selected", confirm: "Approve selected businesses?", variant: "success", confirm_label: "Approve" },
    {
      name: "batch_reject",
      label: "Reject Selected",
      variant: "danger",
      confirm_label: "Reject",
      input: { key: "rejection_reason", label: "Rejection reason", placeholder: "Shown to every selected business owner and emailed to them." },
    },
    { name: "destroy", label: "Delete Selected", confirm: "Delete the selected businesses? This cannot be undone.", variant: "danger", confirm_label: "Delete" },
  ],
  columns: [
    "name",
    "category",
    { key: "owner", title: "Owner", sort: false },
    { key: "phone", title: "Phone", sort: false },
    { key: "city", title: "City", sort: false },
    { key: "status", render: (b) => <Badge tone={BUSINESS_TONE[b.status]}>{capitalize(b.status)}</Badge> },
    { key: "created_at", title: "Created On" },
  ],
  row_actions: (b, { run }) => [
    b.status === "submitted" && { key: "approve", label: "✅ Approve", variant: "success", onClick: () => approve(b, run, `/businesses/${b.id}`) },
    b.status === "submitted" && { key: "reject", label: "❌ Reject", variant: "danger", to: `/businesses/${b.id}/reject` },
    b.status === "approved" && { key: "revoke", label: "⚠️ Revoke Approval", variant: "danger", to: `/businesses/${b.id}/reject` },
  ],
  show: (b, { run }) => <BusinessShow b={b} run={run} />,
  comments: true,
  form: [
    {
      title: "Business Details",
      fields: [
        { key: "name" },
        { key: "category" },
        { key: "year_established" },
        { key: "website" },
        {
          key: "status",
          as: "select",
          options: [
            ["Draft", "draft"],
            ["Submitted", "submitted"],
            ["Approved", "approved"],
            ["Rejected", "rejected"],
          ],
        },
        { key: "about", as: "text" },
      ],
    },
  ],
  routes: [{ path: "businesses/:id/reject", element: <BusinessReject /> }],
};

function BusinessShow({ b, run }) {
  const shop = (b.shop_images || []).filter(Boolean);
  const contact = b.business_contact;
  const loc = b.business_location;
  const doc = b.business_document;

  return (
    <>
      <Panel title="Status & Actions" icon="activity">
        <div className="status-strip">
          <Badge tone={BUSINESS_TONE[b.status]} big>
            {String(b.status || "").toUpperCase()}
          </Badge>
          {b.status === "submitted" && (
            <>
              <ActionButton variant="success" icon="check" onClick={() => approve(b, run)}>
                Approve
              </ActionButton>
              <ActionButton variant="danger" icon="x" to={`/businesses/${b.id}/reject`}>
                Reject
              </ActionButton>
            </>
          )}
          {b.status === "approved" && (
            <ActionButton variant="outline-danger" icon="alert-triangle" to={`/businesses/${b.id}/reject`}>
              Revoke Approval
            </ActionButton>
          )}
        </div>
        {b.status === "rejected" && b.rejection_reason && (
          <div className="rejection-box">
            <strong>Rejection Reason:</strong>
            {b.rejection_reason}
          </div>
        )}
      </Panel>

      <Columns>
        <Column>
          <Panel title="Business Details" icon="briefcase">
            <AttributesTable
              md={6}
              rows={[
                ["Name", b.name],
                ["Category", b.category],
                ["Year established", b.year_established],
                ["Website", b.website],
                ["Services", b.services],
                ["Status", capitalize(b.status)],
                ["Created on", fmt_datetime(b.created_at)],
                ["About", b.about],
              ]}
            />
          </Panel>
          <Panel title="Owner / User" icon="user">
            {b.user ? (
              <AttributesTable
                md={6}
                rows={[
                  ["Name", <Link to={`/users/${b.user.id}`}>{b.user.name || b.user.id}</Link>],
                  ["Phone number", b.user.phone_number],
                  ["Email", b.user.email],
                  ["Account type", b.user.account_type],
                  ["Joined on", fmt_datetime(b.user.created_at)],
                ]}
              />
            ) : (
              <p className="text-muted mb-0">No user linked.</p>
            )}
          </Panel>
        </Column>
        <Column>
          <Panel title="Contact Information" icon="phone">
            {contact ? (
              <AttributesTable
                md={6}
                rows={[
                  ["Contact person", contact.contact_person_name],
                  ["Contact phone", contact.contact_phone],
                  ["Contact email", contact.contact_email],
                  ["Owner name", contact.owner_name],
                  ["Owner phone", contact.owner_phone],
                  ["Owner email", contact.owner_email],
                ]}
              />
            ) : (
              <p className="text-muted mb-0">No contact info yet.</p>
            )}
          </Panel>
          <Panel title="Location" icon="map-pin">
            {loc ? (
              <AttributesTable
                md={6}
                rows={[
                  ["Address line 1", loc.address_line1],
                  ["Address line 2", loc.address_line2],
                  ["City", loc.city],
                  ["State", loc.state],
                  ["Pin code", loc.pin_code],
                  ["Coordinates", loc.latitude !== null && loc.latitude !== undefined ? `${display(loc.latitude)}, ${display(loc.longitude)}` : null],
                  ["Map address", loc.map_address],
                ]}
              />
            ) : (
              <p className="text-muted mb-0">No location info yet.</p>
            )}
          </Panel>
        </Column>
      </Columns>

      <Columns>
        <Column>
          <Panel title="Business Hours" icon="clock">
            <TableFor
              rows={b.business_hours}
              empty="No hours set."
              columns={[
                { title: "Day", render: (h) => h.day },
                { title: "Open?", render: (h) => (h.is_open ? <Badge tone="green">Open</Badge> : <Badge tone="gray">Closed</Badge>) },
                { title: "Opens", render: (h) => h.opens },
                { title: "Closes", render: (h) => h.closes },
              ]}
            />
          </Panel>
        </Column>
        <Column>
          <Panel title="Documents" icon="file-text">
            {doc ? (
              <AttributesTable
                md={12}
                rows={[
                  ["GSTIN", doc.gstin_display],
                  ["PAN", doc.pan_display],
                  ["FSSAI", doc.fssai_display],
                ]}
              />
            ) : (
              <p className="text-muted mb-0">No documents uploaded.</p>
            )}
          </Panel>
        </Column>
      </Columns>

      <Panel title="Images" icon="image">
        <div className="image-summary">
          <strong>Image Summary:</strong>
          {b.profile_picture && <span className="badge bg-primary">1 Profile Picture</span>}
          {shop.length > 0 && (
            <span className="badge bg-success">
              {shop.length} Gallery {shop.length === 1 ? "Image" : "Images"}
            </span>
          )}
          {!b.profile_picture && !shop.length && <span className="text-muted">No images uploaded</span>}
        </div>
        {!b.profile_picture && !shop.length && (
          <div className="empty-state">
            <span className="feather icon-image" />
            The business owner has not uploaded a profile picture or shop images during onboarding.
          </div>
        )}
        {b.profile_picture && (
          <div className="mb-4">
            <div className="image-section-title">Business Logo / Profile Picture</div>
            <div className="d-flex flex-wrap gap-4 align-items-start">
              <div style={{ width: 180 }}>
                <AttachmentCard file={b.profile_picture} />
              </div>
              <div className="text-muted">
                <p className="mb-1">
                  <strong>Content type:</strong> {b.profile_picture.content_type}
                </p>
                <p className="mb-1">
                  <strong>Size:</strong> {human_size(b.profile_picture.byte_size)}
                </p>
                <p className="mb-3">
                  <strong>Uploaded:</strong> {fmt_datetime(b.profile_picture.created_at)}
                </p>
                <a className="btn btn-sm btn-outline-primary" href={b.profile_picture.url} target="_blank" rel="noopener noreferrer">
                  <span className="feather icon-maximize-2 me-1" /> View Full Size
                </a>
              </div>
            </div>
          </div>
        )}
        {shop.length > 0 && (
          <div>
            <div className="image-section-title">Shop / Gallery Images</div>
            <div className="attachment-grid">
              {shop.map((img, i) => (
                <AttachmentCard key={img.id || i} file={img} label={`Image ${i + 1}`} />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}

export default cfg;
