import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Home,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Ingresa tu correo electronico');
      return;
    }

    setIsLoading(true);
    try {
      // authAPI.forgotPassword espera { email } como objeto
      await authAPI.forgotPassword({ email });
      setIsSent(true);
    } catch {
      // Show success anyway to prevent email enumeration
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900">CuartoYa</span>
        </div>

        <div className="card p-8">
          {isSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Correo enviado</h2>
              <p className="text-gray-500 mb-6">
                Revisa tu bandeja de entrada. Te hemos enviado un enlace para restablecer tu contrasena.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Si no encuentras el correo, revisa tu carpeta de spam.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Recuperar contrasena
              </h2>
              <p className="text-gray-500 mb-6">
                Ingresa tu correo electronico y te enviaremos instrucciones para restablecer tu contrasena.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electronico"
                    className="input-field pl-12"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar enlace de recuperacion
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
