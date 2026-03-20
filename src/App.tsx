import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HomePage, HostPage, AdminPage, SettingsPage } from "@/pages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page without layout */}
        <Route path="/" element={<HomePage />} />

        {/* Host routes with layout */}
        <Route element={<Layout title="Football Challenge Signup" />}>
          <Route path="/host" element={<HostPage />} />
        </Route>

        {/* Admin routes with layout */}
        <Route element={<Layout title="Football Challenge Admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Settings route with layout */}
        <Route element={<Layout title="Settings & Debug" />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
