import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installDiagnosticsFetchObserver, QualityShell } from "./quality";
import "./design-system/index.css";
import "./styles.css";
import "./quality/quality.css";

installDiagnosticsFetchObserver();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><QualityShell><App /></QualityShell></React.StrictMode>,
);

import "./product-brain-studio.css";

import "./proposal-studio.css";

import "./platform-health.css";

import "./gift-brain-studio.css";

import "./proposal-brain-studio.css";

import "./brain-orchestrator-studio.css";

import "./conversation-studio.css";

import "./memory-brain-studio.css";

import "./emotion-brain-studio.css";

import "./intent-brain-studio.css";

import "./brain-intelligence-studio.css";

import "./interest-brain-studio.css";

import "./functional-test-console.css";

import "./product-admin.css";

import "./admin-shell.css";
