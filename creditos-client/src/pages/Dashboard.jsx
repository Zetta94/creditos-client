import Sidebar from "../components/SideBar/SideBar.jsx";
import { Outlet, useLocation } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const isCollectorRoute = location.pathname.startsWith("/cobrador");

  return (
    <div className="app-shell min-h-screen" style={{ background: "var(--ios-bg)", color: "var(--ios-label)" }}>
      <Sidebar />
      {/* En mobile siempre hay bottom nav flotante, hay que darle espacio al contenido */}
      <main
        className="sm:ml-64"
        style={{
          paddingTop: "64px",
          paddingBottom: "calc(88px + max(12px, env(safe-area-inset-bottom)))",
          paddingLeft: "0",
          paddingRight: "0",
          minHeight: "100vh",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 sm:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
