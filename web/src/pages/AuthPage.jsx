import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Home,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  UserSearch,
} from 'lucide-react';

const DISTRICTS = [
  'Huancayo',
  'El Tambo',
  'Chilca',
  'Pilcomayo',
  'San Agustin de Cajas',
  'Hualhuas',
  'San Jeronimo de Tunan',
  'Sapallanga',
  'Viques',
  'Huancan',
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('tenant');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    district: '',
  });

  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        toast.success('Bienvenido a CuartoYa');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Completa todos los campos obligatorios');
        return;
      }
      const result = await register({ ...formData, role });
      if (result.success) {
        toast.success('Cuenta creada exitosamente');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-hover relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Home className="w-7 h-7" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">CuartoYa</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Encuentra tu cuarto ideal en Huancayo
          </h1>
          <p className="text-xl text-white/80 leading-relaxed max-w-md">
            Conectamos inquilinos y propietarios de forma rapida y segura.
            Desliza, conecta y mudarte nunca fue tan facil.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-white/70 mt-1">Cuartos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1.2k</div>
              <div className="text-sm text-white/70 mt-1">Usuarios</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">300+</div>
              <div className="text-sm text-white/70 mt-1">Matches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900">CuartoYa</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Inicia sesion' : 'Crea tu cuenta'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin
              ? 'Ingresa tus datos para continuar'
              : 'Registrate y encuentra tu cuarto ideal'}
          </p>

          {/* Role tabs (only on register) */}
          {!isLogin && (
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('tenant')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  role === 'tenant'
                    ? 'border-primary bg-primary-light text-primary font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <UserSearch className="w-5 h-5" />
                Soy inquilino
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  role === 'owner'
                    ? 'border-primary bg-primary-light text-primary font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Soy propietario
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name - only on register */}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  className="input-field pl-12"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo electronico"
                className="input-field pl-12"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Contrasena"
                className="input-field pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Phone - only on register */}
            {!isLogin && (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Telefono (opcional)"
                  className="input-field pl-12"
                />
              </div>
            )}

            {/* District - only for tenants on register */}
            {!isLogin && role === 'tenant' && (
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="input-field text-gray-500"
              >
                <option value="">Distrito de preferencia</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Iniciar sesion' : 'Crear cuenta'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', name: '', phone: '', district: '' });
              }}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>No tienes cuenta? <span className="font-semibold text-primary">Registrate</span></>
              ) : (
                <>Ya tienes cuenta? <span className="font-semibold text-primary">Inicia sesion</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
