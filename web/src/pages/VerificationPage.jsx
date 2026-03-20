import { useState, useEffect } from 'react';
import { verificationAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Shield,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  IdCard,
} from 'lucide-react';

export default function VerificationPage() {
  const { user, updateUser } = useAuthStore();
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data } = await verificationAPI.getStatus();
      // Backend VerificationStatusResponse retorna: { is_verified, dni, full_name }
      if (data.is_verified) {
        setIsVerified(true);
        setVerificationResult({
          success: true,
          name: data.full_name || user?.full_name,
        });
      }
    } catch {
      // Not verified yet
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!/^\d{8}$/.test(dni)) {
      toast.error('El DNI debe tener exactamente 8 digitos');
      return;
    }

    setIsLoading(true);
    setVerificationResult(null);

    try {
      // Backend DNIVerifyResponse retorna: { verified, message, reniec_name, dni }
      const { data } = await verificationAPI.verifyDni(dni);
      if (data.verified) {
        setVerificationResult({
          success: true,
          name: data.reniec_name,
        });
        setIsVerified(true);
        updateUser({ is_verified: true });
        toast.success(data.message || 'Identidad verificada exitosamente');
      } else {
        setVerificationResult({
          success: false,
          error: data.message || 'No se pudo verificar tu identidad',
        });
        toast.error(data.message || 'No se pudo verificar tu identidad');
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al verificar DNI';
      setVerificationResult({ success: false, error: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verificar identidad</h1>
        <p className="text-gray-500 mt-2">
          Verifica tu identidad con tu DNI para obtener la insignia de verificado
        </p>
      </div>

      {isVerified ? (
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Identidad verificada</h2>
          {verificationResult?.name && (
            <p className="text-gray-600 mb-4">
              Nombre registrado: <span className="font-semibold">{verificationResult.name}</span>
            </p>
          )}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            Verificado por RENIEC
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              Ingresa tu numero de DNI para consultar tus datos en RENIEC y verificar tu identidad.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numero de DNI
              </label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setDni(value);
                  }}
                  placeholder="12345678"
                  maxLength={8}
                  className="input-field pl-12 text-lg tracking-widest font-mono"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ingresa los 8 digitos de tu DNI
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || dni.length !== 8}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Verificar
                </>
              )}
            </button>
          </form>

          {verificationResult && !verificationResult.success && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Error de verificacion</p>
                <p className="text-sm text-red-600 mt-0.5">{verificationResult.error}</p>
              </div>
            </div>
          )}

          {verificationResult && verificationResult.success && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">Verificacion exitosa</p>
                <p className="text-sm text-green-600 mt-0.5">
                  Nombre: <span className="font-semibold">{verificationResult.name}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Tus datos son consultados directamente con RENIEC y no se almacenan en nuestros servidores.
        </p>
      </div>
    </div>
  );
}
