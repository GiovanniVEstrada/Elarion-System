import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Elarion</div>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Tasks
        </NavLink>
        <NavLink to="/journal" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Journal
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Calendar
        </NavLink>
      </div>
    </nav>
  );
}