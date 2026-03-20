import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

const MOCK_MY_LISTINGS = [
  {
    id: 'l1',
    title: 'Habitacion amoblada cerca a la UNCP',
    price: 350,
    district: 'El Tambo',
    image: null,
    status: 'active',
    views: 145,
    likes: 23,
    matches: 5,
    createdAt: '2026-03-10',
    boosted: true,
  },
  {
    id: 'l2',
    title: 'Cuarto con bano privado en zona centrica',
    price: 420,
    district: 'Huancayo Centro',
    image: null,
    status: 'active',
    views: 89,
    likes: 12,
    matches: 3,
    createdAt: '2026-03-05',
    boosted: false,
  },
  {
    id: 'l3',
    title: 'Habitacion simple para estudiante',
    price: 200,
    district: 'Chilca',
    image: null,
    status: 'paused',
    views: 34,
    likes: 4,
    matches: 1,
    createdAt: '2026-02-20',
    boosted: false,
  },
];

const STATUS_LABELS = {
  active: { label: 'Activo', color: '#1D9E75', bg: '#ECFDF5' },
  paused: { label: 'Pausado', color: '#F59E0B', bg: '#FFFBEB' },
  expired: { label: 'Expirado', color: '#EF4444', bg: '#FEF2F2' },
};

export default function MyListingsScreen({ navigation }) {
  const [listings] = useState(MOCK_MY_LISTINGS);

  const renderListing = ({ item }) => {
    const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.active;

    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => navigation.navigate('ListingDetail', { listing: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="home" size={32} color="#D1D5DB" />
            </View>
          )}
          {item.boosted && (
            <View style={styles.boostTag}>
              <Ionicons name="flash" size={12} color="#FFFFFF" />
              <Text style={styles.boostTagText}>Destacado</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardPriceRow}>
            <Text style={styles.cardPrice}>S/ {item.price}</Text>
            <Text style={styles.cardPriceUnit}>/mes</Text>
            <Text style={styles.cardDistrict}> - {item.district}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text style={styles.statText}>{item.views}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={16} color="#E8442A" />
              <Text style={styles.statText}>{item.likes}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#3B82F6" />
              <Text style={styles.statText}>{item.matches}</Text>
            </View>
            <Text style={styles.dateText}>
              {dayjs(item.createdAt).format('DD/MM/YYYY')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="home-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Sin publicaciones</Text>
      <Text style={styles.emptySubtitle}>
        Publica tu primera habitacion y empieza a recibir inquilinos interesados
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Publicar')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  listingCard: {
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
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  boostTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E8442A',
  },
  cardPriceUnit: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardDistrict: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
  },
});
