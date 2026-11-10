import { Link } from "react-router-dom";
import { AttachmentGrid, AttributesTable, Badge, Column, Columns, Panel, display } from "../components/ui";
import { capitalize, fmt_datetime, titleize } from "../utils/format";
import { LinksPanel, UserPanel } from "./helpers";

// app/admin/jobs.rb
const JOB_TYPES = [
  ["Full-Time", "full_time"],
  ["Part-Time", "part_time"],
  ["Internship", "internship"],
  ["Contract", "contract"],
  ["Freelance", "freelance"],
];

// "₹25,000" (Indian digit grouping, as the Rails admin printed it)
const salary = (v) => (v ? `₹${Math.trunc(Number(v)).toLocaleString("en-IN")}` : null);

export const PostType = ({ value }) => <Badge tone={value === "local" ? "blue" : "purple"}>{capitalize(value)}</Badge>;

const km = (v) => (v !== null && v !== undefined && v !== "" ? `${v} km` : "—");

const cfg = {
  path: "jobs",
  label: "Jobs",
  singular: "Job",
  model: "Job",
  param_key: "job",
  actions: ["index", "show", "create", "update", "destroy"],
  filters: [
    { key: "job_title", type: "string" },
    { key: "job_type", type: "select", options: JOB_TYPES },
    { key: "post_type", type: "select", options: ["local", "global"] },
    { key: "experience", type: "string" },
    { key: "salary", type: "string" },
    { key: "location_name", type: "string" },
    { key: "user_id", type: "id", label: "User ID" },
    { key: "created_at", type: "date" },
  ],
  batch_actions: [{ name: "destroy", label: "Delete Selected", confirm: "Delete selected jobs? This cannot be undone.", variant: "danger", confirm_label: "Delete" }],
  columns: [
    { key: "job_title", title: "Title", render: (j) => <Link to={`/jobs/${j.id}`}>{j.job_title}</Link> },
    { key: "posted_by", title: "Posted By", sort: false },
    { key: "job_type", title: "Type", render: (j) => titleize(j.job_type) },
    { key: "post_type", title: "Post", render: (j) => <PostType value={j.post_type} /> },
    "experience",
    { key: "salary", render: (j) => (j.salary ? `${salary(j.salary)} /mo` : "—") },
    { key: "location_name", title: "Location" },
    { key: "created_at", title: "Posted On" },
  ],
  show: (j) => (
    <Columns>
      <Column md={7}>
        <Panel title="Job Details" icon="briefcase">
          <AttributesTable
            md={6}
            rows={[
              ["Job title", j.job_title],
              ["Job type", titleize(j.job_type)],
              ["Post type", <PostType value={j.post_type} />],
              ["Experience", j.experience],
              ["Salary", j.salary ? `${salary(j.salary)} / month` : "—"],
              ["Working hours", j.working_hours],
              ["Skills required", display(j.skills_required)],
              ["Tags", display(j.tags)],
              ["Disappearing days", j.disappearing_days ? `${j.disappearing_days} days` : "—"],
              ["Posted on", fmt_datetime(j.created_at)],
              ["Updated on", fmt_datetime(j.updated_at)],
              ["Description", j.description],
            ]}
          />
        </Panel>
        <LinksPanel links={j.links} />
        {j.images?.length > 0 && (
          <Panel title="Images" icon="image">
            <AttachmentGrid files={j.images} />
          </Panel>
        )}
      </Column>
      <Column md={5}>
        <UserPanel user={j.user} />
        <Panel title="Location" icon="map-pin">
          {j.location_name || j.latitude ? (
            <AttributesTable
              md={6}
              rows={[
                ["Location", j.location_name],
                ["Reach distance", km(j.reach_distance)],
                ["Latitude", display(j.latitude)],
                ["Longitude", display(j.longitude)],
              ]}
            />
          ) : (
            <p className="text-muted mb-0">No location set.</p>
          )}
        </Panel>
      </Column>
    </Columns>
  ),
  comments: true,
  form: [
    {
      title: "Job Details",
      fields: [
        { key: "user_id", label: "User ID" },
        { key: "job_title" },
        { key: "job_type", as: "select", options: JOB_TYPES },
        { key: "post_type", as: "select", options: ["local", "global"] },
        { key: "experience", as: "select", options: ["Fresher", "6 months", "1 year", "2 years", "3 years", "4 years", "5+ years"] },
        { key: "salary", as: "number" },
        { key: "working_hours" },
        { key: "skills_required" },
        { key: "tags", hint: "Comma separated" },
        { key: "disappearing_days", as: "number" },
        { key: "description", as: "text" },
      ],
    },
    {
      title: "Location",
      fields: [
        { key: "location_name" },
        { key: "reach_distance", as: "number", hint: "in km (only for local jobs)" },
        { key: "latitude", as: "number" },
        { key: "longitude", as: "number" },
      ],
    },
  ],
};

export default cfg;
