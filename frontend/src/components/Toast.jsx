import { useEffect, useState } from "react";

let addToast;
let _toastSeq = 0;
const nextId = () => `t-${++_toastSeq}`;

// Module-level stable reference — never changes between renders
function showToastImpl(msg, type = "default") {
  addToast?.({ msg, type, id: nextId() });
}

export function useToastEmitter() {
  // Return the stable module-level function so hooks that depend on it
  // don't re-create their useCallback on every render
  return { showToast: showToastImpl };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };

    function onExpired() {
      showToastImpl("Session expired — signing you out.", "warn");
    }
    function onRateLimit() {
      showToastImpl("Too many requests — try again in a moment.", "warn");
    }

    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("api:ratelimit", onRateLimit);
    return () => {
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("api:ratelimit", onRateLimit);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.type === "warn" ? " toast--warn" : ""}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
