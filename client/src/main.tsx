import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext"; // 👈 ADD THIS
import './i18n';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotificationProvider>   
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </NotificationProvider>
  </React.StrictMode>
);