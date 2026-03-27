import Sidebar from "../components/SideBar/SideBar.jsx";
import { Outlet, useLocation } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const isCollectorRoute = location.pathname.startsWith("/cobrador");

  return (
    <div className="app-shell min-h-screen bg-[#08122f] text-slate-100">
      <Sidebar />
      <main className={`${isCollectorRoute ? "pb-28" : "pb-4"} p-4 pt-20 sm:ml-64 sm:pb-4`}>
        <Outlet />
      </main>
    </div>
  );
}
