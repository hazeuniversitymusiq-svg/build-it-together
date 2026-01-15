import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installNativeErrorOverlay } from "./lib/debug/nativeErrorOverlay";

installNativeErrorOverlay();

createRoot(document.getElementById("root")!).render(<App />);
