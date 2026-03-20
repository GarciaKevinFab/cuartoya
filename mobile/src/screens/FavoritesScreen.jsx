import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { favoritesAPI } from '../services/api';

const MOCK_FAVORITES = [
  {
    id: 'f1',
    listingId: '1',
    title: 'Habitacion amoblada cerca a la UNCP',
    price: 350,
    district: 'El Tambo',
    image: null,
    ownerName: 'Maria Garcia',
    ownerVerified: true,
  },
  {
    id: 'f2',
    listingId: '2',
    title: 'Cuarto amplio con bano privado',
    price: 420,
    district: 'Huancayo Centro',
    image: null,
    ownerName: 'Carlos Lopez',
    ownerVerified: true,
  },
  {
    id: 'f3',
    listingId: '3',
    title: 'Mini departamento para estudiante',
    price: 500,
    district: 'San Carlos',
    image: null,
    ownerName: 'Ana Quispe',
    ownerVerified: false,
  },
];

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES);
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await favoritesAPI.list();
      const data = response.data.favorites || response.data || [];
      if (data.length > 0) {
        setFavorites(data);
      }
    } catch (err) {
      // Keep mock data on error
      console.warn('Error fetching favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleRemoveFavorite = (item) => {
    Alert.alert(
      'Quitar de favoritos',
      'Deseas quitar esta publicacion de tus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(item.id);
            try {
              await favoritesAPI.remove(item.listingId || item.id);
            } catch (err) {
              console.warn('Error removing favorite:', err);
            }
            setFavorites((prev) => prev.filter((f) => f.id !== item.id));
            setRemovingId(null);
          },
        },
      ]
    );
  };

  const handleCardPress = (item) => {
    navigation.navigate('ListingDetail', { listing: item, listingId: item.listingId || item.id });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="home" size={28} color="#D1D5DB" />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>S/ {item.price}</Text>
          <Text style={styles.cardPriceUnit}>/mes</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.districtRow}>
            <Ionicons name="location" size={14} color="#E8442A" />
            <Text style={styles.districtText}>{item.district}</Text>
          </View>
          {item.ownerVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#1D9E75" />
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => handleRemoveFavorite(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={removingId === item.id}
      >
        {removingId === item.id ? (
          <ActivityIndicator size="small" color="#E8442A" />
        ) : (
          <Ionicons name="heart" size={22} color="#E8442A" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Sin favoritos</Text>
      <Text style={styles.emptySubtitle}>
        Guarda las publicaciones que te interesen para verlas despues.
        Usa el icono de corazon en las publicaciones.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Inicio')}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={18} color="#FFFFFF" />
        <Text style={styles.exploreButtonText}>Explorar cuartos</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && favorites.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8442A" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImageContainer: {
    width: 110,
    height: 110,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 19,
    marginBottom: 4,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E8442A',
  },
  cardPriceUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  districtText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8442A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
