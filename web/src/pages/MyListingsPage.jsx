import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsAPI, swipesAPI } from '../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  Plus,
  Home,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  MapPin,
  Banknote,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
} from 'lucide-react';

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState('listings');
  const queryClient = useQueryClient();

  const { data: listingsData, isLoading: isLoadingListings } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.myListings().then((res) => res.data),
  });

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['pendingSwipes'],
    queryFn: () => swipesAPI.pending().then((res) => res.data),
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['listingStats'],
    queryFn: () => listingsAPI.stats().then((res) => res.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }) => swipesAPI.respond(id, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingSwipes'] });
      toast.success(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada');
    },
    onError: () => toast.error('Error al responder'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => listingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      toast.success('Cuarto eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const listings = listingsData?.listings || listingsData || [];
  // Backend retorna List[PendingSwipeResponse] directamente
  const pending = Array.isArray(pendingData) ? pendingData : (pendingData?.swipes || []);
  const stats = statsData || {};

  const tabs = [
    { key: 'listings', label: 'Mis cuartos', count: listings.length },
    { key: 'requests', label: 'Solicitudes', count: pending.length },
    { key: 'stats', label: 'Stats', count: null },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis cuartos</h1>
          <p className="text-sm text-gray-500">Gestiona tus publicaciones</p>
        </div>
        <Link to="/listings/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo cuarto</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {activeTab === 'listings' && (
        <div>
          {isLoadingListings ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="card p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                No tienes cuartos publicados
              </h3>
              <p className="text-gray-500 mb-6">
                Publica tu primer cuarto y empieza a recibir inquilinos interesados
              </p>
              <Link to="/listings/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Publicar cuarto
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="card p-4 flex gap-4">
                  {/* Photo */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/listings/${listing.id}`}
                          className="font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                          {listing.title}
                        </Link>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.district || 'Huancayo'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`badge ${listing.is_active !== false ? 'bg-green-50 text-success' : 'bg-gray-100 text-gray-500'}`}>
                          {listing.is_active !== false ? 'Activo' : 'Pausado'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-primary font-bold mt-2">
                      <Banknote className="w-4 h-4" />
                      S/{listing.price}/mes
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {listing.view_count || 0} vistas
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => {
                          if (window.confirm('Seguro que quieres eliminar este cuarto?')) {
                            deleteMutation.mutate(listing.id);
                          }
                        }}
                        className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div>
          {isLoadingPending ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                No hay solicitudes pendientes
              </h3>
              <p className="text-gray-500">
                Cuando alguien muestre interes en tu cuarto, aparecera aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="card p-4 flex items-center gap-4">
                  {/* Avatar del usuario */}
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    {req.swiper_photo ? (
                      <img src={req.swiper_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {req.swiper_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Interesado en <span className="font-medium text-gray-700">{req.listing_title || 'tu cuarto'}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {dayjs(req.created_at).fromNow()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => respondMutation.mutate({ id: req.id, action: 'reject' })}
                      disabled={respondMutation.isPending}
                      className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: req.id, action: 'accept' })}
                      disabled={respondMutation.isPending}
                      className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white hover:bg-green-700 transition-colors"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.views_total || 0}</p>
                  <p className="text-xs text-gray-500">Vistas totales</p>
                </div>
                <div className="card p-4 text-center">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.likes_given || 0}</p>
                  <p className="text-xs text-gray-500">Likes dados</p>
                </div>
                <div className="card p-4 text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.matches_count || 0}</p>
                  <p className="text-xs text-gray-500">Matches</p>
                </div>
                <div className="card p-4 text-center">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Home className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.listings_count || 0}</p>
                  <p className="text-xs text-gray-500">Publicaciones</p>
                </div>
              </div>

              {/* Per-listing stats */}
              {stats.perListing && stats.perListing.length > 0 && (
                <div className="card">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Rendimiento por cuarto</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {stats.perListing.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {item.photo ? (
                            <img src={item.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{item.views || 0} vistas</span>
                            <span className="text-xs text-gray-500">{item.likes || 0} likes</span>
                            <span className="text-xs text-gray-500">{item.matches || 0} matches</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
