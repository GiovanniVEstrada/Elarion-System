import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import SideDrawer from "./SideDrawer";
import TopChrome from "./TopChrome";
import { ROUTE_TITLES } from "./navItems";

export default function Navbar() {
  const { user, isGuest, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const wasOpen = useRef(false);

  const topTitle = ROUTE_TITLES[location.pathname] ?? "Luren";

  function closeDrawer() {
    setDrawerOpen(false);
  }

  // Return focus to the menu button after the drawer closes
  useEffect(() => {
    if (wasOpen.current && !drawerOpen) {
      menuBtnRef.current?.focus();
    }
    wasOpen.current = drawerOpen;
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeDrawer();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <TopChrome
        isGuest={isGuest}
        onOpen={() => setDrawerOpen(true)}
        menuBtnRef={menuBtnRef}
        title={topTitle}
        user={user}
      />

      <AnimatePresence>
        {drawerOpen && (
          <SideDrawer
            onClose={closeDrawer}
            onLogout={logout}
            user={user}
          />
        )}
      </AnimatePresence>
    </>
  );
}
