import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import App from "./App";

import "./styles/dashboard-enhanced.css";
import "./index.scss";
import "react-toastify/dist/ReactToastify.css";
import "./styles/toast.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastContainer
      position="top-right"
      autoClose={4000}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      limit={3}
    />
    <App />
  </React.StrictMode>
);
