import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/",        end: true,  icon: "⊞", label: "Home"    },
  { to: "/tasks",   end: false, icon: "✓", label: "Tasks"   },
  { to: "/journal", end: false, icon: "✎", label: "Journal" },
  { to: "/reflect", end: false, icon: "✦", label: "Reflect" },
];

export default function BottomNav() {
  const linkClass = ({ isActive }) =>
    isActive ? "bottom-nav-link active" : "bottom-nav-link";

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, end, icon, label }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          <span className="bottom-nav-icon">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
