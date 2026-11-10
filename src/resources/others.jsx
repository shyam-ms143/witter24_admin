import { Link } from "react-router-dom";
import { AttachmentGrid, AttributesTable, Panel, display } from "../components/ui";
import { fmt_datetime } from "../utils/format";
import { all_rows } from "./helpers";

const ALL = ["index", "show", "create", "update", "destroy"];

// app/admin/global_feeds.rb
export const global_feeds = {
  path: "global_feeds",
  label: "Feeds",
  singular: "Global Feed",
  model: "GlobalFeed",
  param_key: "global_feed",
  actions: ALL,
  filters: [
    { key: "feed_type", type: "select", options: ["global", "local"] },
    { key: "category", type: "string" },
    { key: "user_id", type: "id", label: "User" },
    { key: "title", type: "string" },
    { key: "created_at", type: "date" },
  ],
  columns: [
    { key: "user_id", title: "User", render: (f) => f.user_id && <Link to={`/users/${f.user_id}`}>{String(f.user_id).slice(-6)}</Link> },
    "feed_type",
    "title",
    "category",
    "reach_distance",
    "created_at",
  ],
  show: (f) => (
    <>
      <Panel title="Primary Details" icon="radio">
        <AttributesTable
          rows={[
            
            ["User", f.user_id && <Link to={`/users/${f.user_id}`}>{f.user_id}</Link>],
            ["Feed type", f.feed_type],
            ["Title", f.title],
            ["Description", f.description],
            ["Category", f.category],
            ["Tags", display(f.tags)],
            ["Links", display(f.links)],
            ["Disappear after", display(f.disappear_after)],
            ["Latitude", display(f.latitude)],
            ["Longitude", display(f.longitude)],
            ["Address", f.address],
            ["Reach distance", display(f.reach_distance)],
            ["Created at", fmt_datetime(f.created_at)],
            ["Updated at", fmt_datetime(f.updated_at)],
          ]}
        />
      </Panel>
      <Panel title="Media" icon="image">
        <AttachmentGrid files={f.media} />
      </Panel>
    </>
  ),
  form: [
    {
      title: "Feed Details",
      fields: [
        { key: "user_id", label: "User ID" },
        { key: "feed_type", as: "select", options: ["global", "local"] },
        { key: "title" },
        { key: "description", as: "text" },
        { key: "category" },
        { key: "disappear_after", as: "number" },
        { key: "latitude", as: "number" },
        { key: "longitude", as: "number" },
        { key: "address" },
        { key: "reach_distance", as: "number" },
        { key: "tags", as: "csv", hint: "Comma separated" },
        { key: "links", as: "links", name_key: "name" },
      ],
    },
  ],
};

// app/admin/categories.rb
export const categories = {
  path: "categories",
  label: "Categories",
  singular: "Category",
  model: "Category",
  param_key: "category",
  actions: ALL,
  filters: [
    { key: "name", type: "string" },
    { key: "is_active", type: "boolean" },
    { key: "created_at", type: "date" },
  ],
  columns: ["name", "emoji", "priority", "is_active", "created_at"],
  form: [{ fields: [{ key: "name" }, { key: "emoji" }, { key: "priority", as: "number" }, { key: "is_active", as: "boolean", default: true }] }],
};

// app/admin/contents.rb — raw HTML pages (terms_and_conditions / privacy_policy)
export const contents = {
  path: "contents",
  label: "Contents",
  singular: "Content",
  model: "Content",
  param_key: "content",
  actions: ALL,
  filters: [
    { key: "title", type: "string" },
    { key: "created_at", type: "date" },
  ],
  columns: ["title", "subtitle", "updated_at"],
  show: (c) => (
    <>
      <Panel title="Primary Details" icon="file-text">
        <AttributesTable
          rows={[
            ["Title", c.title],
            ["Subtitle", c.subtitle],
            ["Content", c.content && <pre className="json">{c.content}</pre>],
            ["Created at", fmt_datetime(c.created_at)],
            ["Updated at", fmt_datetime(c.updated_at)],
          ]}
        />
      </Panel>
      <Panel title="HTML Preview" icon="eye">
        {/* sandboxed: the stored HTML renders, but its scripts can't run against the admin session */}
        <iframe className="html-preview" title="HTML Preview" sandbox="" srcDoc={c.content || ""} />
      </Panel>
    </>
  ),
  form: [
    {
      title: "Content Details",
      fields: [
        { key: "title", hint: "Use 'terms_and_conditions' or 'privacy_policy' as the key title" },
        { key: "subtitle" },
        { key: "content", as: "text", rows: 30, mono: true, hint: "Enter raw HTML." },
      ],
    },
  ],
};

// app/admin/reach_distance_settings.rb — singleton, no destroy
export const reach_distance_settings = {
  path: "reach_distance_settings",
  label: "Reach Distance",
  singular: "Reach Distance Setting",
  model: "ReachDistanceSetting",
  param_key: "reach_distance_setting",
  actions: ["index", "show", "create", "update"],
  check_new: true,
  title: (s) => `Reach Distance Setting #${String(s.id).slice(-6)}`,
  filters: [
    { key: "is_active", type: "boolean" },
    { key: "ranges", type: "string" },
    { key: "created_at", type: "date" },
    { key: "updated_at", type: "date" },
  ],
  columns: ["is_active", { key: "ranges", title: "Ranges (km)", render: (s) => (s.ranges_array || []).join(", ") }, "updated_at"],
  show: (s) => (
    <Panel title="Primary Details" icon="navigation">
      <AttributesTable
        rows={[
          
          ["Is active", display(s.is_active)],
          ["Ranges (km)", (s.ranges_array || []).join(", ")],
          ["Created at", fmt_datetime(s.created_at)],
          ["Updated at", fmt_datetime(s.updated_at)],
        ]}
      />
    </Panel>
  ),
  form: [
    {
      title: "Reach Distance Settings",
      fields: [
        { key: "is_active", as: "boolean", label: "Enable", default: true },
        {
          key: "ranges",
          label: "Distances (km) - comma separated",
          hint: "Example: 5,10,15,20,25 (only numbers, comma separated)",
          placeholder: "5,10,15,20,25",
        },
      ],
    },
  ],
};

