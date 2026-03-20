import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEPS = ['Fotos', 'Datos', 'Servicios', 'Vista previa'];

const DISTRICTS = [
  'El Tambo', 'Huancayo Centro', 'Chilca', 'San Carlos',
  'Pilcomayo', 'San Agustin', 'Sapallanga',
];

const AMENITIES = [
  { key: 'wifi', icon: 'wifi', label: 'WiFi' },
  { key: 'furnished', icon: 'bed', label: 'Amoblado' },
  { key: 'bathroom', icon: 'water-outline', label: 'Bano privado' },
  { key: 'kitchen', icon: 'restaurant', label: 'Cocina' },
  { key: 'parking', icon: 'car', label: 'Estacionamiento' },
  { key: 'laundry', icon: 'water', label: 'Lavanderia' },
  { key: 'security', icon: 'shield-checkmark', label: 'Seguridad' },
  { key: 'balcony', icon: 'sunny', label: 'Balcon' },
  { key: 'hotwater', icon: 'thermometer', label: 'Agua caliente' },
  { key: 'cable', icon: 'tv', label: 'Cable/TV' },
];

export default function NewListingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [size, setSize] = useState('');
  const [floor, setFloor] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [rules, setRules] = useState('');

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galeria para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - photos.length,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu camara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 10));
    }
  }, []);

  const removePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleAmenity = useCallback((key) => {
    setSelectedAmenities((prev) =>
      prev.includes(key)
        ? prev.filter((a) => a !== key)
        : [...prev, key]
    );
  }, []);

  const canProceed = () => {
    switch (step) {
      case 0: return photos.length >= 1;
      case 1: return title.trim() && price.trim() && district;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handlePublish = () => {
    Alert.alert(
      'Publicacion creada',
      'Tu habitacion ha sido publicada exitosamente. Los inquilinos podran verla pronto.',
      [{ text: 'Entendido' }]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((label, index) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepDot, index <= step && styles.stepDotActive]}>
            {index < step ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[styles.stepLabel, index <= step && styles.stepLabelActive]}>
            {label}
          </Text>
          {index < STEPS.length - 1 && (
            <View style={[styles.stepLine, index < step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPhotosStep = () => (
    <View>
      <Text style={styles.stepTitle}>Agrega fotos de tu habitacion</Text>
      <Text style={styles.stepSubtitle}>
        Las fotos de buena calidad atraen mas inquilinos. Minimo 1, maximo 10.
      </Text>

      <View style={styles.photosGrid}>
        {photos.map((uri, index) => (
          <View key={`photo-${index}`} style={styles.photoItem}>
            <Image source={{ uri }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => removePhoto(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
            {index === 0 && (
              <View style={styles.mainPhotoBadge}>
                <Text style={styles.mainPhotoText}>Principal</Text>
              </View>
            )}
          </View>
        ))}

        {photos.length < 10 && (
          <View style={styles.addPhotoButtons}>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={28} color="#E8442A" />
              <Text style={styles.addPhotoText}>Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={28} color="#E8442A" />
              <Text style={styles.addPhotoText}>Camara</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.photoCount}>{photos.length}/10 fotos</Text>
    </View>
  );

  const renderDataStep = () => (
    <View>
      <Text style={styles.stepTitle}>Informacion basica</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Titulo de la publicacion *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ej: Habitacion amoblada cerca a la UNCP"
          placeholderTextColor="#C0C0C0"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripcion</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe tu habitacion, que incluye, como es la zona..."
          placeholderTextColor="#C0C0C0"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Precio mensual (S/) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="350"
            placeholderTextColor="#C0C0C0"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Tamano (m2)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="14"
            placeholderTextColor="#C0C0C0"
            value={size}
            onChangeText={setSize}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Distrito *</Text>
        <View style={styles.districtGrid}>
          {DISTRICTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.districtChip, district === d && styles.districtChipActive]}
              onPress={() => setDistrict(d)}
            >
              <Text style={[styles.districtText, district === d && styles.districtTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Direccion</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Jr. Los Alamos 234"
          placeholderTextColor="#C0C0C0"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Piso</Text>
        <TextInput
          style={styles.textInput}
          placeholder="2do piso"
          placeholderTextColor="#C0C0C0"
          value={floor}
          onChangeText={setFloor}
        />
      </View>
    </View>
  );

  const renderAmenitiesStep = () => (
    <View>
      <Text style={styles.stepTitle}>Servicios y comodidades</Text>
      <Text style={styles.stepSubtitle}>
        Selecciona todo lo que incluye tu habitacion
      </Text>

      <View style={styles.amenitiesGrid}>
        {AMENITIES.map((amenity) => {
          const selected = selectedAmenities.includes(amenity.key);
          return (
            <TouchableOpacity
              key={amenity.key}
              style={[styles.amenityCard, selected && styles.amenityCardActive]}
              onPress={() => toggleAmenity(amenity.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.amenityIconBox, selected && styles.amenityIconBoxActive]}>
                <Ionicons
                  name={amenity.icon}
                  size={24}
                  color={selected ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text style={[styles.amenityLabel, selected && styles.amenityLabelActive]}>
                {amenity.label}
              </Text>
              {selected && (
                <Ionicons name="checkmark-circle" size={18} color="#E8442A" style={styles.amenityCheck} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.inputGroup, { marginTop: 24 }]}>
        <Text style={styles.label}>Reglas de la casa</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Ej: No mascotas, no fiestas, horario de visitas..."
          placeholderTextColor="#C0C0C0"
          value={rules}
          onChangeText={setRules}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderPreviewStep = () => (
    <View>
      <Text style={styles.stepTitle}>Vista previa</Text>
      <Text style={styles.stepSubtitle}>
        Asi se vera tu publicacion para los inquilinos
      </Text>

      <View style={styles.previewCard}>
        {photos.length > 0 ? (
          <Image source={{ uri: photos[0] }} style={styles.previewImage} />
        ) : (
          <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
            <Ionicons name="image" size={40} color="#D1D5DB" />
          </View>
        )}
        <View style={styles.previewContent}>
          <View style={styles.previewPriceRow}>
            <Text style={styles.previewPrice}>S/ {price || '---'}</Text>
            <Text style={styles.previewPriceUnit}>/mes</Text>
          </View>
          <Text style={styles.previewTitle}>{title || 'Sin titulo'}</Text>
          <View style={styles.previewLocation}>
            <Ionicons name="location" size={14} color="#E8442A" />
            <Text style={styles.previewLocationText}>
              {district || 'Sin distrito'}, Huancayo
            </Text>
          </View>
          {selectedAmenities.length > 0 && (
            <View style={styles.previewAmenities}>
              {selectedAmenities.slice(0, 4).map((key) => {
                const info = AMENITIES.find((a) => a.key === key);
                return (
                  <View key={key} style={styles.previewAmenityTag}>
                    <Ionicons name={info?.icon || 'ellipse'} size={12} color="#E8442A" />
                    <Text style={styles.previewAmenityText}>{info?.label || key}</Text>
                  </View>
                );
              })}
            </View>
          )}
          {description ? (
            <Text style={styles.previewDescription} numberOfLines={3}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fotos</Text>
          <Text style={styles.summaryValue}>{photos.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Servicios</Text>
          <Text style={styles.summaryValue}>{selectedAmenities.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tamano</Text>
          <Text style={styles.summaryValue}>{size ? `${size} m2` : 'No especificado'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Piso</Text>
          <Text style={styles.summaryValue}>{floor || 'No especificado'}</Text>
        </View>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderPhotosStep();
      case 1: return renderDataStep();
      case 2: return renderAmenitiesStep();
      case 3: return renderPreviewStep();
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Nueva Publicacion</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(step - 1)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
            <Text style={styles.backBtnText}>Atras</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            !canProceed() && styles.nextBtnDisabled,
            step === 0 && { flex: 1 },
          ]}
          onPress={() => {
            if (step < 3) {
              setStep(step + 1);
            } else {
              handlePublish();
            }
          }}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {step === 3 ? 'Publicar' : 'Siguiente'}
          </Text>
          {step < 3 && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: '#E8442A',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#E8442A',
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    right: -20,
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: '#E8442A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#E8442A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addPhotoBtn: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8442A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8442A',
    marginTop: 4,
  },
  photoCount: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
  },
  districtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  districtChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  districtChipActive: {
    borderColor: '#E8442A',
    backgroundColor: '#FEF2F2',
  },
  districtText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  districtTextActive: {
    color: '#E8442A',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  amenityCardActive: {
    borderColor: '#E8442A',
    backgroundColor: '#FEF2F2',
  },
  amenityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  amenityIconBoxActive: {
    backgroundColor: '#E8442A',
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  amenityLabelActive: {
    color: '#E8442A',
  },
  amenityCheck: {
    marginLeft: 4,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    padding: 16,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8442A',
  },
  previewPriceUnit: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewLocationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  previewAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  previewAmenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewAmenityText: {
    fontSize: 11,
    color: '#E8442A',
    fontWeight: '600',
    marginLeft: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E8442A',
    gap: 6,
  },
  nextBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
