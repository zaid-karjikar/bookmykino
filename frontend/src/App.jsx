import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MoviePage from "./pages/MoviePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MoviePage />} />
      </Routes>
    </BrowserRouter>
  );
}