import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Crown,
  Check,
  X,
  Zap,
  Heart,
  Star,
  Eye,
  MessageCircle,
  Shield,
  TrendingUp,
  Building2,
  BarChart3,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: '',
    description: 'Para empezar a buscar',
    color: 'gray',
    features: [
      { text: '10 likes por dia', included: true },
      { text: 'Chat con matches', included: true },
      { text: 'Filtros basicos', included: true },
      { text: 'Super likes', included: false },
      { text: 'Ver quien te dio like', included: false },
      { text: 'Prioridad en busqueda', included: false },
      { text: 'Estadisticas avanzadas', included: false },
      { text: 'Sin anuncios', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 25,
    period: '/mes',
    description: 'Para inquilinos serios',
    color: 'primary',
    popular: true,
    features: [
      { text: 'Likes ilimitados', included: true },
      { text: 'Chat con matches', included: true },
      { text: 'Filtros avanzados', included: true },
      { text: '5 super likes por dia', included: true },
      { text: 'Ver quien te dio like', included: true },
      { text: 'Prioridad en busqueda', included: true },
      { text: 'Estadisticas avanzadas', included: false },
      { text: 'Sin anuncios', included: true },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 65,
    period: '/mes',
    description: 'Para propietarios con varios cuartos',
    color: 'warning',
    features: [
      { text: 'Likes ilimitados', included: true },
      { text: 'Chat prioritario', included: true },
      { text: 'Todos los filtros', included: true },
      { text: 'Super likes ilimitados', included: true },
      { text: 'Ver quien te dio like', included: true },
      { text: 'Prioridad maxima', included: true },
      { text: 'Estadisticas avanzadas', included: true },
      { text: 'Sin anuncios', included: true },
    ],
  },
];

export default function PremiumPage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = user?.plan || 'free';

  const handleSubscribe = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return;

    setSelectedPlan(planId);
    setIsLoading(true);
    try {
      const { data } = await paymentsAPI.subscribe({ plan: planId });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        updateUser({ plan: planId });
        toast.success('Plan actualizado exitosamente');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
      </div>

      <div className="text-center mb-10 mt-4">
        <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          Encuentra tu cuarto mas rapido
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Elige el plan perfecto para ti
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Desbloquea funciones premium y aumenta tus posibilidades de encontrar el cuarto ideal
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isPro = plan.id === 'pro';
          const isAgency = plan.id === 'agency';

          return (
            <div
              key={plan.id}
              className={`card relative overflow-hidden transition-all ${
                plan.popular
                  ? 'ring-2 ring-primary shadow-lg scale-105 md:scale-105'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="bg-primary text-white text-xs font-bold py-1.5 text-center uppercase tracking-wide">
                  Mas popular
                </div>
              )}

              <div className="p-6">
                {/* Plan header */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    plan.id === 'free' ? 'bg-gray-100' : plan.id === 'pro' ? 'bg-primary-light' : 'bg-yellow-50'
                  }`}>
                    {plan.id === 'free' ? (
                      <Heart className="w-6 h-6 text-gray-500" />
                    ) : plan.id === 'pro' ? (
                      <Crown className="w-6 h-6 text-primary" />
                    ) : (
                      <Building2 className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price === 0 ? 'Gratis' : `S/${plan.price}`}
                    </span>
                    {plan.period && (
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-success" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <X className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-center text-sm">
                    Plan actual
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full py-3 rounded-xl bg-gray-50 text-gray-400 font-medium text-center text-sm">
                    Plan basico
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.id === 'pro'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg'
                    } disabled:opacity-50`}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </span>
                    ) : (
                      `Elegir ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-gray-900 text-center mb-8">
          Preguntas frecuentes
        </h3>
        <div className="space-y-4">
          {[
            {
              q: 'Puedo cancelar en cualquier momento?',
              a: 'Si, puedes cancelar tu suscripcion cuando quieras. Seguiras teniendo acceso a las funciones premium hasta el final de tu periodo de facturacion.',
            },
            {
              q: 'Que metodos de pago aceptan?',
              a: 'Aceptamos tarjetas de debito y credito (Visa, Mastercard), transferencias bancarias, y pagos por Yape o Plin.',
            },
            {
              q: 'Puedo cambiar de plan?',
              a: 'Si, puedes actualizar o cambiar tu plan en cualquier momento. El cambio se aplicara de inmediato y se ajustara tu facturacion.',
            },
            {
              q: 'Los super likes son diferentes de los likes normales?',
              a: 'Si, los super likes notifican directamente al propietario y tienen mayor prioridad. El propietario sabra que estas muy interesado en su cuarto.',
            },
          ].map(({ q, a }, i) => (
            <details key={i} className="card group">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-medium text-gray-900 text-sm">{q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg">
                  &#9662;
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
