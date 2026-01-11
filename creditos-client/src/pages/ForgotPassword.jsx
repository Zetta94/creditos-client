import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { HiArrowLeft, HiEnvelope, HiCheckCircle } from "react-icons/hi2";
import api from "../api";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Por favor ingresa tu email");
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/request-reset", { email });

            setSent(true);
            toast.success("Revisa tu email para el enlace de recuperación");

            // Redirigir después de 5 segundos
            setTimeout(() => {
                navigate("/login");
            }, 5000);
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "Error al enviar email");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-600 mb-4">¡Email Enviado!</h2>
                    <p className="text-gray-600 mb-6">
                        Si la cuenta existe, recibirás un enlace de recuperación en tu email.
                        El enlace expirará en 1 hora por razones de seguridad.
                    </p>
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            <p className="font-medium mb-1">💡 Consejo:</p>
                            <p>Revisa también tu carpeta de spam si no ves el email.</p>
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Volver a Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <HiEnvelope className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
                        <p className="text-sm text-gray-600">Te enviaremos un email con el link</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Registrado
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                    >
                        {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <p className="font-medium mb-1">📧 Recibirás un email con:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Un enlace único para cambiar tu contraseña</li>
                        <li>El enlace expirará en 1 hora por seguridad</li>
                        <li>No compartas el enlace con nadie</li>
                    </ul>
                </div>

                {/* Back to login */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate("/login")}
                        className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 transition"
                    >
                        <HiArrowLeft className="w-4 h-4" />
                        Volver a Login
                    </button>
                </div>
            </div>
        </div>
    );
}
