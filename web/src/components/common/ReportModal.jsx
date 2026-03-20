import { useState } from 'react';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  X,
  Flag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'fake', label: 'Publicacion falsa' },
  { value: 'scam', label: 'Estafa' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'other', label: 'Otro' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Selecciona un motivo');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportsAPI.create({
        targetType,
        targetId,
        reason,
        description,
      });
      toast.success('Reporte enviado. Revisaremos tu denuncia pronto.');
      onClose();
      setReason('');
      setDescription('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-gray-900">Reportar</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Selecciona el motivo de tu reporte. Nuestro equipo revisara tu denuncia.
              </p>
            </div>

            {/* Reason options */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Motivo del reporte
              </label>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r.value
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className={`text-sm font-medium ${
                    reason === r.value ? 'text-primary' : 'text-gray-700'
                  }`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripcion (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema con mas detalle..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Enviar reporte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
