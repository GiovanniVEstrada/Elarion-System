import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function GuestBanner() {
  const { isGuest } = useAuth();
  if (!isGuest) return null;

  return (
    <div className="guest-banner">
      <span>Browsing as guest — data stays in this browser only.</span>
      <div className="guest-banner-actions">
        <Link to="/register" className="guest-banner-btn guest-banner-btn--primary">Sign up free</Link>
        <Link to="/login" className="guest-banner-btn">Log in</Link>
      </div>
    </div>
  );
}
