import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  LogOut,
  Crown,
  ChevronRight,
  Shield,
  ShieldCheck,
  Bell,
  HelpCircle,
  FileText,
  Heart,
  Home,
  Eye,
  MessageCircle,
  Edit3,
  Check,
  X,
  Loader2,
  Settings,
  Star,
  UserX,
  Ban,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    district: user?.district || '',
  });
  const fileInputRef = useRef(null);

  const isVerified = user?.verified || user?.verificationStatus === 'verified';

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { data } = await authAPI.uploadAvatar(file);
      updateUser({ avatar: data.avatar || data.url });
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await authAPI.updateProfile(editData);
      updateUser(editData);
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBlockUser = async (userId) => {
    setIsBlocking(true);
    try {
      await usersAPI.block(userId);
      toast.success('Usuario bloqueado');
    } catch {
      toast.error('Error al bloquear usuario');
    } finally {
      setIsBlocking(false);
    }
  };

  const stats = [
    { icon: Eye, label: 'Vistas', value: user?.stats?.views || 0 },
    { icon: Heart, label: 'Likes', value: user?.stats?.likes || 0 },
    { icon: MessageCircle, label: 'Matches', value: user?.stats?.matches || 0 },
    { icon: Home, label: 'Cuartos', value: user?.stats?.listings || 0 },
  ];

  const menuItems = [
    {
      icon: Crown,
      label: 'Plan Premium',
      desc: user?.plan === 'pro' ? 'Plan Pro activo' : user?.plan === 'agency' ? 'Plan Agency activo' : 'Plan Gratis',
      action: () => navigate('/premium'),
      highlight: true,
    },
    ...(!isVerified ? [{
      icon: Shield,
      label: 'Verificar identidad',
      desc: 'Verifica tu DNI para obtener la insignia',
      action: () => navigate('/verification'),
      highlight: false,
      verification: true,
    }] : []),
    {
      icon: Heart,
      label: 'Mis favoritos',
      desc: 'Habitaciones guardadas',
      action: () => navigate('/favorites'),
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      desc: 'Gestiona tus alertas',
      action: () => toast('Proximamente', { icon: '🔔' }),
    },
    {
      icon: Shield,
      label: 'Privacidad y seguridad',
      desc: 'Contrasena y configuracion',
      action: () => toast('Proximamente', { icon: '🔒' }),
    },
    {
      icon: HelpCircle,
      label: 'Ayuda y soporte',
      desc: 'Preguntas frecuentes',
      action: () => toast('Proximamente', { icon: '❓' }),
    },
    {
      icon: FileText,
      label: 'Terminos y condiciones',
      desc: 'Politicas de uso',
      action: () => toast('Proximamente', { icon: '📄' }),
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-light overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="input-field py-1.5 text-lg font-bold"
              />
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Usuario'}</h2>
                {isVerified && (
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {user?.plan && user.plan !== 'free' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" fill="currentColor" />
                  {user.plan === 'pro' ? 'Pro' : 'Agency'}
                </span>
              )}
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verificado
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={handleSave}
                className="w-9 h-9 rounded-lg bg-success text-white flex items-center justify-center hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Edit fields */}
        {isEditing && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="Telefono"
                className="input-field pl-10 py-2"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={editData.district}
                onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                placeholder="Distrito"
                className="input-field pl-10 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Verification prompt */}
      {!isVerified && (
        <Link
          to="/verification"
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 hover:bg-blue-100 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 text-sm">Verifica tu identidad</p>
            <p className="text-xs text-blue-600">Obtiene la insignia de verificado con tu DNI</p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-3 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="card divide-y divide-gray-50">
        {menuItems.map(({ icon: Icon, label, desc, action, highlight, verification }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              highlight ? 'bg-yellow-50' : verification ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <Icon className={`w-5 h-5 ${
                highlight ? 'text-yellow-600' : verification ? 'text-blue-600' : 'text-gray-500'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Cerrar sesion
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">CuartoYa v1.1.0</p>
    </div>
  );
}
