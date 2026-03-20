import { create } from 'zustand';
import { listingsAPI, matchesAPI } from '../services/api';

const useFeedStore = create((set, get) => ({
  listings: [],
  currentIndex: 0,
  isLoading: false,
  hasMore: true,
  filters: {
    district: null,
    minPrice: null,
    maxPrice: null,
    amenities: [],
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, listings: [], currentIndex: 0, hasMore: true });
  },

  resetFilters: () => {
    set({
      filters: { district: null, minPrice: null, maxPrice: null, amenities: [] },
      listings: [],
      currentIndex: 0,
      hasMore: true,
    });
  },

  fetchListings: async () => {
    const { isLoading, hasMore, filters, listings } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const params = {
        offset: listings.length,
        limit: 10,
        ...(filters.district && { district: filters.district }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.amenities.length > 0 && { amenities: filters.amenities.join(',') }),
      };

      const response = await listingsAPI.getFeed(params);
      const newListings = response.data.listings || response.data || [];

      set({
        listings: [...listings, ...newListings],
        hasMore: newListings.length === 10,
        isLoading: false,
      });
    } catch (err) {
      console.warn('Error fetching listings:', err);
      set({ isLoading: false });
    }
  },

  likeListing: async (listingId) => {
    try {
      const response = await matchesAPI.like(listingId);
      const isMatch = response.data.isMatch || false;
      set({ currentIndex: get().currentIndex + 1 });
      return { isMatch };
    } catch (err) {
      console.warn('Error liking listing:', err);
      set({ currentIndex: get().currentIndex + 1 });
      return { isMatch: false };
    }
  },

  passListing: async (listingId) => {
    try {
      await matchesAPI.pass(listingId);
    } catch (err) {
      console.warn('Error passing listing:', err);
    }
    set({ currentIndex: get().currentIndex + 1 });
  },

  superLikeListing: async (listingId) => {
    try {
      const response = await matchesAPI.superLike(listingId);
      const isMatch = response.data.isMatch || false;
      set({ currentIndex: get().currentIndex + 1 });
      return { isMatch };
    } catch (err) {
      console.warn('Error super liking listing:', err);
      set({ currentIndex: get().currentIndex + 1 });
      return { isMatch: false };
    }
  },

  getCurrentListing: () => {
    const { listings, currentIndex } = get();
    return listings[currentIndex] || null;
  },

  getUpcomingListings: (count = 3) => {
    const { listings, currentIndex } = get();
    return listings.slice(currentIndex, currentIndex + count);
  },

  refreshFeed: () => {
    set({ listings: [], currentIndex: 0, hasMore: true });
    get().fetchListings();
  },
}));

export default useFeedStore;
