import { create } from 'zustand';
import { listingsAPI, swipesAPI } from '../services/api';

export const useFeedStore = create((set, get) => ({
  listings: [],
  currentIndex: 0,
  filters: {
    city: localStorage.getItem('cuartoya_city') || 'Huancayo',
    minPrice: '',
    maxPrice: '',
    district: '',
    roomType: '',
    amenities: [],
  },
  isLoading: false,
  hasMore: true,
  remainingLikes: null,

  fetchFeed: async () => {
    const { filters, isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const params = {};
      if (filters.city) params.city = filters.city.toLowerCase().replace(/ /g, '_');
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.district) params.district = filters.district;
      if (filters.roomType) params.room_type = filters.roomType;
      if (filters.amenities.length > 0) params.amenities = filters.amenities.join(',');

      const { data } = await listingsAPI.feed(params);
      set({
        listings: data.listings || [],
        currentIndex: 0,
        hasMore: data.has_more ?? false,
        remainingLikes: data.remaining_likes ?? null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, listings: [] });
    }
  },

  swipe: async (listingId, direction) => {
    const { currentIndex, listings, remainingLikes } = get();

    try {
      // Convertir direction del UI a action del backend
      const actionMap = { right: 'like', left: 'nope', up: 'super_like' };
      await swipesAPI.swipe({
        listing_id: listingId,
        action: actionMap[direction] || direction,
      });

      const newRemaining = direction === 'right' && remainingLikes !== null
        ? remainingLikes - 1
        : remainingLikes;

      set({
        currentIndex: currentIndex + 1,
        remainingLikes: newRemaining,
      });

      if (currentIndex + 1 >= listings.length - 2) {
        get().fetchFeed();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al hacer swipe',
      };
    }
  },

  resetFeed: () => {
    set({ listings: [], currentIndex: 0, hasMore: true });
    get().fetchFeed();
  },

  applyFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    get().resetFeed();
  },

  clearFilters: () => {
    set({
      filters: {
        city: localStorage.getItem('cuartoya_city') || 'Huancayo',
        minPrice: '',
        maxPrice: '',
        district: '',
        roomType: '',
        amenities: [],
      },
    });
    get().resetFeed();
  },
}));
