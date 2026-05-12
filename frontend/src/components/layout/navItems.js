export const NAV_ITEMS = [
  { to: "/",         label: "Today",      detail: "Home",   icon: "T", end: true  },
  { to: "/calendar", label: "Month",      detail: "Pool grid",  icon: "M", end: false },
  { to: "/habits",   label: "Habits",     detail: "Currents",   icon: "H", end: false },
  { to: "/journal",  label: "Reflect Log",detail: "Entries",    icon: "R", end: false },
  { to: "/reflect",  label: "Insights",   detail: "Weekly",     icon: "I", end: false },
  { to: "/settings", label: "Settings",   detail: "Account",    icon: "S", end: false },
];

export const ROUTE_TITLES = {
  "/":         "Today",
  "/calendar": "Calendar",
  "/habits":   "Habits",
  "/journal":  "Reflect Log",
  "/reflect":  "Insights",
  "/settings": "Settings",
};

export function getInitial(user) {
  return (user?.name || user?.email || "E").slice(0, 1).toUpperCase();
}
