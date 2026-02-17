import Sidebar from "../components/SideBar/SideBar.jsx";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="app-shell min-h-screen bg-[#08122f] text-slate-100">
      <Sidebar />
      <main className="p-4 sm:ml-64 pt-20">
        <Outlet />
      </main>
    </div>
  );
}
