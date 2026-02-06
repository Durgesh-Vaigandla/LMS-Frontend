import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import { testFaceDetection } from "./utils/testFaceDetection.ts";

// Expose test function for debugging
if (typeof window !== "undefined") {
    (window as any).testFaceDetection = testFaceDetection;
    console.log("🧪 Test function available: window.testFaceDetection()");
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
