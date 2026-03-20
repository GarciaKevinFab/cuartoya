import { useEffect, useState, useCallback } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  X,
  Heart,
  Star,
  MapPin,
  Banknote,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Bath,
  Car,
  Zap,
  Loader2,
  RefreshCw,
  Crown,
  BedDouble,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DISTRICTS = [
  'Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'San Agustin de Cajas',
  'Hualhuas', 'San Jeronimo de Tunan', 'Sapallanga', 'Viques', 'Huancan',
];

const ROOM_TYPES = [
  { value: 'single', label: 'Individual' },
  { value: 'double', label: 'Doble' },
  { value: 'suite', label: 'Suite' },
  { value: 'shared', label: 'Compartido' },
];

const AMENITY_OPTIONS = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'bathroom', label: 'Bano privado', icon: Bath },
  { value: 'parking', label: 'Estacionamiento', icon: Car },
  { value: 'electricity', label: 'Luz incluida', icon: Zap },
];

const trans = (r, s) => `rotateZ(${r}deg) scale(${s})`;

export default function DiscoverPage() {
  const {
    listings,
    currentIndex,
    filters,
    isLoading,
    remainingLikes,
    fetchFeed,
    swipe,
    applyFilters,
    clearFilters,
  } = useFeedStore();
  const { user } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [photoIndices, setPhotoIndices] = useState({});
  const [gone] = useState(() => new Set());

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const visibleCards = listings.slice(currentIndex, currentIndex + 3);

  const [springs, api] = useSprings(visibleCards.length, (i) => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: i === 0 ? 1 : 0.95 - i * 0.03,
    opacity: 1,
    config: { friction: 50, tension: 500 },
  }));

  useEffect(() => {
    api.start((i) => ({
      x: 0,
      y: 0,
      rot: 0,
      scale: i === 0 ? 1 : 0.95 - i * 0.03,
      opacity: 1,
      immediate: false,
    }));
  }, [currentIndex, api, visibleCards.length]);

  const [dragState, setDragState] = useState({ x: 0, active: false });

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    const startX = e.clientX || e.touches?.[0]?.clientX || 0;
    const startY = e.clientY || e.touches?.[0]?.clientY || 0;

    const handleMove = (moveEvent) => {
      const currentX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX || 0;
      const currentY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY || 0;
      const dx = currentX - startX;
      const dy = currentY - startY;

      setDragState({ x: dx, active: true });
      api.start((i) => {
        if (i !== 0) return;
        return {
          x: dx,
          y: dy * 0.3,
          rot: dx * 0.08,
          scale: 1,
          immediate: true,
        };
      });
    };

    const handleUp = (upEvent) => {
      const finalX = (upEvent.clientX || upEvent.changedTouches?.[0]?.clientX || 0) - startX;
      setDragState({ x: 0, active: false });

      if (Math.abs(finalX) > 120) {
        const dir = finalX > 0 ? 'right' : 'left';
        triggerSwipe(dir);
      } else {
        api.start((i) => {
          if (i !== 0) return;
          return { x: 0, y: 0, rot: 0, scale: 1 };
        });
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleUp);
  }, [api]);

  const triggerSwipe = useCallback(async (direction) => {
    if (visibleCards.length === 0) return;
    const listing = visibleCards[0];
    const xDir = direction === 'right' ? 1 : -1;

    api.start((i) => {
      if (i !== 0) return;
      return {
        x: xDir * (window.innerWidth + 200),
        rot: xDir * 30,
        scale: 1,
        opacity: 0,
        config: { friction: 50, tension: 200 },
      };
    });

    setTimeout(async () => {
      const result = await swipe(listing._id, direction);
      if (!result.success) {
        toast.error(result.error);
      } else if (direction === 'right') {
        toast('Te interesa este cuarto', { icon: '💚' });
      }
    }, 200);
  }, [visibleCards, api, swipe]);

  const handleSuperLike = useCallback(async () => {
    if (visibleCards.length === 0) return;
    const listing = visibleCards[0];

    api.start((i) => {
      if (i !== 0) return;
      return {
        y: -window.innerHeight,
        rot: 0,
        scale: 1.1,
        opacity: 0,
        config: { friction: 50, tension: 200 },
      };
    });

    setTimeout(async () => {
      const result = await swipe(listing._id, 'super');
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast('Super Like enviado', { icon: '⭐' });
      }
    }, 200);
  }, [visibleCards, api, swipe]);

  const getPhotoIndex = (listingId) => photoIndices[listingId] || 0;

  const nextPhoto = (listingId, totalPhotos) => {
    setPhotoIndices((prev) => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) + 1) % totalPhotos,
    }));
  };

  const prevPhoto = (listingId, totalPhotos) => {
    setPhotoIndices((prev) => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) - 1 + totalPhotos) % totalPhotos,
    }));
  };

  const handleApplyFilters = () => {
    applyFilters(localFilters);
    setShowFilters(false);
  };

  const stampOpacity = Math.min(Math.abs(dragState.x) / 100, 1);

  if (isLoading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-medium">Buscando cuartos para ti...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Descubrir</h1>
          <p className="text-sm text-gray-500">Cuartos en Huancayo</p>
        </div>
        <div className="flex items-center gap-3">
          {remainingLikes !== null && (
            <div className="flex items-center gap-1.5 bg-primary-light text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
              <Heart className="w-4 h-4" />
              {remainingLikes}
            </div>
          )}
          <button
            onClick={() => setShowFilters(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full aspect-[3/4] max-h-[520px]">
        {visibleCards.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center card p-8 text-center">
            <BedDouble className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay mas cuartos</h3>
            <p className="text-gray-500 mb-6">
              Intenta cambiar tus filtros o vuelve mas tarde
            </p>
            <button onClick={() => { clearFilters(); }} className="btn-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reiniciar busqueda
            </button>
          </div>
        ) : (
          springs.map((style, i) => {
            const listing = visibleCards[i];
            if (!listing) return null;
            const photos = listing.photos || ['https://placehold.co/400x500/E8442A/white?text=CuartoYa'];
            const idx = getPhotoIndex(listing._id);
            const isTop = i === 0;

            return (
              <animated.div
                key={listing._id}
                className="absolute inset-0 will-change-transform"
                style={{
                  zIndex: visibleCards.length - i,
                  transform: interpolate([style.rot, style.scale], trans),
                  x: style.x,
                  y: style.y,
                  opacity: style.opacity,
                }}
              >
                <div
                  className="w-full h-full rounded-2xl overflow-hidden shadow-lg bg-white cursor-grab active:cursor-grabbing select-none relative"
                  onMouseDown={isTop ? handlePointerDown : undefined}
                  onTouchStart={isTop ? handlePointerDown : undefined}
                >
                  {/* Photo */}
                  <div className="relative w-full h-full">
                    <img
                      src={photos[idx]}
                      alt={listing.title}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />

                    {/* Photo indicators */}
                    {photos.length > 1 && (
                      <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
                        {photos.map((_, pi) => (
                          <div
                            key={pi}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              pi === idx ? 'bg-white' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Photo nav buttons */}
                    {isTop && photos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevPhoto(listing._id, photos.length); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 z-20"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextPhoto(listing._id, photos.length); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 z-20"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* INTERESA stamp */}
                    {isTop && (
                      <div
                        className="swipe-stamp left-6 border-success text-success rotate-[-20deg]"
                        style={{ opacity: dragState.active && dragState.x > 0 ? stampOpacity : 0 }}
                      >
                        INTERESA
                      </div>
                    )}

                    {/* PASO stamp */}
                    {isTop && (
                      <div
                        className="swipe-stamp right-6 border-red-500 text-red-500 rotate-[20deg]"
                        style={{ opacity: dragState.active && dragState.x < 0 ? stampOpacity : 0 }}
                      >
                        PASO
                      </div>
                    )}

                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-20">
                      <div className="flex items-end justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/listings/${listing._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-white text-xl font-bold hover:underline leading-tight"
                          >
                            {listing.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            {listing.district || 'Huancayo'}
                          </div>
                          {listing.amenities && listing.amenities.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {listing.amenities.slice(0, 4).map((a) => (
                                <span
                                  key={a}
                                  className="bg-white/20 backdrop-blur text-white text-xs px-2 py-0.5 rounded-full"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end ml-3">
                          <div className="flex items-center gap-1 text-white font-bold text-xl">
                            <Banknote className="w-5 h-5" />
                            S/{listing.price}
                          </div>
                          <span className="text-white/60 text-xs">/mes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </animated.div>
            );
          })
        )}
      </div>

      {/* Action buttons */}
      {visibleCards.length > 0 && (
        <div className="flex items-center justify-center gap-5 mt-6">
          <button
            onClick={() => triggerSwipe('left')}
            className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 hover:scale-110 active:scale-95 transition-all"
          >
            <X className="w-7 h-7" strokeWidth={3} />
          </button>
          <button
            onClick={handleSuperLike}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-warning hover:bg-yellow-50 hover:border-yellow-200 hover:scale-110 active:scale-95 transition-all"
          >
            <Star className="w-6 h-6" fill="currentColor" />
          </button>
          <button
            onClick={() => triggerSwipe('right')}
            className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-success hover:bg-green-50 hover:border-green-200 hover:scale-110 active:scale-95 transition-all"
          >
            <Heart className="w-7 h-7" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Premium upsell */}
      {remainingLikes !== null && remainingLikes <= 3 && (
        <Link
          to="/premium"
          className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          <Crown className="w-5 h-5" />
          Hazte Pro - Likes ilimitados
        </Link>
      )}

      {/* Filters sidebar */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Price range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rango de precio (S/)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.minPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                      className="input-field"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.maxPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Distrito
                  </label>
                  <select
                    value={localFilters.district}
                    onChange={(e) => setLocalFilters({ ...localFilters, district: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Todos los distritos</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Room type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de cuarto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOM_TYPES.map((rt) => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() =>
                          setLocalFilters({
                            ...localFilters,
                            roomType: localFilters.roomType === rt.value ? '' : rt.value,
                          })
                        }
                        className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                          localFilters.roomType === rt.value
                            ? 'border-primary bg-primary-light text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comodidades
                  </label>
                  <div className="space-y-2">
                    {AMENITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          localFilters.amenities.includes(value)
                            ? 'border-primary bg-primary-light'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.amenities.includes(value)}
                          onChange={() => {
                            const amenities = localFilters.amenities.includes(value)
                              ? localFilters.amenities.filter((a) => a !== value)
                              : [...localFilters.amenities, value];
                            setLocalFilters({ ...localFilters, amenities });
                          }}
                          className="hidden"
                        />
                        <Icon className={`w-5 h-5 ${localFilters.amenities.includes(value) ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${localFilters.amenities.includes(value) ? 'text-primary' : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setLocalFilters({ minPrice: '', maxPrice: '', district: '', roomType: '', amenities: [] });
                  }}
                  className="btn-ghost flex-1"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="btn-primary flex-1"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
