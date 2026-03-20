# CuartoYa

> App tipo Tinder para alquiler de habitaciones en Huancayo, Peru.
> Conecta propietarios e inquilinos a traves de un sistema de swipe y match.

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Backend | FastAPI + SQLAlchemy + Alembic |
| Base de Datos | PostgreSQL 16 + Redis 7 |
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | React Native + Expo (Android) |
| Storage | Cloudinary (prod) / Local (dev) |
| Pagos | Culqi (tarjeta, Yape, Plin) |
| Notificaciones | Firebase FCM + Resend (email) |
| Auth | JWT + bcrypt |
| Deploy | Railway (backend) + Vercel (web) + EAS Build (mobile) |

## Inicio Rapido (5 minutos)

### Prerequisitos
- Python 3.12+
- Node.js 20+
- Docker Desktop
- Git

### Instalacion

```bash
git clone https://github.com/Memory-Bank/cuartoya.git
cd cuartoya
make setup
make dev
```

Abre: http://localhost:5173

### Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Propietario Premium | maria.quispe@demo.com | Demo1234! |
| Propietario | carlos.pumayalli@demo.com | Demo1234! |
| Inquilino UNCP | jose.flores@demo.com | Demo1234! |
| Inquilino Continental | ana.gutierrez@demo.com | Demo1234! |
| Test general | test@cuartoya.pe | Test1234! |

## Variables de Entorno

Copia los archivos `.env.example` como `.env` en cada carpeta:

| Servicio | Donde obtenerlo | Costo |
|----------|-----------------|-------|
| Cloudinary | cloudinary.com - Dashboard | Gratis (25GB) |
| Culqi | culqi.com - Panel - API Keys | Gratis (3.99% por transaccion) |
| Firebase FCM | console.firebase.google.com | Gratis |
| Resend | resend.com - API Keys | Gratis (3k emails/mes) |

**En desarrollo, si no tienes los tokens:**
- Cloudinary: las fotos se guardan en `/backend/uploads/` local
- Culqi: los pagos siempre devuelven exito simulado
- FCM: las notificaciones se imprimen en consola
- Resend: los emails se imprimen en consola

La app funciona 100% sin ningun token externo durante desarrollo.

## API Docs

http://localhost:8000/docs (Swagger UI automatico de FastAPI)

## Estructura del Proyecto

```
cuartoya/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/  # Endpoints REST + WebSocket
│   │   ├── core/              # Config, DB, Security
│   │   ├── models/            # SQLAlchemy models (6 modelos)
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── tests/             # pytest test suite
│   │   └── utils/             # Seed data script
│   ├── Dockerfile
│   └── requirements.txt
├── web/                     # React Web App
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks (useChat)
│   │   ├── services/          # API client
│   │   └── store/             # Zustand stores
│   ├── Dockerfile
│   └── package.json
├── mobile/                  # Expo React Native App
│   ├── src/
│   │   ├── screens/           # Screen components
│   │   ├── components/        # UI components
│   │   ├── navigation/        # React Navigation
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client
│   │   └── store/             # Zustand stores
│   ├── app.json
│   └── package.json
├── docker-compose.yml
├── Makefile
└── README.md
```

## Tests

```bash
make test
# o directamente:
cd backend && pytest app/tests/ -v --asyncio-mode=auto
```

## Endpoints API

### Auth
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login (JWT)
- `POST /api/v1/auth/logout` - Cerrar sesion

### Listings
- `GET /api/v1/listings` - Feed con filtros (distrito, precio, amenities)
- `POST /api/v1/listings` - Crear publicacion
- `GET /api/v1/listings/{id}` - Detalle
- `POST /api/v1/listings/{id}/photos` - Subir fotos

### Swipes
- `POST /api/v1/swipes` - Like/Nope/Super Like
- `GET /api/v1/swipes/pending` - Solicitudes pendientes
- `POST /api/v1/swipes/{id}/accept` - Aceptar (crea Match)

### Matches & Chat
- `GET /api/v1/matches` - Mis matches
- `POST /api/v1/matches/{id}/messages` - Enviar mensaje
- `WS /ws/chat/{match_id}` - Chat en tiempo real

### Payments
- `POST /api/v1/payments/subscribe` - Plan Pro/Agency
- `POST /api/v1/payments/boost` - Impulsar publicacion

## Despliegue en Produccion

**Backend (Railway):**
1. Conecta el repo en railway.app
2. Agrega PostgreSQL y Redis como addons
3. Configura las variables de entorno

**Web (Vercel):**
1. Importa el directorio `web/` en vercel.com
2. Configura `VITE_API_URL` al dominio de Railway

**Mobile (EAS Build):**
```bash
cd mobile
npx eas-cli build --platform android
```

## Roadmap

- [x] MVP: swipe, match, chat basico
- [ ] Verificacion DNI con RENIEC API
- [ ] Pagos reales con Culqi
- [ ] Push notifications FCM
- [ ] iOS App Store
- [ ] Expansion a Tarma, La Oroya, Junin

## Licencia

MIT - Kevin Garcia Espiritu - Huancayo, Peru
