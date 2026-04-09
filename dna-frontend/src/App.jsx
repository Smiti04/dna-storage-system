import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Retrieve from "./pages/retrieve";
import ViewFiles from "./pages/viewfiles";
import SequenceViewer from "./pages/sequenceviewer"; // ← added

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/retrieve" element={<Retrieve />} />
        <Route path="/files" element={<ViewFiles />} />
        <Route path="/sequence" element={<SequenceViewer />} /> {/* ← added */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;