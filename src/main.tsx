import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DesignSystemProvider } from "./context/DesignSystemContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DesignSystemProvider>
        <App />
      </DesignSystemProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
