import { NavLink } from "react-router-dom";

const LEFT_TABS = [
  { to: "/tasks",   end: false, icon: "✓", label: "Actions"        },
  { to: "/journal", end: false, icon: "✎", label: "Reflection Log" },
];

const RIGHT_TABS = [
  { to: "/calendar", end: false, icon: "◫", label: "Calendar" },
  { to: "/reflect",  end: false, icon: "✦", label: "Reflect"  },
];

export default function BottomNav() {
  const linkClass = ({ isActive }) =>
    isActive ? "bottom-nav-link active" : "bottom-nav-link";

  return (
    <nav className="bottom-nav">
      {LEFT_TABS.map(({ to, end, icon, label }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          <span className="bottom-nav-icon">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}

      {/* Center Dashboard button */}
      <div className="bottom-nav-center-slot">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "bottom-nav-home active" : "bottom-nav-home"
          }
          aria-label="Alignment Center"
        >
          <span className="bottom-nav-home-icon">⌂</span>
        </NavLink>
      </div>

      {RIGHT_TABS.map(({ to, end, icon, label }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          <span className="bottom-nav-icon">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
