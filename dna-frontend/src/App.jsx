import { BrowserRouter, Routes, Route } from "react-router-dom";

import Search from "./pages/Search";
import KeyVault from "./pages/KeyVault";

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
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BackendLoader>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          {/* Protected routes — require JWT */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/retrieve" element={<ProtectedRoute><Retrieve /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><ViewFiles /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/sequence" element={<ProtectedRoute><SequenceViewer /></ProtectedRoute>}
            
    path="/search"
    element={
      <ProtectedRoute>
        <Search />
      </ProtectedRoute>
    }
  />

  <Route
    path="/vault"
    element={
      <ProtectedRoute>
        <KeyVault />
      </ProtectedRoute>
    }
  />
*/ /
        </Routes>
      </BrowserRouter>
    </BackendLoader>
  );
}

export default App;
