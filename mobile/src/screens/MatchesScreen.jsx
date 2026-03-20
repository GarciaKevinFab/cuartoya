import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import useMatchesStore from '../store/matchesStore';

dayjs.extend(relativeTime);
dayjs.locale('es');

const MOCK_MATCHES = [
  {
    id: 'm1',
    listingTitle: 'Habitacion amoblada cerca a la UNCP',
    listingImage: null,
    price: 350,
    otherUser: { name: 'Maria Garcia', avatar: null, verified: true },
    lastMessage: 'Hola! Si, la habitacion sigue disponible. Cuando te gustaria verla?',
    lastMessageTime: '2026-03-19T10:30:00',
    unread: 2,
  },
  {
    id: 'm2',
    listingTitle: 'Cuarto amplio con bano privado',
    listingImage: null,
    price: 420,
    otherUser: { name: 'Carlos Lopez', avatar: null, verified: true },
    lastMessage: 'Perfecto, nos vemos manana a las 5pm.',
    lastMessageTime: '2026-03-18T18:45:00',
    unread: 0,
  },
  {
    id: 'm3',
    listingTitle: 'Mini departamento para estudiante',
    listingImage: null,
    price: 500,
    otherUser: { name: 'Ana Quispe', avatar: null, verified: false },
    lastMessage: 'El precio incluye todos los servicios basicos.',
    lastMessageTime: '2026-03-17T14:20:00',
    unread: 1,
  },
  {
    id: 'm4',
    listingTitle: 'Habitacion economica bien ubicada',
    listingImage: null,
    price: 250,
    otherUser: { name: 'Pedro Huaman', avatar: null, verified: false },
    lastMessage: 'Puedes mudarte desde el 1ero del proximo mes.',
    lastMessageTime: '2026-03-16T09:15:00',
    unread: 0,
  },
];

export default function MatchesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [matches] = useState(MOCK_MATCHES);

  const formatTime = (dateStr) => {
    const date = dayjs(dateStr);
    const now = dayjs();
    if (now.diff(date, 'hour') < 24) {
      return date.format('HH:mm');
    }
    if (now.diff(date, 'day') < 7) {
      return date.fromNow();
    }
    return date.format('DD/MM');
  };

  const renderMatch = ({ item }) => (
    <TouchableOpacity
      style={[styles.matchItem, item.unread > 0 && styles.matchItemUnread]}
      onPress={() => navigation.navigate('Chat', { matchId: item.id, match: item })}
      activeOpacity={0.7}
    >
      <View style={styles.matchImageContainer}>
        {item.listingImage ? (
          <Image source={{ uri: item.listingImage }} style={styles.matchImage} />
        ) : (
          <View style={[styles.matchImage, styles.matchImagePlaceholder]}>
            <Ionicons name="home" size={24} color="#D1D5DB" />
          </View>
        )}
        <View style={styles.avatarOverlay}>
          {item.otherUser.avatar ? (
            <Image source={{ uri: item.otherUser.avatar }} style={styles.avatarSmall} />
          ) : (
            <View style={[styles.avatarSmall, styles.avatarSmallPlaceholder]}>
              <Ionicons name="person" size={12} color="#9CA3AF" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.matchContent}>
        <View style={styles.matchHeader}>
          <View style={styles.matchNameRow}>
            <Text style={[styles.matchName, item.unread > 0 && styles.matchNameUnread]} numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            {item.otherUser.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#1D9E75" />
            )}
          </View>
          <Text style={styles.matchTime}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <Text style={styles.matchListing} numberOfLines={1}>
          {item.listingTitle} - S/ {item.price}/mes
        </Text>
        <Text
          style={[styles.matchMessage, item.unread > 0 && styles.matchMessageUnread]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Sin matches aun</Text>
      <Text style={styles.emptySubtitle}>
        Desliza a la derecha en los cuartos que te gusten para hacer match con los propietarios
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} {matches.length === 1 ? 'conversacion' : 'conversaciones'}
        </Text>
      </View>

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  matchItemUnread: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  matchImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  matchImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  matchImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSmallPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  matchNameUnread: {
    fontWeight: '800',
  },
  matchTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  matchListing: {
    fontSize: 12,
    color: '#E8442A',
    fontWeight: '500',
    marginBottom: 4,
  },
  matchMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  matchMessageUnread: {
    color: '#1F2937',
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
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
