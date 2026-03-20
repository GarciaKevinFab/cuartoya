import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { verificationAPI } from '../services/api';
import useAuthStore from '../store/authStore';

export default function VerificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, loadToken } = useAuthStore();
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isValidDni = dni.length === 8 && /^\d{8}$/.test(dni);

  const handleVerify = async () => {
    if (!isValidDni) {
      Alert.alert('DNI invalido', 'Ingresa un DNI de 8 digitos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await verificationAPI.verifyDni(dni);
      const data = response.data;
      setResult(data);
      // Refresh user data to get updated verification status
      await loadToken();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'No se pudo verificar el DNI. Intenta de nuevo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#E8442A" />
          </View>
        </View>

        <Text style={styles.title}>Verifica tu identidad</Text>
        <Text style={styles.subtitle}>
          Ingresa tu numero de DNI para verificar tu identidad con RENIEC.
          Los usuarios verificados generan mas confianza.
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Numero de DNI</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: 12345678"
              placeholderTextColor="#9CA3AF"
              value={dni}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '').slice(0, 8);
                setDni(cleaned);
                setResult(null);
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={8}
              editable={!isLoading}
            />
            {dni.length > 0 && (
              <View style={styles.charCount}>
                <Text
                  style={[
                    styles.charCountText,
                    isValidDni && styles.charCountValid,
                  ]}
                >
                  {dni.length}/8
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton,
            (!isValidDni || isLoading) && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={!isValidDni || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Verificar con RENIEC</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.resultTitle}>Identidad verificada</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Nombre completo</Text>
              <Text style={styles.resultValue}>
                {result.fullName || result.name || 'N/A'}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>DNI</Text>
              <Text style={styles.resultValue}>{result.dni || dni}</Text>
            </View>

            <View style={styles.verifiedIndicator}>
              <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
              <Text style={styles.verifiedIndicatorText}>
                Tu perfil ahora muestra la insignia de verificado
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Por que verificarte?</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1D9E75" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Genera confianza</Text>
              <Text style={styles.infoItemText}>
                Los propietarios e inquilinos prefieren tratar con usuarios verificados.
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="star-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Mas visibilidad</Text>
              <Text style={styles.infoItemText}>
                Tus publicaciones se destacan con la insignia de verificado.
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Datos seguros</Text>
              <Text style={styles.infoItemText}>
                Tu informacion es verificada directamente con RENIEC y no se comparte.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: 2,
  },
  charCount: {
    marginLeft: 8,
  },
  charCountText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  charCountValid: {
    color: '#1D9E75',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8442A',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
    elevation: 3,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D9E75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D9E75',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  resultRow: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  verifiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  verifiedIndicatorText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  infoItemText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
