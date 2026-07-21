import React from "react";
import ReactDOM from "react-dom/client";
import { FilterProvider } from "./app/FilterProvider";
import { MonitoringApp } from "./app/MonitoringApp";
import { MonitoringI18nProvider } from "./app/MonitoringI18nProvider";
import "./styles/tokens.css";
import "./styles/dashboard.css";
import "./styles/responsive.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Monitoring root element is missing");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <MonitoringI18nProvider>
      <FilterProvider>
        <MonitoringApp />
      </FilterProvider>
    </MonitoringI18nProvider>
  </React.StrictMode>,
);
