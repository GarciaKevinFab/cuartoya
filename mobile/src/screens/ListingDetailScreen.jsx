import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { favoritesAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 280;

const AMENITY_LIST = [
  { key: 'wifi', icon: 'wifi', label: 'WiFi incluido' },
  { key: 'furnished', icon: 'bed', label: 'Amoblado' },
  { key: 'bathroom', icon: 'water-outline', label: 'Bano privado' },
  { key: 'kitchen', icon: 'restaurant', label: 'Uso de cocina' },
  { key: 'parking', icon: 'car', label: 'Estacionamiento' },
  { key: 'laundry', icon: 'water', label: 'Lavanderia' },
  { key: 'security', icon: 'shield-checkmark', label: 'Seguridad 24h' },
  { key: 'balcony', icon: 'sunny', label: 'Balcon' },
];

const MOCK_DETAIL = {
  id: '1',
  title: 'Habitacion amoblada cerca a la UNCP',
  description:
    'Amplia habitacion amoblada con cama de plaza y media, escritorio, closet y bano privado. Ubicada en zona tranquila cerca a la Universidad Nacional del Centro del Peru. Ideal para estudiantes o profesionales.',
  price: 350,
  district: 'El Tambo',
  address: 'Jr. Los Alamos 234, El Tambo',
  images: [],
  amenities: ['wifi', 'furnished', 'bathroom', 'kitchen', 'security'],
  rules: ['No mascotas', 'No fiestas', 'Horario de visitas hasta las 10pm'],
  ownerName: 'Maria Garcia',
  ownerAvatar: null,
  ownerPhone: '+51 999 888 777',
  ownerVerified: true,
  ownerListings: 3,
  ownerRating: 4.8,
  createdAt: '2026-03-15',
  size: '14 m2',
  floor: '2do piso',
  availability: 'Disponible ahora',
};

export default function ListingDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const listing = route?.params?.listing || MOCK_DETAIL;
  const [activePhoto, setActivePhoto] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const flatListRef = useRef(null);

  const photos = listing.images && listing.images.length > 0
    ? listing.images
    : [null, null, null];

  const renderPhoto = ({ item, index }) => (
    <View style={styles.photoItem}>
      {item ? (
        <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.placeholderPhoto]}>
          <Ionicons name="image-outline" size={48} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Foto {index + 1}</Text>
        </View>
      )}
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActivePhoto(viewableItems[0].index || 0);
    }
  }).current;

  const handleToggleFavorite = useCallback(async () => {
    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);
    try {
      if (wasFavorite) {
        await favoritesAPI.remove(listing.id);
      } else {
        await favoritesAPI.add(listing.id);
      }
    } catch (err) {
      setIsFavorite(wasFavorite);
      console.warn('Error toggling favorite:', err);
    }
  }, [isFavorite, listing.id]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Reportar',
      'Que deseas reportar?',
      [
        {
          text: 'Reportar publicacion',
          onPress: () =>
            navigation.navigate('Report', {
              targetType: 'listing',
              targetId: listing.id,
              targetName: listing.title,
            }),
        },
        {
          text: 'Reportar propietario',
          onPress: () =>
            navigation.navigate('Report', {
              targetType: 'user',
              targetId: listing.ownerId || listing.id,
              targetName: listing.ownerName,
            }),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [listing, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(_, index) => `photo-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />
          <View style={styles.pagination}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activePhoto && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.photoCounter}>
            <Ionicons name="images-outline" size={14} color="#FFFFFF" />
            <Text style={styles.photoCounterText}>
              {activePhoto + 1}/{photos.length}
            </Text>
          </View>

          {/* Favorite button on gallery */}
          <TouchableOpacity
            style={styles.galleryFavoriteBtn}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#E8442A' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>S/ {listing.price}</Text>
                <Text style={styles.priceUnit}>/mes</Text>
              </View>
              <Text style={styles.availability}>{listing.availability || 'Disponible'}</Text>
            </View>
            <View style={styles.badges}>
              {listing.ownerVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
                  <Text style={styles.verifiedBadgeText}>Verificado</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#E8442A" />
            <Text style={styles.locationText}>{listing.address || `${listing.district}, Huancayo`}</Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{listing.size || '12 m2'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="layers-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{listing.floor || '1er piso'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripcion</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios incluidos</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITY_LIST.filter((a) =>
                (listing.amenities || []).includes(a.key)
              ).map((amenity) => (
                <View key={amenity.key} style={styles.amenityItem}>
                  <View style={styles.amenityIconContainer}>
                    <Ionicons name={amenity.icon} size={20} color="#E8442A" />
                  </View>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {listing.rules && listing.rules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reglas de la casa</Text>
              {listing.rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Propietario</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                {listing.ownerAvatar ? (
                  <Image source={{ uri: listing.ownerAvatar }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={28} color="#9CA3AF" />
                )}
              </View>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>{listing.ownerName}</Text>
                  {listing.ownerVerified && (
                    <View style={styles.ownerVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
                    </View>
                  )}
                </View>
                <View style={styles.ownerStats}>
                  <View style={styles.ownerStat}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ownerStatText}>{listing.ownerRating || 4.5}</Text>
                  </View>
                  <View style={styles.ownerStat}>
                    <Ionicons name="home" size={14} color="#6B7280" />
                    <Text style={styles.ownerStatText}>
                      {listing.ownerListings || 1} publicaciones
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Report button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReport}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={18} color="#EF4444" />
            <Text style={styles.reportButtonText}>Reportar esta publicacion</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.floatingBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.likeFloatingBtn, liked && styles.likeFloatingBtnActive]}
          onPress={() => setLiked(!liked)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#FFFFFF' : '#E8442A'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => navigation.navigate('Chat', { matchId: listing.id })}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.contactBtnText}>Contactar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  galleryContainer: {
    position: 'relative',
  },
  photoItem: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  pagination: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  photoCounter: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoCounterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  galleryFavoriteBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 30,
    fontWeight: '800',
    color: '#E8442A',
  },
  priceUnit: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
  availability: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '600',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  amenityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  amenityLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  ownerVerifiedBadge: {
    marginLeft: 2,
  },
  ownerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  ownerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    gap: 8,
    marginBottom: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  likeFloatingBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  likeFloatingBtnActive: {
    backgroundColor: '#E8442A',
    borderColor: '#E8442A',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E8442A',
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
