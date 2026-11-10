const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const pad = (n) => String(n).padStart(2, "0");

// The API renders times like Rails: "2026-10-21T10:00:00.000+05:30"
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
export const is_date_string = (v) => typeof v === "string" && ISO_DATE.test(v);

export const to_date = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ActiveAdmin default (:long) — "October 21, 2026 10:00"
export const fmt_datetime = (v) => {
  const d = to_date(v);
  return d ? `${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
};

// strftime("%d %b %Y")
export const fmt_day = (v) => {
  const d = to_date(v);
  return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : "";
};

// strftime("%d %b %Y %H:%M")
export const fmt_day_time = (v) => {
  const d = to_date(v);
  return d ? `${fmt_day(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
};

// value for <input type="datetime-local">
export const to_local_input = (v) => {
  const d = to_date(v);
  return d
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    : "";
};

// Rails human_attribute_name: "created_at" -> "Created at", "user_id" -> "User"
export const humanize = (key) => {
  const s = String(key).replace(/_id$/, "").replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// "full_time" -> "Full Time"
export const titleize = (s) =>
  s
    ? String(s)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

export const capitalize = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");

export const short_id = (id) => (id ? String(id).slice(-6) : "");

export const rupees = (n) =>
  n === null || n === undefined || n === "" ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const human_size = (bytes) => {
  if (bytes === null || bytes === undefined) return "";
  const units = ["Bytes", "KB", "MB", "GB"];
  let n = Number(bytes);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
};

export const is_blank = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
