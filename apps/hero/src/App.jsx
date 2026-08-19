import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeroPage from "./HeroPage.jsx";
import FacilitiesPlaceholder from "./FacilitiesPlaceholder.jsx";

// The operational Digital Twin (previously "/twin" here) now lives in the
// sibling app apps/twin — a separate deployable, not a route of this app.
// See README.md for how the two are meant to integrate.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/facilities" element={<FacilitiesPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
