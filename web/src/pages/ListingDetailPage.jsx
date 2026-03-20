import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsAPI, swipesAPI, favoritesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ReportModal from '../components/common/ReportModal';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Bath,
  Car,
  Zap,
  Tv,
  AirVent,
  WashingMachine,
  CookingPot,
  Sofa,
  Lock,
  Droplets,
  User,
  Phone,
  Mail,
  Calendar,
  Home,
  BedDouble,
  Ruler,
  CheckCircle2,
  Shield,
  Bookmark,
  Flag,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const AMENITY_ICONS = {
  wifi: Wifi,
  bathroom: Bath,
  parking: Car,
  electricity: Zap,
  tv: Tv,
  ac: AirVent,
  laundry: WashingMachine,
  kitchen: CookingPot,
  furnished: Sofa,
  security: Lock,
  water: Droplets,
};

const AMENITY_LABELS = {
  wifi: 'WiFi',
  bathroom: 'Bano privado',
  parking: 'Estacionamiento',
  electricity: 'Luz incluida',
  tv: 'TV Cable',
  ac: 'Aire acondicionado',
  laundry: 'Lavanderia',
  kitchen: 'Cocina',
  furnished: 'Amoblado',
  security: 'Seguridad',
  water: 'Agua 24h',
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getById(id).then((res) => res.data),
  });

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesion para dar like');
      navigate('/login');
      return;
    }
    setIsLiking(true);
    try {
      await swipesAPI.swipe({ listing_id: id, direction: 'right' });
      toast.success('Interes enviado al propietario');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar interes');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: listing?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesion para guardar');
      navigate('/login');
      return;
    }
    setIsSaving(true);
    try {
      if (isSaved) {
        await favoritesAPI.remove(id);
        setIsSaved(false);
        toast.success('Eliminado de favoritos');
      } else {
        await favoritesAPI.add(id);
        setIsSaved(true);
        toast.success('Guardado en favoritos');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Home className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Cuarto no encontrado</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  const photos = listing.photos?.length > 0
    ? listing.photos
    : ['https://placehold.co/800x500/E8442A/white?text=CuartoYa'];

  const ownerVerified = listing.owner?.verified || listing.owner?.verificationStatus === 'verified';

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Photo gallery */}
      <div className="relative w-full aspect-[16/10] bg-gray-100">
        <img
          src={photos[photoIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleToggleSave}
            disabled={isSaving}
            className={`w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors ${
              isSaved
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            )}
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-sm hover:bg-primary-hover"
          >
            <Heart className="w-5 h-5" fill="currentColor" />
          </button>
        </div>

        {/* Photo navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Photo counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
          {photoIndex + 1} / {photos.length}
        </div>

        {/* Photo dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setPhotoIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === photoIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-0 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{listing.address || listing.district || 'Huancayo'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <Banknote className="w-6 h-6" />
                    S/{listing.price}
                  </div>
                  <span className="text-sm text-gray-400">/mes</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {listing.roomType && (
                  <span className="badge bg-primary-light text-primary">
                    <BedDouble className="w-3.5 h-3.5 mr-1" />
                    {listing.roomType === 'single' ? 'Individual' : listing.roomType === 'double' ? 'Doble' : listing.roomType === 'suite' ? 'Suite' : 'Compartido'}
                  </span>
                )}
                {listing.size && (
                  <span className="badge bg-blue-50 text-blue-600">
                    <Ruler className="w-3.5 h-3.5 mr-1" />
                    {listing.size} m2
                  </span>
                )}
                {listing.available && (
                  <span className="badge bg-green-50 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Descripcion</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description || 'Sin descripcion disponible.'}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Comodidades</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                    const label = AMENITY_LABELS[amenity] || amenity;
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rules */}
            {listing.rules && listing.rules.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Reglas del cuarto</h3>
                <ul className="space-y-2">
                  {listing.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <span className="text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Report button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Reportar publicacion
            </button>
          </div>

          {/* Sidebar - owner info */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Propietario</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                  {listing.owner?.avatar ? (
                    <img src={listing.owner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900">{listing.owner?.name || 'Propietario'}</p>
                    {ownerVerified && (
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Miembro desde {dayjs(listing.owner?.createdAt).format('MMM YYYY')}
                  </p>
                </div>
              </div>

              {ownerVerified && (
                <div className="flex items-center gap-2 mb-4 bg-blue-50 px-3 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">Identidad verificada</span>
                </div>
              )}

              {listing.owner?.phone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                  <Phone className="w-4 h-4" />
                  {listing.owner.phone}
                </div>
              )}

              {listing.owner?.responseRate && (
                <div className="text-xs text-gray-500 mb-4">
                  Tasa de respuesta: {listing.owner.responseRate}%
                </div>
              )}

              <button
                onClick={handleLike}
                disabled={isLiking}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Me interesa
              </button>

              <button
                onClick={handleToggleSave}
                disabled={isSaving}
                className="btn-ghost w-full flex items-center justify-center gap-2 mt-2"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-primary' : ''}`} />
                )}
                {isSaved ? 'Guardado' : 'Guardar'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Publicado {dayjs(listing.createdAt).fromNow?.() || dayjs(listing.createdAt).format('DD/MM/YYYY')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="listing"
        targetId={id}
      />
    </div>
  );
}
