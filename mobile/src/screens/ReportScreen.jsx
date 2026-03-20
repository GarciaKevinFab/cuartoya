import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportsAPI } from '../services/api';

const REPORT_REASONS = [
  { key: 'spam', label: 'Spam' },
  { key: 'inappropriate', label: 'Contenido inapropiado' },
  { key: 'fake', label: 'Publicacion falsa' },
  { key: 'scam', label: 'Estafa' },
  { key: 'harassment', label: 'Acoso' },
  { key: 'other', label: 'Otro' },
];

export default function ReportScreen({ route, navigation }) {
  const { targetType, targetId, targetName } = route?.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = selectedReason !== null && !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Selecciona un motivo', 'Debes seleccionar un motivo para el reporte.');
      return;
    }

    setIsSubmitting(true);

    try {
      await reportsAPI.create({
        targetType: targetType || 'listing',
        targetId: targetId || 'unknown',
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Reporte enviado',
        'Gracias por reportar. Revisaremos tu reporte y tomaremos las medidas necesarias.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'Reporte enviado',
        'Gracias por reportar. Revisaremos tu reporte y tomaremos las medidas necesarias.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="flag" size={28} color="#EF4444" />
          </View>
          <Text style={styles.title}>Reportar</Text>
          {targetName && (
            <Text style={styles.targetName}>
              {targetType === 'user' ? 'Usuario' : 'Publicacion'}: {targetName}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Selecciona el motivo del reporte. Tu reporte es anonimo y nos ayuda
            a mantener CuartoYa seguro.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Motivo del reporte</Text>
        <View style={styles.reasonList}>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.key}
              style={[
                styles.reasonItem,
                selectedReason === reason.key && styles.reasonItemActive,
              ]}
              onPress={() => setSelectedReason(reason.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedReason === reason.key && styles.radioOuterActive,
                ]}
              >
                {selectedReason === reason.key && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.key && styles.reasonTextActive,
                ]}
              >
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Descripcion (opcional)</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Describe el problema con mas detalle..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCounter}>{description.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Enviar reporte</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  targetName: {
    fontSize: 14,
    color: '#E8442A',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  reasonList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reasonItemActive: {
    backgroundColor: '#FEF2F2',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioOuterActive: {
    borderColor: '#E8442A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8442A',
  },
  reasonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  reasonTextActive: {
    color: '#E8442A',
    fontWeight: '700',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 24,
    minHeight: 120,
  },
  textArea: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    minHeight: 80,
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8442A',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#E8442A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
