import { Link } from "react-router-dom";
import { AttachmentGrid, AttributesTable, Column, Columns, Panel, StatusTag, display } from "../components/ui";
import { fmt_datetime, fmt_day_time } from "../utils/format";
import { Validity } from "../pages/Dashboard";
import { LinksPanel, UserPanel } from "./helpers";
import { PostType } from "./jobs";

// app/admin/offers.rb
const km = (v) => (v !== null && v !== undefined && v !== "" ? `${v} km` : "—");

const cfg = {
  path: "offers",
  label: "Offers",
  singular: "Offer",
  model: "Offer",
  param_key: "offer",
  actions: ["index", "show", "create", "update", "destroy"],
  filters: [
    { key: "title", type: "string" },
    { key: "offer_type", type: "select", options: ["local", "global"] },
    { key: "valid_till", type: "date" },
    { key: "user_id", type: "id", label: "User ID" },
    { key: "address", type: "string" },
    { key: "created_at", type: "date" },
  ],
  batch_actions: [{ name: "destroy", label: "Delete Selected", confirm: "Delete selected offers? This cannot be undone.", variant: "danger", confirm_label: "Delete" }],
  columns: [
    { key: "title", render: (o) => <Link to={`/offers/${o.id}`}>{o.title}</Link> },
    { key: "posted_by", title: "Posted By", sort: false },
    { key: "offer_type", title: "Type", render: (o) => <PostType value={o.offer_type} /> },
    "address",
    { key: "valid_till", title: "Valid Till", render: (o) => <Validity offer={o} prefix /> },
    { key: "has_media", title: "Media", sort: false, render: (o) => <StatusTag value={o.has_media} /> },
    { key: "created_at", title: "Posted On" },
  ],
  show: (o) => {
    const media = Array.isArray(o.media) ? o.media : o.media ? [o.media] : [];
    return (
      <Columns>
        <Column md={7}>
          <Panel title="Offer Details" icon="tag">
            <AttributesTable
              md={6}
              rows={[
                ["Title", o.title],
                ["Offer type", <PostType value={o.offer_type} />],
                ["Tags", display(o.tags)],
                [
                  "Valid till",
                  !o.valid_till ? (
                    "No expiry"
                  ) : o.validity === "expired" ? (
                    <span className="fw-bold text-danger">Expired — {fmt_day_time(o.valid_till)}</span>
                  ) : (
                    <span className="fw-bold text-success">Active until {fmt_day_time(o.valid_till)}</span>
                  ),
                ],
                ["Disappearing days", o.disappearing_days ? `${o.disappearing_days} days` : "—"],
                ["Posted on", fmt_datetime(o.created_at)],
                ["Updated on", fmt_datetime(o.updated_at)],
                ["Description", o.description],
              ]}
            />
          </Panel>
          <LinksPanel links={o.links} />
          <Panel title="Media" icon="image">
            <AttachmentGrid files={media} />
          </Panel>
        </Column>
        <Column md={5}>
          <UserPanel user={o.user} />
          <Panel title="Location" icon="map-pin">
            {o.address || o.latitude ? (
              <AttributesTable
                md={6}
                rows={[
                  ["Address", o.address],
                  ["Reach distance", km(o.reach_distance)],
                  ["Latitude", display(o.latitude)],
                  ["Longitude", display(o.longitude)],
                ]}
              />
            ) : (
              <p className="text-muted mb-0">No location set.</p>
            )}
          </Panel>
        </Column>
      </Columns>
    );
  },
  comments: true,
  form: [
    {
      title: "Offer Details",
      fields: [
        { key: "user_id", label: "User ID" },
        { key: "title" },
        { key: "offer_type", as: "select", options: ["local", "global"] },
        { key: "valid_till", as: "datetime" },
        { key: "tags", hint: "Comma separated" },
        { key: "disappearing_days", as: "number" },
        { key: "description", as: "text" },
      ],
    },
    {
      title: "Location (required for local)",
      fields: [
        { key: "address" },
        { key: "reach_distance", as: "number", hint: "in km" },
        { key: "latitude", as: "number" },
        { key: "longitude", as: "number" },
      ],
    },
  ],
};

export default cfg;
