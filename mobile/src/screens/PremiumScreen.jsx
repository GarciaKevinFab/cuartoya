import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    priceLabel: 'S/ 0',
    period: 'Siempre',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    popular: false,
    features: [
      { text: '1 publicacion activa', included: true },
      { text: '5 likes por dia', included: true },
      { text: 'Chat con matches', included: true },
      { text: 'Fotos basicas (3 max)', included: true },
      { text: 'Boost de publicacion', included: false },
      { text: 'Ver quien te dio like', included: false },
      { text: 'Likes ilimitados', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 25,
    priceLabel: 'S/ 25',
    period: '/mes',
    color: '#E8442A',
    bgColor: '#FEF2F2',
    borderColor: '#E8442A',
    popular: true,
    features: [
      { text: '5 publicaciones activas', included: true },
      { text: 'Likes ilimitados', included: true },
      { text: 'Chat con matches', included: true },
      { text: 'Hasta 10 fotos', included: true },
      { text: '1 Boost gratis al mes', included: true },
      { text: 'Ver quien te dio like', included: true },
      { text: 'Estadisticas avanzadas', included: true },
      { text: 'Soporte prioritario', included: false },
    ],
  },
  {
    id: 'agency',
    name: 'Agencia',
    price: 65,
    priceLabel: 'S/ 65',
    period: '/mes',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#F59E0B',
    popular: false,
    features: [
      { text: 'Publicaciones ilimitadas', included: true },
      { text: 'Likes ilimitados', included: true },
      { text: 'Chat con matches', included: true },
      { text: 'Fotos ilimitadas', included: true },
      { text: '5 Boosts gratis al mes', included: true },
      { text: 'Ver quien te dio like', included: true },
      { text: 'Estadisticas avanzadas', included: true },
      { text: 'Soporte prioritario 24/7', included: true },
    ],
  },
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const handleSubscribe = (plan) => {
    if (plan.id === 'free') {
      Alert.alert('Plan Gratis', 'Ya tienes el plan gratuito activado.');
      return;
    }
    Alert.alert(
      `Plan ${plan.name}`,
      `Deseas suscribirte al plan ${plan.name} por ${plan.priceLabel}${plan.period}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suscribirme',
          onPress: () => {
            Alert.alert(
              'Suscripcion exitosa',
              `Tu plan ${plan.name} ha sido activado. Disfruta de todos los beneficios!`
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Ionicons name="diamond" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Elige tu plan</Text>
        <Text style={styles.heroSubtitle}>
          Destaca tus publicaciones y conecta con mas inquilinos en Huancayo
        </Text>
      </View>

      {PLANS.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            {
              borderColor: selectedPlan === plan.id ? plan.borderColor : '#E5E7EB',
              backgroundColor: selectedPlan === plan.id ? plan.bgColor : '#FFFFFF',
            },
          ]}
          onPress={() => setSelectedPlan(plan.id)}
          activeOpacity={0.8}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
              <Text style={styles.popularText}>Mas popular</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <View style={styles.planRadio}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selectedPlan === plan.id ? plan.color : '#D1D5DB' },
                ]}
              >
                {selectedPlan === plan.id && (
                  <View style={[styles.radioInner, { backgroundColor: plan.color }]} />
                )}
              </View>
            </View>
            <View style={styles.planNameContainer}>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            </View>
            <View style={styles.planPriceContainer}>
              <Text style={[styles.planPrice, { color: plan.color }]}>{plan.priceLabel}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
          </View>

          {selectedPlan === plan.id && (
            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name={feature.included ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={feature.included ? '#1D9E75' : '#D1D5DB'}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feature.included && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          {
            backgroundColor:
              PLANS.find((p) => p.id === selectedPlan)?.color || '#E8442A',
          },
        ]}
        onPress={() => handleSubscribe(PLANS.find((p) => p.id === selectedPlan))}
        activeOpacity={0.85}
      >
        <Text style={styles.subscribeButtonText}>
          {selectedPlan === 'free'
            ? 'Continuar con Gratis'
            : `Suscribirme al plan ${PLANS.find((p) => p.id === selectedPlan)?.name}`}
        </Text>
      </TouchableOpacity>

      <View style={styles.guaranteeSection}>
        <Ionicons name="shield-checkmark" size={20} color="#1D9E75" />
        <Text style={styles.guaranteeText}>
          Cancela cuando quieras. Sin compromisos ni permanencia minima.
        </Text>
      </View>

      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Preguntas frecuentes</Text>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Como funciona el Boost?</Text>
          <Text style={styles.faqAnswer}>
            El Boost destaca tu publicacion en las primeras posiciones durante 24 horas,
            aumentando hasta 10x la visibilidad.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Puedo cambiar de plan?</Text>
          <Text style={styles.faqAnswer}>
            Si, puedes cambiar tu plan en cualquier momento. El cambio se aplica inmediatamente
            y se ajusta el cobro proporcional.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Que metodos de pago aceptan?</Text>
          <Text style={styles.faqAnswer}>
            Aceptamos tarjetas Visa, Mastercard, Yape y Plin.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8442A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  planNameContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 2,
  },
  planFeatures: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  featureTextDisabled: {
    color: '#D1D5DB',
  },
  subscribeButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  faqSection: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});
