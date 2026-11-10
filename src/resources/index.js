import businesses from "./businesses";
import business_upgrade_requests from "./business_upgrade_requests";
import users from "./users";
import jobs from "./jobs";
import offers from "./offers";
import payments from "./payments";
import subscription_plans from "./subscription_plans";
import {
  admin_users,
  categories,
  comments,
  contents,
  global_feeds,
  onboarding_progresses,
  otp_codes,
  reach_distance_settings,
} from "./others";

export const RESOURCES = [
  businesses,
  business_upgrade_requests,
  users,
  subscription_plans,
  jobs,
  payments,
  offers,
  admin_users,
  categories,
  comments,
  contents,
  global_feeds,
  onboarding_progresses,
  otp_codes,
  reach_distance_settings,
];

// Sidebar, in the Rails admin's menu order (feather icon names)
export const MENU = [
  { path: "dashboard", label: "Dashboard", icon: "home" },
  { path: "businesses", label: "Businesses", icon: "briefcase" },
  { path: "subscription_plans", label: "Subscription Plans", icon: "award" },
  { path: "business_upgrade_requests", label: "Upgrade Requests", icon: "trending-up" },
  { path: "users", label: "Users", icon: "users" },
  { path: "jobs", label: "Jobs", icon: "clipboard" },
  { path: "payments", label: "Payments", icon: "credit-card" },
  { path: "offers", label: "Offers", icon: "tag" },
  { path: "admin_users", label: "Admin Users", icon: "shield" },
  { path: "categories", label: "Categories", icon: "grid" },
  { path: "comments", label: "Comments", icon: "message-square" },
  { path: "contents", label: "Contents", icon: "file-text" },
  { path: "global_feeds", label: "Feeds", icon: "radio" },
  { path: "onboarding_progresses", label: "Onboarding", icon: "check-square" },
  { path: "otp_codes", label: "Otp Codes", icon: "lock" },
  { path: "reach_distance_settings", label: "Reach Distance", icon: "navigation" },
];
