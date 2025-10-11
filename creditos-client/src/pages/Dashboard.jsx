import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Sidebar />
      <main className="p-4 sm:ml-64 pt-20">
        <Outlet />
      </main>
    </div>
  );
}
