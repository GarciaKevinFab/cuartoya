import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ListingSwipeCard from '../components/ListingSwipeCard';
import useFeedStore from '../store/feedStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 300;

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Habitacion amoblada cerca a la UNCP',
    price: 350,
    district: 'El Tambo',
    images: [],
    amenities: ['wifi', 'furnished', 'bathroom', 'kitchen'],
    verified: true,
    boosted: true,
    ownerName: 'Maria Garcia',
    photoCount: 6,
  },
  {
    id: '2',
    title: 'Cuarto amplio con bano privado',
    price: 420,
    district: 'Huancayo Centro',
    images: [],
    amenities: ['wifi', 'bathroom', 'security', 'laundry'],
    verified: true,
    boosted: false,
    ownerName: 'Carlos Lopez',
    photoCount: 4,
  },
  {
    id: '3',
    title: 'Mini departamento para estudiante',
    price: 500,
    district: 'San Carlos',
    images: [],
    amenities: ['wifi', 'furnished', 'bathroom', 'parking'],
    verified: false,
    boosted: false,
    ownerName: 'Ana Quispe',
    photoCount: 8,
  },
  {
    id: '4',
    title: 'Habitacion economica bien ubicada',
    price: 250,
    district: 'Chilca',
    images: [],
    amenities: ['wifi', 'kitchen'],
    verified: false,
    boosted: false,
    ownerName: 'Pedro Huaman',
    photoCount: 3,
  },
  {
    id: '5',
    title: 'Suite con vista a la ciudad',
    price: 650,
    district: 'El Tambo',
    images: [],
    amenities: ['wifi', 'furnished', 'bathroom', 'balcony', 'security'],
    verified: true,
    boosted: true,
    ownerName: 'Sofia Torres',
    photoCount: 10,
  },
];

const DISTRICTS = [
  'Todos', 'El Tambo', 'Huancayo Centro', 'Chilca', 'San Carlos',
  'Pilcomayo', 'San Agustin', 'Sapallanga',
];

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: 0, max: 99999 },
  { label: 'S/ 150 - 300', min: 150, max: 300 },
  { label: 'S/ 300 - 500', min: 300, max: 500 },
  { label: 'S/ 500 - 800', min: 500, max: 800 },
  { label: 'S/ 800+', min: 800, max: 99999 },
];

