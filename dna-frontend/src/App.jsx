import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotpassword";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Retrieve from "./pages/retrieve";
import ViewFiles from "./pages/viewfiles";
import SequenceViewer from "./pages/sequenceviewer";

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
        <Route path="/sequence" element={<SequenceViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;