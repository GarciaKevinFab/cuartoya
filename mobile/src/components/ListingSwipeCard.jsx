import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

const AMENITY_ICONS = {
  wifi: { icon: 'wifi', label: 'WiFi' },
  parking: { icon: 'car', label: 'Estac.' },
  laundry: { icon: 'water', label: 'Lavand.' },
  kitchen: { icon: 'restaurant', label: 'Cocina' },
  furnished: { icon: 'bed', label: 'Amoblado' },
  bathroom: { icon: 'water-outline', label: 'Bano priv.' },
  security: { icon: 'shield-checkmark', label: 'Seguridad' },
  balcony: { icon: 'sunny', label: 'Balcon' },
};

export default function ListingSwipeCard({ listing }) {
  const {
    title = 'Habitacion en Huancayo',
    price = 350,
    district = 'El Tambo',
    images = [],
    amenities = ['wifi', 'furnished', 'bathroom'],
    verified = false,
    boosted = false,
    ownerName = 'Propietario',
    ownerAvatar = null,
    photoCount = 5,
  } = listing || {};

  const mainImage = images.length > 0
    ? { uri: images[0] }
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image source={mainImage} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={64} color="#D1D5DB" />
            <Text style={styles.placeholderText}>Sin foto</Text>
          </View>
        )}

        <View style={styles.gradientOverlay} />

        {boosted && (
          <View style={styles.boostBadge}>
            <Ionicons name="flash" size={14} color="#FFFFFF" />
            <Text style={styles.boostText}>Destacado</Text>
          </View>
        )}

        {verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.photoCountBadge}>
          <Ionicons name="images-outline" size={14} color="#FFFFFF" />
          <Text style={styles.photoCountText}>{photoCount}</Text>
        </View>

        <View style={styles.bottomInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>S/ {price}</Text>
            <Text style={styles.priceUnit}>/mes</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#F3F4F6" />
            <Text style={styles.location}>{district}, Huancayo</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.amenitiesRow}>
          {amenities.slice(0, 4).map((amenity) => {
            const info = AMENITY_ICONS[amenity] || { icon: 'ellipse', label: amenity };
            return (
              <View key={amenity} style={styles.amenityTag}>
                <Ionicons name={info.icon} size={14} color="#E8442A" />
                <Text style={styles.amenityText}>{info.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.ownerRow}>
          <View style={styles.ownerAvatar}>
            {ownerAvatar ? (
              <Image source={{ uri: ownerAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={16} color="#9CA3AF" />
            )}
          </View>
          <Text style={styles.ownerName} numberOfLines={1}>{ownerName}</Text>
          {verified && (
            <Ionicons name="checkmark-circle" size={16} color="#1D9E75" style={styles.ownerVerified} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.72,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  boostBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  boostText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 14,
    right: 52,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D9E75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#E5E7EB',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 14,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  amenityText: {
    fontSize: 12,
    color: '#E8442A',
    fontWeight: '600',
    marginLeft: 4,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ownerName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  ownerVerified: {
    marginLeft: 4,
  },
});
