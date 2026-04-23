import { useEffect, useState } from "react";

let addToast;

export function useToastEmitter() {
  return { showToast: (msg, type = "default") => addToast?.({ msg, type, id: Date.now() }) };
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
      addToast({ msg: "Session expired — signing you out.", type: "warn", id: Date.now() });
    }
    function onRateLimit() {
      addToast({ msg: "Too many requests — try again in a moment.", type: "warn", id: Date.now() });
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
