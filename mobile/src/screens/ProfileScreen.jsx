import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const MENU_ITEMS = [
  {
    id: 'listings',
    icon: 'home-outline',
    label: 'Mis Publicaciones',
    screen: 'MyListings',
    color: '#E8442A',
  },
  {
    id: 'favorites',
    icon: 'heart-outline',
    label: 'Mis Favoritos',
    screen: 'Favorites',
    color: '#EF4444',
  },
  {
    id: 'premium',
    icon: 'diamond-outline',
    label: 'Planes Premium',
    screen: 'Premium',
    color: '#F59E0B',
  },
  {
    id: 'notifications',
    icon: 'notifications-outline',
    label: 'Notificaciones',
    screen: null,
    color: '#3B82F6',
  },
  {
    id: 'privacy',
    icon: 'shield-outline',
    label: 'Privacidad y seguridad',
    screen: null,
    color: '#1D9E75',
  },
  {
    id: 'help',
    icon: 'help-circle-outline',
    label: 'Ayuda y soporte',
    screen: null,
    color: '#8B5CF6',
  },
  {
    id: 'about',
    icon: 'information-circle-outline',
    label: 'Acerca de CuartoYa',
    screen: null,
    color: '#6B7280',
  },
];

const MOCK_USER = {
  name: 'Juan Perez',
  email: 'juan@correo.com',
  phone: '+51 999 888 777',
  role: 'tenant',
  avatar: null,
  verified: true,
  plan: 'free',
  stats: {
    listings: 2,
    matches: 8,
    likes: 45,
  },
  memberSince: 'Marzo 2026',
};

const PLAN_BADGES = {
  free: { label: 'Gratis', color: '#6B7280', bg: '#F3F4F6' },
  pro: { label: 'Pro', color: '#E8442A', bg: '#FEF2F2' },
  agency: { label: 'Agencia', color: '#F59E0B', bg: '#FFFBEB' },
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout, user: authUser } = useAuthStore();
  const user = authUser || MOCK_USER;
  const planInfo = PLAN_BADGES[user.plan] || PLAN_BADGES.free;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro que deseas cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(item.label, 'Esta seccion estara disponible pronto.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          {user.verified && (
            <View style={styles.verifiedIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.userName}>{user.name}</Text>
          {user.verified && (
            <View style={styles.verifiedInlineBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
              <Text style={styles.verifiedInlineText}>Verificado</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.planBadge, { backgroundColor: planInfo.bg }]}>
            <Ionicons name="diamond" size={14} color={planInfo.color} />
            <Text style={[styles.planBadgeText, { color: planInfo.color }]}>
              Plan {planInfo.label}
            </Text>
          </View>
          <Text style={styles.memberSince}>Miembro desde {user.memberSince}</Text>
        </View>
      </View>

      {/* Verification CTA */}
      {!user.verified && (
        <TouchableOpacity
          style={styles.verifyCard}
          onPress={() => navigation.navigate('Verification')}
          activeOpacity={0.85}
        >
          <View style={styles.verifyIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.verifyContent}>
            <Text style={styles.verifyTitle}>Verificar identidad</Text>
            <Text style={styles.verifySubtitle}>
              Verifica tu DNI con RENIEC para generar mas confianza
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </TouchableOpacity>
      )}

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.listings || 0}</Text>
          <Text style={styles.statLabel}>Publicaciones</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.matches || 0}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.likes || 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {user.plan === 'free' && (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('Premium')}
          activeOpacity={0.85}
        >
          <View style={styles.upgradeIcon}>
            <Ionicons name="rocket" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Mejora tu plan</Text>
            <Text style={styles.upgradeSubtitle}>
              Destaca tus publicaciones y obtiene mas matches
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </TouchableOpacity>

      <Text style={styles.version}>CuartoYa v1.0.0</Text>

      <View style={{ height: 120 }} />
    </ScrollView>
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedIcon: {
    position: 'absolute',
    top: 0,
    right: -4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  verifiedInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  verifiedInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verifyContent: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  verifySubtitle: {
    fontSize: 12,
    color: '#3B82F6',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8442A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8442A',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  upgradeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
