import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Heart,
  MapPin,
  Banknote,
  Loader2,
  Bookmark,
} from 'lucide-react';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data } = await favoritesAPI.list();
      setFavorites(data.favorites || data || []);
    } catch {
      toast.error('Error al cargar favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (e, listingId) => {
    e.stopPropagation();
    setRemovingId(listingId);
    try {
      await favoritesAPI.remove(listingId);
      setFavorites((prev) => prev.filter((f) => {
        const id = f._id || f.listing?._id || f.listingId;
        return id !== listingId;
      }));
      toast.success('Eliminado de favoritos');
    } catch {
      toast.error('Error al eliminar de favoritos');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-medium">Cargando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis favoritos</h1>
          <p className="text-sm text-gray-500">
            {favorites.length} {favorites.length === 1 ? 'habitacion guardada' : 'habitaciones guardadas'}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes habitaciones guardadas</h3>
          <p className="text-gray-500 mb-6">
            Guarda las habitaciones que te interesen para verlas mas tarde
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary inline-flex items-center gap-2"
          >
            Explorar habitaciones
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item) => {
            const listing = item.listing || item;
            const listingId = listing._id || item.listingId;
            const photos = listing.photos?.length > 0
              ? listing.photos
              : ['https://placehold.co/400x300/E8442A/white?text=CuartoYa'];

            return (
              <div
                key={listingId}
                onClick={() => navigate(`/listings/${listingId}`)}
                className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={photos[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => handleRemove(e, listingId)}
                    disabled={removingId === listingId}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    {removingId === listingId ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                    )}
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{listing.district || 'Huancayo'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-lg mt-2">
                    <Banknote className="w-5 h-5" />
                    S/{listing.price}
                    <span className="text-gray-400 text-xs font-normal">/mes</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
