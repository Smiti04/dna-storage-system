import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotpassword";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Retrieve from "./pages/retrieve";
import ViewFiles from "./pages/viewfiles";
import SequenceViewer from "./pages/sequenceviewer";
import ChangePassword from "./pages/changepassword";
import BackendLoader from "./components/BackendLoader";

function App() {
  return (
    <BackendLoader>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/retrieve" element={<Retrieve />} />
          <Route path="/files" element={<ViewFiles />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/sequence" element={<SequenceViewer />} />
        </Routes>
      </BrowserRouter>
    </BackendLoader>
  );
}

export default App;