export default function DiscoverScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('Todos');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [listings, setListings] = useState(MOCK_LISTINGS);

  const position = useRef(new Animated.ValueXY()).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const matchScale = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        const direction = gesture.dx > 0 ? 1 : -1;
        const opacity = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
        overlayOpacity.setValue(opacity * direction);
        const scale = Math.min(0.92 + (Math.abs(gesture.dx) / SWIPE_THRESHOLD) * 0.08, 1);
        nextCardScale.setValue(scale);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = useCallback((direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => onSwipeComplete(direction));
  }, [currentIndex]);

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 5,
        useNativeDriver: false,
      }),
      Animated.spring(nextCardScale, {
        toValue: 0.92,
        friction: 5,
        useNativeDriver: false,
      }),
    ]).start();
    overlayOpacity.setValue(0);
  }, []);

  const onSwipeComplete = useCallback((direction) => {
    if (direction === 'right') {
      const rand = Math.random();
      if (rand > 0.6) {
        setShowMatch(true);
        Animated.spring(matchScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          Animated.timing(matchScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowMatch(false));
        }, 1800);
      }
    }
    position.setValue({ x: 0, y: 0 });
    overlayOpacity.setValue(0);
    nextCardScale.setValue(0.92);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleButtonSwipe = useCallback((direction) => {
    if (currentIndex >= listings.length) return;
    forceSwipe(direction);
  }, [currentIndex, listings.length, forceSwipe]);

  const handleSuperLike = useCallback(() => {
    if (currentIndex >= listings.length) return;
    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete('right'));
  }, [currentIndex, listings.length, onSwipeComplete]);

  const getCardStyle = useCallback(() => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-15deg', '0deg', '15deg'],
    });
    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  }, []);

  const renderCards = () => {
    if (currentIndex >= listings.length) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No hay mas cuartos</Text>
          <Text style={styles.emptySubtitle}>
            Vuelve mas tarde o ajusta tus filtros para ver mas opciones
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={() => {
              setCurrentIndex(0);
              setListings(MOCK_LISTINGS);
            }}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.reloadButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return listings
      .map((listing, index) => {
        if (index < currentIndex) return null;
        if (index > currentIndex + 2) return null;

        if (index === currentIndex) {
          return (
            <Animated.View
              key={listing.id}
              style={[styles.cardContainer, getCardStyle(), { zIndex: 3 }]}
              {...panResponder.panHandlers}
            >
              <Animated.View
                style={[
                  styles.likeOverlay,
                  {
                    opacity: overlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={styles.likeOverlayText}>ME GUSTA</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.nopeOverlay,
                  {
                    opacity: overlayOpacity.interpolate({
                      inputRange: [-1, 0],
                      outputRange: [1, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={styles.nopeOverlayText}>PASO</Text>
              </Animated.View>
              <ListingSwipeCard listing={listing} />
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={listing.id}
            style={[
              styles.cardContainer,
              {
                zIndex: 2 - (index - currentIndex),
                transform: [
                  { scale: index === currentIndex + 1 ? nextCardScale : 0.88 },
                ],
                top: (index - currentIndex) * 8,
              },
            ]}
          >
            <ListingSwipeCard listing={listing} />
          </Animated.View>
        );
      })
      .reverse();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>CuartoYa</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={12} color="#E8442A" />
            <Text style={styles.locationText}>Huancayo</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.deckContainer}>
        {renderCards()}
      </View>

      {showMatch && (
        <Animated.View
          style={[
            styles.matchPopup,
            { transform: [{ scale: matchScale }] },
          ]}
        >
          <Ionicons name="heart" size={48} color="#E8442A" />
          <Text style={styles.matchText}>Es un Match!</Text>
          <Text style={styles.matchSubtext}>Pueden chatear ahora</Text>
        </Animated.View>
      )}

      {currentIndex < listings.length && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.nopeBtn]}
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={30} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.superBtn]}
            onPress={handleSuperLike}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={26} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={30} color="#1D9E75" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Distrito</Text>
              <View style={styles.filterOptions}>
                {DISTRICTS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.filterChip,
                      selectedDistrict === d && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedDistrict(d)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedDistrict === d && styles.filterChipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Rango de precio</Text>
              {PRICE_RANGES.map((range, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.priceOption,
                    selectedPriceRange === idx && styles.priceOptionActive,
                  ]}
                  onPress={() => setSelectedPriceRange(idx)}
                >
                  <Text
                    style={[
                      styles.priceOptionText,
                      selectedPriceRange === idx && styles.priceOptionTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                  {selectedPriceRange === idx && (
                    <Ionicons name="checkmark-circle" size={20} color="#E8442A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => {
                setCurrentIndex(0);
                setShowFilter(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.applyFilterText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8442A',
    marginRight: 10,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#E8442A',
    fontWeight: '600',
    marginLeft: 3,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
  },
  likeOverlay: {
    position: 'absolute',
    top: 60,
    left: 30,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#1D9E75',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-20deg' }],
  },
  likeOverlayText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1D9E75',
  },
  nopeOverlay: {
    position: 'absolute',
    top: 60,
    right: 30,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '20deg' }],
  },
  nopeOverlayText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 20,
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  nopeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  superBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  matchPopup: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    zIndex: 100,
  },
  matchText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E8442A',
    marginTop: 12,
  },
  matchSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8442A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#E8442A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  priceOptionActive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#E8442A',
  },
  priceOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceOptionTextActive: {
    color: '#E8442A',
    fontWeight: '700',
  },
  applyFilterBtn: {
    backgroundColor: '#E8442A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  applyFilterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
