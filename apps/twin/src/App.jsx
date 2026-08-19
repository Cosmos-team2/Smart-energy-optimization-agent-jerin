import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeroPage from "./hero/HeroPage.jsx";
import Twin from "./Twin.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/twin" element={<Twin />} />
      </Routes>
    </BrowserRouter>
  );
}
