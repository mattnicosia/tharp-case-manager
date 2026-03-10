import React from "react";
import { createRoot } from "react-dom/client";

// Polyfill window.storage so the app can persist data via localStorage
if (!window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(key);
      return v != null ? { value: v } : null;
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
  };
}

import App from "./tharp-case-manager.jsx";

createRoot(document.getElementById("root")).render(<App />);
