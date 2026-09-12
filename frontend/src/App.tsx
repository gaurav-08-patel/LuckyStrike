import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import CampaignPage from "./pages/CampaignPage";
import DrawTerms from "./pages/DrawTerms";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import UserAgreement from "./pages/UserAgreement";
import WalletPage from "./pages/WalletPage";
import WhatsAppVerifyPage from "./pages/WhatsAppVerifyPage";
import WinnersPage from "./pages/WinnersPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/whatsapp-verify-page"
              element={<WhatsAppVerifyPage />}
            />
            <Route path="/user-agreement" element={<UserAgreement />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/draw-terms" element={<DrawTerms />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/winners" element={<WinnersPage />} />
            <Route path="/:id" element={<CampaignPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
