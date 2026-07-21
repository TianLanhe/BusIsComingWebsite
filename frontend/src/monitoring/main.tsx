import React from "react";
import ReactDOM from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Monitoring root element is missing");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <main aria-label="BusIsComing Pulse" />
  </React.StrictMode>,
);
