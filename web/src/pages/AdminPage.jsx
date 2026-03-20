import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { adminAPI, listingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  Flag,
  Building2,
  TrendingUp,
  UserCheck,
  Handshake,
  DollarSign,
  Search,
  Ban,
  UserX,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'reports', label: 'Reportes', icon: Flag },
  { id: 'listings', label: 'Publicaciones', icon: Building2 },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadTabData(activeTab);
  }, [activeTab, user]);

  const loadTabData = async (tab) => {
    setIsLoading(true);
    try {
      switch (tab) {
        case 'dashboard': {
          const { data } = await adminAPI.stats();
          setStats(data);
          break;
        }
        case 'users': {
          const { data } = await adminAPI.users(usersPage);
          setUsers(data.users || data || []);
          break;
        }
        case 'reports': {
          const { data } = await adminAPI.reports();
          setReports(data.reports || data || []);
          break;
        }
        case 'listings': {
          const { data } = await listingsAPI.feed({ limit: 50 });
          setListings(data.listings || data || []);
          break;
        }
      }
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId, userName, isBanned) => {
    if (isBanned) {
      setActionLoading(userId);
      try {
        await adminAPI.banUser(userId, '');
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, banned: false } : u))
        );
        toast.success(`Usuario desbaneado`);
      } catch {
        toast.error('Error al desbanear usuario');
      } finally {
        setActionLoading(null);
      }
      return;
    }

    const reason = prompt(`Motivo para banear a ${userName}:`);
    if (!reason) return;

    setActionLoading(userId);
    try {
      await adminAPI.banUser(userId, reason);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, banned: true } : u))
      );
      toast.success(`Usuario baneado`);
    } catch {
      toast.error('Error al banear usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    setActionLoading(reportId);
    try {
      await adminAPI.resolveReport(reportId, action);
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' } : r
        )
      );
      toast.success(action === 'resolve' ? 'Reporte resuelto' : 'Reporte descartado');
    } catch {
      toast.error('Error al procesar reporte');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Seguro que quieres eliminar esta publicacion?')) return;
    setActionLoading(listingId);
    try {
      await listingsAPI.delete(listingId);
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.success('Publicacion eliminada');
    } catch {
      toast.error('Error al eliminar publicacion');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (user?.role !== 'admin') return null;

  const statCards = stats
    ? [
        { label: 'Usuarios', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-500 bg-blue-50' },
        { label: 'Publicaciones', value: stats.totalListings || 0, icon: Building2, color: 'text-green-500 bg-green-50' },
        { label: 'Matches', value: stats.totalMatches || 0, icon: Handshake, color: 'text-purple-500 bg-purple-50' },
        { label: 'Ingresos', value: `S/${stats.revenue || 0}`, icon: DollarSign, color: 'text-amber-500 bg-amber-50' },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 bg-gray-900 flex-col fixed left-64 top-0 bottom-0 z-20">
        <div className="px-5 py-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed top-14 left-0 right-0 bg-white border-b border-gray-200 z-20 flex overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 lg:ml-60">
        <div className="p-6 lg:p-8 mt-12 lg:mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <button
                      onClick={() => loadTabData('dashboard')}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Actualizar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  {stats?.recentActivity && stats.recentActivity.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-4">Actividad reciente</h3>
                      <div className="space-y-3">
                        {stats.recentActivity.map((activity, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">
                                {activity.description || activity.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {activity.time || activity.createdAt}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="input-field pl-12"
                      />
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredUsers.map((u) => (
                            <tr key={u._id} className="hover:bg-gray-50">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                                    {u.avatar ? (
                                      <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <Users className="w-4 h-4 text-primary" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                  u.role === 'owner' ? 'bg-blue-50 text-blue-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {u.role === 'admin' ? 'Admin' : u.role === 'owner' ? 'Propietario' : 'Inquilino'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  u.banned ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                }`}>
                                  {u.banned ? 'Baneado' : 'Activo'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {u.role !== 'admin' && (
                                  <button
                                    onClick={() => handleBanUser(u._id, u.name, u.banned)}
                                    disabled={actionLoading === u._id}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                      u.banned
                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                  >
                                    {actionLoading === u._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : u.banned ? (
                                      <UserCheck className="w-3 h-3" />
                                    ) : (
                                      <Ban className="w-3 h-3" />
                                    )}
                                    {u.banned ? 'Desbanear' : 'Banear'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No se encontraron usuarios
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => {
                        setUsersPage((p) => Math.max(1, p - 1));
                        loadTabData('users');
                      }}
                      disabled={usersPage <= 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">Pagina {usersPage}</span>
                    <button
                      onClick={() => {
                        setUsersPage((p) => p + 1);
                        loadTabData('users');
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
                    <button
                      onClick={() => loadTabData('reports')}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Actualizar
                    </button>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reportado por</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reports.map((r) => (
                            <tr key={r._id} className="hover:bg-gray-50">
                              <td className="px-5 py-4 text-sm text-gray-900">{r.reporter?.name || r.reporterName || 'Usuario'}</td>
                              <td className="px-5 py-4 text-sm text-gray-600">{r.reason}</td>
                              <td className="px-5 py-4">
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  {r.targetType || 'listing'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  r.status === 'resolved' ? 'bg-green-50 text-green-600' :
                                  r.status === 'dismissed' ? 'bg-gray-100 text-gray-500' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {r.status === 'resolved' ? 'Resuelto' :
                                   r.status === 'dismissed' ? 'Descartado' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {(!r.status || r.status === 'pending') && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleResolveReport(r._id, 'resolve')}
                                      disabled={actionLoading === r._id}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                    >
                                      {actionLoading === r._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      Resolver
                                    </button>
                                    <button
                                      onClick={() => handleResolveReport(r._id, 'dismiss')}
                                      disabled={actionLoading === r._id}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Descartar
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {reports.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No hay reportes pendientes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Publicaciones</h2>
                    <button
                      onClick={() => loadTabData('listings')}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Actualizar
                    </button>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Publicacion</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Distrito</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Propietario</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {listings.map((l) => (
                            <tr key={l._id} className="hover:bg-gray-50">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    {l.photos?.[0] ? (
                                      <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{l.title}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-gray-900">S/{l.price}</td>
                              <td className="px-5 py-4 text-sm text-gray-500">{l.district || '-'}</td>
                              <td className="px-5 py-4 text-sm text-gray-500">{l.owner?.name || '-'}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => navigate(`/listings/${l._id}`)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Ver
                                  </button>
                                  <button
                                    onClick={() => handleDeleteListing(l._id)}
                                    disabled={actionLoading === l._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    {actionLoading === l._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {listings.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No hay publicaciones
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
