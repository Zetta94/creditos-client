import { useEffect, useMemo, useState } from "react";
import { HiCash, HiCheckCircle, HiSwitchHorizontal, HiTrendingUp, HiUserGroup, HiSearch, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { fetchMyReports } from "../services/reportsService";
import Pagination from "../components/Pagination";
import ReportActivityCalendar from "../components/ReportActivityCalendar";

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function ReportesCobrador() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportesFiltrados, setReportesFiltrados] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetchMyReports({ page: 1, pageSize: 1000 })
      .then(res => {
        setReportes(Array.isArray(res?.data?.data) ? res.data.data : []);
        setError(null);
      })
      .catch(() => setError("No se pudieron cargar los reportes"))
      .finally(() => setLoading(false));
  }, []);

  const mesesDisponibles = useMemo(() => {
    if (!reportes.length) return [];
    const meses = reportes.map((r) => new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" }));
    return [...new Set(meses)];
  }, [reportes]);

  useEffect(() => {
    if (!reportes.length) return setReportesFiltrados([]);
    let filtrados = reportes;
    if (filtroMes !== "todos") filtrados = filtrados.filter((r) => new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" }) === filtroMes);
    if (filtroDia) filtrados = filtrados.filter((r) => r.fechaDeReporte.slice(0, 10) === filtroDia);
    filtrados = filtrados.sort((a, b) => new Date(b.fechaDeReporte) - new Date(a.fechaDeReporte));
    setReportesFiltrados(filtrados);
  }, [filtroMes, filtroDia, reportes]);

  useEffect(() => { setPage(1); }, [filtroMes, filtroDia, reportes.length]);

  const totalItems = reportesFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const reportesPaginados = reportesFiltrados.slice(pageStart, pageStart + pageSize);

  const resumenTarjetas = [
    { label: "Total efectivo", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.efectivo || 0), 0).toLocaleString("es-AR")}`, icon: HiCash, color: "#1A6B36", bg: "#E8F8ED" },
    { label: "Total MP", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.mercadopago || 0), 0).toLocaleString("es-AR")}`, icon: HiCheckCircle, color: "#004299", bg: "#EBF3FF" },
    { label: "Transferencias", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.transferencia || 0), 0).toLocaleString("es-AR")}`, icon: HiSwitchHorizontal, color: "#5C2B8C", bg: "#F5EAFF" },
    { label: "Total recaudado", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.total || 0), 0).toLocaleString("es-AR")}`, icon: HiTrendingUp, color: "#7C4A00", bg: "#FFF3E0" },
    { label: "Clientes visitados", value: reportesFiltrados.reduce((sum, r) => sum + Number(r.clientsVisited || 0), 0).toLocaleString("es-AR"), icon: HiUserGroup, color: "#004299", bg: "#EBF3FF" },
  ];

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />)}
    </div>
  );
  if (error) return <div style={{ padding: "40px", textAlign: "center", color: "#8B0000", fontSize: "15px" }}>{error}</div>;

  return (
    <div className="min-h-screen bg-[#060b1d] text-white" 
         style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)", backgroundAttachment: "fixed" }}>
      
      <div className="mx-auto max-w-2xl px-4 py-8 pb-32 animate-fade-in space-y-6">
        
        {/* ── Header & Filtros ── */}
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Mi Actividad</p>
              <h1 className="text-3xl font-black tracking-tight text-white">Historial</h1>
            </div>
            <span className="text-[10px] font-bold text-slate-600 italic">{totalItems} jornadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Filtrar Mes</label>
              <select 
                value={filtroMes} 
                onChange={(e) => setFiltroMes(e.target.value)}
                className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-sm text-white font-bold appearance-none focus:border-blue-500/50 outline-none"
              >
                <option value="todos" className="bg-slate-900">Todos los meses</option>
                {mesesDisponibles.map((mes) => (
                  <option key={mes} value={mes} className="bg-slate-900">{mes.charAt(0).toUpperCase() + mes.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Día Específico</label>
              <input 
                type="date" 
                value={filtroDia} 
                onChange={(e) => setFiltroDia(e.target.value)}
                className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-sm text-white font-bold focus:border-blue-500/50 outline-none color-scheme-dark"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {(filtroMes !== "todos" || filtroDia) && (
            <button
              onClick={() => { setFiltroMes("todos"); setFiltroDia(""); }}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <HiX className="h-4 w-4" /> Limpiar Filtros
            </button>
          )}
        </div>

        {/* ── KPIs Summary ── */}
        {reportesFiltrados.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resumenTarjetas.map((item) => (
              <div key={item.label} className="rounded-3xl bg-white/5 border border-white/10 p-4 backdrop-blur-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 opacity-30" style={{ color: item.color }} />
                </div>
                <p className="text-md font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Calendario ── */}
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-4 backdrop-blur-2xl">
          <ReportActivityCalendar
            reports={reportes}
            title="Agenda de Actividad"
            darkSurface={true}
            onReportClick={(report) => navigate(`/cobrador/reportes/${report.id}`)}
          />
        </div>

        {/* ── Listado ── */}
        <div className="space-y-4">
          <div className="px-2">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Listado de Jornadas</h2>
          </div>

          {reportesPaginados.length === 0 ? (
            <div className="py-20 text-center rounded-[32px] bg-white/5 border border-white/10">
              <p className="text-sm text-slate-500 font-bold italic">No se encontraron reportes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportesPaginados.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/cobrador/reportes/${r.id}`)}
                  className="w-full text-left rounded-[32px] bg-white/5 border border-white/10 p-6 backdrop-blur-2xl shadow-xl hover:bg-white/[0.08] transition-all active:scale-98 group flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <HiTrendingUp className="h-20 w-20" />
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <p className="text-xl font-black text-white tracking-tight">
                        {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { weekday: "long" }).toUpperCase()}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <HiSearch className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-emerald-500/70 uppercase mb-1">EFECTIVO</p>
                      <p className="text-md font-black text-emerald-400">${Number(r.efectivo || 0).toLocaleString("es-AR")}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-blue-500/70 uppercase mb-1">DIGITAL</p>
                      <p className="text-md font-black text-blue-400">${Number((Number(r.mercadopago || 0) + Number(r.transferencia || 0))).toLocaleString("es-AR")}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">VISITAS</p>
                      <p className="text-md font-black text-white">{r.clientsVisited}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total de la jornada</p>
                    <p className="text-xl font-black text-white tracking-tighter">${Number(r.total || 0).toLocaleString("es-AR")}</p>
                  </div>
                </button>
              ))}

              <div className="pt-4 px-2">
                <Pagination
                  page={safePage} pageSize={pageSize}
                  totalItems={totalItems} totalPages={totalPages}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  variant="dark"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
