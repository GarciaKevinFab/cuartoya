import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useMatchesStore } from '../../store/matchesStore';
import { useAuthStore } from '../../store/authStore';
import {
  Home,
  Compass,
  MessageCircle,
  Building2,
  User,
  Crown,
  Plus,
  Heart,
  Shield,
  ShieldCheck,
  MapPin,
  ChevronDown,
} from 'lucide-react';

const CITIES = [
  'Huancayo', 'Tarma', 'La Oroya', 'Junin', 'Jauja', 'Concepcion', 'Chupaca',
];

const navItems = [
  { to: '/', icon: Compass, label: 'Descubrir' },
  { to: '/matches', icon: MessageCircle, label: 'Mensajes', badge: true },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/my-listings', icon: Building2, label: 'Cuartos' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function Navbar() {
  const { unreadCount } = useMatchesStore();
  const { user } = useAuthStore();
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem('cuartoya_city') || 'Huancayo'
  );

  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem('cuartoya_city', city);
    setShowCitySelector(false);
    window.dispatchEvent(new CustomEvent('cityChanged', { detail: city }));
  };

  const isVerified = user?.is_verified;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              CuartoYa
            </span>
          </Link>
        </div>

        {/* City selector */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <button
              onClick={() => setShowCitySelector(!showCitySelector)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {selectedCity}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCitySelector ? 'rotate-180' : ''}`} />
            </button>
            {showCitySelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedCity === city ? 'text-primary font-semibold bg-primary-light' : 'text-gray-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}

          {/* Verification link - only if not verified */}
          {!isVerified && (
            <NavLink
              to="/verification"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              Verificar identidad
            </NavLink>
          )}

          {/* Admin link - only for admins */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <ShieldCheck className="w-5 h-5" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* New listing button */}
        <div className="px-4 pb-3">
          <Link
            to="/listings/new"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-5 h-5" />
            Publicar cuarto
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link to="/profile" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-light overflow-hidden shrink-0">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.full_name || 'Usuario'}
                </p>
                {isVerified && (
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            {user?.plan && user.plan !== 'free' && (
              <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b border-gray-100 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-gray-900">CuartoYa</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* City selector mobile */}
            <div className="relative">
              <button
                onClick={() => setShowCitySelector(!showCitySelector)}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full"
              >
                <MapPin className="w-3 h-3 text-primary" />
                {selectedCity}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showCitySelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCitySelector(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50 w-40">
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCityChange(city)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          selectedCity === city ? 'text-primary font-semibold bg-primary-light' : 'text-gray-700'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {user?.plan && user.plan !== 'free' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <Crown className="w-3 h-3" />
                {user.plan === 'pro' ? 'Pro' : 'Agency'}
              </span>
            )}
            <Link to="/profile" className="w-8 h-8 rounded-full bg-primary-light overflow-hidden">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile spacer for fixed header */}
      <div className="lg:hidden h-14" />

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/listings/new"
            className="flex flex-col items-center gap-0.5 py-2 px-3"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center -mt-3 shadow-lg shadow-primary/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Publicar</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