// app/admin/onboarding_progresses.rb
export const onboarding_progresses = {
  path: "onboarding_progresses",
  label: "Onboarding",
  singular: "Onboarding Progress",
  model: "OnboardingProgress",
  param_key: "onboarding_progress",
  actions: ALL,
  filters: [
    { key: "completed", type: "boolean" },
    { key: "current_step", type: "number" },
    { key: "user_id", type: "id", label: "User" },
    { key: "business_id", type: "id", label: "Business" },
    { key: "created_at", type: "date" },
  ],
  columns: [
    { key: "user_id", title: "User", render: (o) => o.user_id && <Link to={`/users/${o.user_id}`}>{String(o.user_id).slice(-6)}</Link> },
    {
      key: "business_id",
      title: "Business",
      render: (o) => o.business_id && <Link to={`/businesses/${o.business_id}`}>{String(o.business_id).slice(-6)}</Link>,
    },
    "current_step",
    "completed",
    "completed_at",
    "created_at",
  ],
  form: [
    {
      fields: [
        { key: "user_id", label: "User ID" },
        { key: "business_id", label: "Business ID" },
        { key: "current_step", as: "number" },
        { key: "steps_completed", as: "number_list", hint: "Comma separated step numbers, e.g. 1, 2, 3" },
        { key: "completed", as: "boolean" },
        { key: "completed_at", as: "datetime" },
      ],
    },
  ],
};

// app/admin/otp_codes.rb — no permit_params, so only view / delete make sense
export const otp_codes = {
  path: "otp_codes",
  label: "Otp Codes",
  singular: "Otp Code",
  model: "OtpCode",
  actions: ["index", "show", "destroy"],
  filters: [
    { key: "user_id", type: "id", label: "User" },
    { key: "phone_number", type: "string" },
    { key: "otp_number", type: "string" },
    { key: "otp_expiry", type: "date" },
    { key: "used_at", type: "date" },
    { key: "created_at", type: "date" },
    { key: "updated_at", type: "date" },
  ],
  title: (o) => `Otp Code #${String(o.id).slice(-6)}`,
};

// app/admin/admin_users.rb
export const admin_users = {
  path: "admin_users",
  label: "Admin Users",
  singular: "Admin User",
  model: "AdminUser",
  param_key: "admin_user",
  actions: ALL,
  filters: [
    { key: "email", type: "string" },
    { key: "created_at", type: "date" },
  ],
  columns: ["email", "created_at", "updated_at"],
  form: [
    {
      fields: [
        { key: "email", as: "email" },
        { key: "password", as: "password", omit_blank: true, hint: "Leave blank to keep the current password. Changing it signs that admin out everywhere." },
        { key: "password_confirmation", as: "password", omit_blank: true },
      ],
    },
  ],
};

// ActiveAdmin comments (index / show / destroy)
const RESOURCE_PATHS = {
  AdminUser: "admin_users",
  Business: "businesses",
  BusinessUpgradeRequest: "business_upgrade_requests",
  Category: "categories",
  Content: "contents",
  GlobalFeed: "global_feeds",
  Job: "jobs",
  Offer: "offers",
  OnboardingProgress: "onboarding_progresses",
  OtpCode: "otp_codes",
  Payment: "payments",
  ReachDistanceSetting: "reach_distance_settings",
  SubscriptionPlan: "subscription_plans",
  User: "users",
};

export const comments = {
  path: "comments",
  label: "Comments",
  singular: "Comment",
  actions: ["index", "show", "destroy"],
  comments: false,
  title: (c) => `Comment #${String(c.id).slice(-6)}`,
  filters: [
    { key: "resource_type", type: "select", options: Object.keys(RESOURCE_PATHS).map((k) => [k, k]) },
    { key: "resource_id", type: "id", label: "Resource" },
    { key: "author_type", type: "select", options: [["AdminUser", "AdminUser"]] },
    { key: "author_id", type: "id", label: "Author" },
    { key: "body", type: "string" },
    { key: "created_at", type: "date" },
  ],
  columns: [
    "resource_type",
    {
      key: "resource_id",
      title: "Resource",
      render: (c) =>
        RESOURCE_PATHS[c.resource_type] ? (
          <Link to={`/${RESOURCE_PATHS[c.resource_type]}/${c.resource_id}`}>{`${c.resource_type} #${String(c.resource_id).slice(-6)}`}</Link>
        ) : (
          c.resource_id
        ),
    },
    { key: "author_email", title: "Author", sort: false },
    { key: "body", render: (c) => <span className="d-inline-block text-truncate" style={{ maxWidth: 360 }}>{c.body}</span> },
    "created_at",
  ],
  show: (c) => (
    <Panel title="Primary Details" icon="message-square">
      <AttributesTable rows={all_rows(c)} />
    </Panel>
  ),
};

