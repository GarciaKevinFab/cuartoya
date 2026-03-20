import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>CuartoYa</Text>
        </View>
        <Text style={styles.tagline}>
          Encuentra tu habitacion ideal en Huancayo
        </Text>
        <Text style={styles.subtitle}>
          Conectamos inquilinos con arrendadores de forma rapida y segura
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="swap-horizontal" size={24} color="#E8442A" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Desliza y conecta</Text>
            <Text style={styles.featureDesc}>
              Explora habitaciones con un simple gesto
            </Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#1D9E75" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Verificado y seguro</Text>
            <Text style={styles.featureDesc}>
              Perfiles y publicaciones verificadas
            </Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Chat directo</Text>
            <Text style={styles.featureDesc}>
              Comunicate al instante con tu match
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Buscar cuarto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Ionicons name="key" size={20} color="#E8442A" style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Tengo un cuarto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            Ya tienes cuenta?{' '}
            <Text style={styles.loginTextBold}>Inicia sesion</Text>
          </Text>
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
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#E8442A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#E8442A',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#E8442A',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginTextBold: {
    color: '#E8442A',
    fontWeight: '700',
  },
});
