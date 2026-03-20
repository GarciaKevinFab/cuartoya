import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Camera,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Banknote,
  BedDouble,
  Ruler,
  FileText,
  Wifi,
  Bath,
  Car,
  Zap,
  Tv,
  AirVent,
  WashingMachine,
  CookingPot,
  Sofa,
  Lock,
  Droplets,
  Image,
  Loader2,
  Eye,
  Home,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const DISTRICTS = [
  'Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'San Agustin de Cajas',
  'Hualhuas', 'San Jeronimo de Tunan', 'Sapallanga', 'Viques', 'Huancan',
];

const ROOM_TYPES = [
  { value: 'single', label: 'Individual', desc: '1 persona' },
  { value: 'double', label: 'Doble', desc: '2 personas' },
  { value: 'suite', label: 'Suite', desc: 'Con sala' },
  { value: 'shared', label: 'Compartido', desc: '2+ personas' },
];

const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'bathroom', label: 'Bano privado', icon: Bath },
  { value: 'parking', label: 'Estacionamiento', icon: Car },
  { value: 'electricity', label: 'Luz incluida', icon: Zap },
  { value: 'tv', label: 'TV Cable', icon: Tv },
  { value: 'ac', label: 'Aire acondicionado', icon: AirVent },
  { value: 'laundry', label: 'Lavanderia', icon: WashingMachine },
  { value: 'kitchen', label: 'Cocina', icon: CookingPot },
  { value: 'furnished', label: 'Amoblado', icon: Sofa },
  { value: 'security', label: 'Seguridad', icon: Lock },
  { value: 'water', label: 'Agua 24h', icon: Droplets },
];

const RULES_OPTIONS = [
  'No mascotas',
  'No fumar',
  'No fiestas',
  'Horario de visitas',
  'Silencio despues de las 10pm',
  'Limpieza de areas comunes',
  'No cocinar en el cuarto',
];

const STEPS = [
  { label: 'Fotos', icon: Camera },
  { label: 'Datos', icon: FileText },
  { label: 'Comodidades', icon: Sparkles },
  { label: 'Vista previa', icon: Eye },
];

export default function NewListingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    district: '',
    address: '',
    roomType: 'single',
    size: '',
    amenities: [],
    rules: [],
    photos: [],
  });
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 8) {
      toast.error('Maximo 8 fotos');
      return;
    }

    const newPhotos = [...formData.photos, ...files];
    updateField('photos', newPhotos);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    updateField('photos', newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const toggleAmenity = (amenity) => {
    const amenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter((a) => a !== amenity)
      : [...formData.amenities, amenity];
    updateField('amenities', amenities);
  };

  const toggleRule = (rule) => {
    const rules = formData.rules.includes(rule)
      ? formData.rules.filter((r) => r !== rule)
      : [...formData.rules, rule];
    updateField('rules', rules);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.photos.length >= 1;
      case 1:
        return formData.title && formData.price && formData.district;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await listingsAPI.create(formData);
      toast.success('Cuarto publicado exitosamente');
      navigate('/my-listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            if (step > 0) setStep(step - 1);
            else navigate(-1);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Publicar cuarto</h1>
          <p className="text-sm text-gray-500">Paso {step + 1} de {STEPS.length}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all ${
                    isDone
                      ? 'bg-success text-white'
                      : isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : isDone ? 'text-success' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 0: Photos */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Fotos del cuarto</h2>
            <p className="text-sm text-gray-500">Sube entre 1 y 8 fotos. La primera sera la portada.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((preview, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img src={preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Portada
                  </div>
                )}
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.photos.length < 8 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-8 h-8" />
                <span className="text-xs font-medium">Agregar</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAdd}
            className="hidden"
          />
        </div>
      )}

      {/* Step 1: Basic data */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Datos del cuarto</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Titulo del anuncio *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ej: Cuarto amplio cerca a la UNCP"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Precio mensual (S/) *
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="350"
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tamano (m2)
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => updateField('size', e.target.value)}
                  placeholder="12"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Distrito *
            </label>
            <select
              value={formData.district}
              onChange={(e) => updateField('district', e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar distrito</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Direccion
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Ej: Jr. Arequipa 234"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de cuarto
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => updateField('roomType', rt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    formData.roomType === rt.value
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-semibold text-sm ${formData.roomType === rt.value ? 'text-primary' : 'text-gray-700'}`}>
                    {rt.label}
                  </p>
                  <p className="text-xs text-gray-500">{rt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Descripcion
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe tu cuarto: ubicacion, ambiente, ventajas..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: Amenities */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Comodidades</h2>
            <p className="text-sm text-gray-500">Selecciona lo que incluye tu cuarto</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AMENITIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleAmenity(value)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  formData.amenities.includes(value)
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${formData.amenities.includes(value) ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.amenities.includes(value) ? 'text-primary' : 'text-gray-600'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Reglas del cuarto</h3>
            <div className="flex flex-wrap gap-2">
              {RULES_OPTIONS.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => toggleRule(rule)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    formData.rules.includes(rule)
                      ? 'border-warning bg-yellow-50 text-warning'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Vista previa</h2>

          {/* Preview card */}
          <div className="card overflow-hidden">
            {/* Photo */}
            <div className="aspect-video bg-gray-100 relative">
              {photoPreviews[0] ? (
                <img src={photoPreviews[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {photoPreviews.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                  +{photoPreviews.length - 1} fotos
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {formData.title || 'Sin titulo'}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {formData.district || 'Distrito'}
                    {formData.address && ` - ${formData.address}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary flex items-center gap-1">
                    <Banknote className="w-5 h-5" />
                    S/{formData.price || '0'}
                  </div>
                  <span className="text-xs text-gray-400">/mes</span>
                </div>
              </div>

              {/* Type & Size */}
              <div className="flex gap-2">
                <span className="badge bg-primary-light text-primary">
                  <BedDouble className="w-3.5 h-3.5 mr-1" />
                  {ROOM_TYPES.find((rt) => rt.value === formData.roomType)?.label || 'Individual'}
                </span>
                {formData.size && (
                  <span className="badge bg-blue-50 text-blue-600">
                    <Ruler className="w-3.5 h-3.5 mr-1" />
                    {formData.size} m2
                  </span>
                )}
              </div>

              {/* Description */}
              {formData.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {formData.description}
                </p>
              )}

              {/* Amenities */}
              {formData.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Comodidades</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((a) => {
                      const am = AMENITIES.find((x) => x.value === a);
                      return (
                        <span key={a} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          {am?.label || a}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rules */}
              {formData.rules.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Reglas</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.rules.map((r) => (
                      <span key={r} className="text-xs text-warning bg-yellow-50 px-2.5 py-1.5 rounded-lg">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={() => {
            if (step > 0) setStep(step - 1);
            else navigate(-1);
          }}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Cancelar' : 'Atras'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-primary flex items-center gap-2"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publicar cuarto
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
