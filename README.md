# CuartoYa

> App tipo Tinder para alquiler de habitaciones en la region Junin, Peru.
> Conecta propietarios e inquilinos a traves de un sistema de swipe y match.
> Disponible en: Huancayo, Tarma, La Oroya, Junin, Jauja, Concepcion, Chupaca.

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 + Alembic |
| Base de Datos | PostgreSQL 16 + Redis 7 |
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | React Native + Expo (Android + iOS) |
| Storage | Cloudinary (prod) / Local (dev) |
| Pagos | Culqi v2 (tarjeta, Yape, Plin) |
| Notificaciones | Firebase FCM HTTP v1 + Resend (email) |
| Verificacion | RENIEC API via apis.net.pe |
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
git clone https://github.com/GarciaKevinFab/cuartoya.git
cd cuartoya
make setup
make dev
```

Abre: http://localhost:5173

### Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@cuartoya.pe | Admin1234! |
| Propietario Premium | maria.quispe@demo.com | Demo1234! |
| Propietario | carlos.pumayalli@demo.com | Demo1234! |
| Inquilino UNCP | jose.flores@demo.com | Demo1234! |
| Inquilino Continental | ana.gutierrez@demo.com | Demo1234! |
| Test general | test@cuartoya.pe | Test1234! |
| Propietario Tarma | lucia.meza@demo.com | Demo1234! |
| Propietario La Oroya | miguel.huaroc@demo.com | Demo1234! |
| Propietario Junin | elena.yauri@demo.com | Demo1234! |

## Variables de Entorno

Copia los archivos `.env.example` como `.env` en cada carpeta:

| Servicio | Donde obtenerlo | Costo |
|----------|-----------------|-------|
| Cloudinary | cloudinary.com - Dashboard | Gratis (25GB) |
| Culqi | culqi.com - Panel - API Keys | Gratis (3.99% por transaccion) |
| Firebase FCM | console.firebase.google.com | Gratis |
| Resend | resend.com - API Keys | Gratis (3k emails/mes) |
| RENIEC API | apis.net.pe - API Keys | Gratis (50 consultas/dia) |

**En desarrollo, si no tienes los tokens:**
- Cloudinary: las fotos se guardan en `/backend/uploads/` local
- Culqi: los pagos siempre devuelven exito simulado
- FCM: las notificaciones se imprimen en consola
- Resend: los emails se imprimen en consola
- RENIEC: la verificacion simula respuesta exitosa

La app funciona 100% sin ningun token externo durante desarrollo.

## API Docs

http://localhost:8000/docs (Swagger UI automatico de FastAPI)

## Estructura del Proyecto

```
cuartoya/
├── backend/                   # FastAPI Backend v2.0
│   ├── alembic/                 # Migraciones de base de datos
│   ├── app/
│   │   ├── api/v1/endpoints/    # 10 routers REST + WebSocket
│   │   │   ├── auth.py            # Registro, login, reset password
│   │   │   ├── users.py           # Perfil, foto, stats
│   │   │   ├── listings.py        # CRUD habitaciones + feed
│   │   │   ├── swipes.py          # Like/nope/super + accept/reject
│   │   │   ├── matches.py         # Matches + chat REST
│   │   │   ├── payments.py        # Suscripciones + boost
│   │   │   ├── verification.py    # Verificacion DNI RENIEC
│   │   │   ├── favorites.py       # Guardar habitaciones
│   │   │   ├── reports.py         # Reportes + bloqueos
│   │   │   ├── admin.py           # Panel administrador
│   │   │   └── websocket.py       # Chat + notificaciones WS
│   │   ├── core/                # Config, DB, Security, Rate Limit
│   │   ├── models/              # 9 modelos SQLAlchemy
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (6 servicios)
│   │   ├── tests/               # pytest test suite
│   │   └── utils/               # Seed data (35+ listings, 11 users)
│   ├── Dockerfile
│   └── requirements.txt
├── web/                       # React Web App
│   ├── src/
│   │   ├── components/          # Navbar, ReportModal, ProtectedRoute
│   │   ├── pages/               # 13 paginas completas
│   │   ├── hooks/               # useChat (WebSocket)
│   │   ├── services/            # API client (7 modulos)
│   │   └── store/               # Zustand (auth, feed, matches)
│   ├── Dockerfile
│   └── package.json
├── mobile/                    # Expo React Native (Android + iOS)
│   ├── src/
│   │   ├── screens/             # 15 pantallas completas
│   │   ├── components/          # ListingSwipeCard
│   │   ├── navigation/          # React Navigation (3 navigators)
│   │   ├── hooks/               # useNotifications (FCM)
│   │   ├── services/            # API client
│   │   └── store/               # Zustand (auth, feed, matches)
│   ├── eas.json                 # EAS Build config
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

## Endpoints API (40+ endpoints)

### Auth
- `POST /api/v1/auth/register` - Registro (auto-admin por email)
- `POST /api/v1/auth/login` - Login (JWT)
- `POST /api/v1/auth/logout` - Cerrar sesion
- `POST /api/v1/auth/forgot-password` - Enviar email de recuperacion
- `POST /api/v1/auth/reset-password` - Restablecer contrasena

### Listings (con filtro por ciudad)
- `GET /api/v1/listings` - Feed con filtros (ciudad, distrito, precio, amenities)
- `POST /api/v1/listings` - Crear publicacion
- `GET /api/v1/listings/{id}` - Detalle
- `PUT /api/v1/listings/{id}` - Editar
- `DELETE /api/v1/listings/{id}` - Desactivar
- `POST /api/v1/listings/{id}/photos` - Subir hasta 6 fotos
- `POST /api/v1/listings/{id}/view` - Registrar vista

### Swipes
- `POST /api/v1/swipes` - Like/Nope/Super Like (limite diario free)
- `GET /api/v1/swipes/pending` - Solicitudes pendientes (landlord)
- `POST /api/v1/swipes/{id}/accept` - Aceptar (crea Match + notifica)
- `POST /api/v1/swipes/{id}/reject` - Rechazar

### Matches & Chat
- `GET /api/v1/matches` - Mis matches
- `GET /api/v1/matches/{id}` - Detalle match
- `POST /api/v1/matches/{id}/messages` - Enviar mensaje
- `GET /api/v1/matches/{id}/messages` - Historial paginado
- `WS /ws/chat/{match_id}` - Chat en tiempo real
- `WS /ws/notifications/{user_id}` - Notificaciones live

### Payments (Culqi v2)
- `POST /api/v1/payments/subscribe` - Plan Pro (S/25) / Agency (S/65)
- `POST /api/v1/payments/boost` - Impulsar publicacion (7/15/30 dias)
- `GET /api/v1/payments/history` - Historial de pagos
- `POST /api/v1/payments/cancel` - Cancelar suscripcion
- `POST /api/v1/webhooks/culqi` - Webhook Culqi

### Verificacion (RENIEC)
- `POST /api/v1/verification/dni` - Verificar DNI con RENIEC
- `GET /api/v1/verification/status` - Estado de verificacion

### Favoritos
- `POST /api/v1/favorites/{listing_id}` - Guardar habitacion
- `DELETE /api/v1/favorites/{listing_id}` - Quitar de favoritos
- `GET /api/v1/favorites` - Mis favoritos

### Reportes y Bloqueos
- `POST /api/v1/reports` - Reportar usuario o publicacion
- `GET /api/v1/reports/my` - Mis reportes
- `POST /api/v1/users/{id}/block` - Bloquear usuario
- `DELETE /api/v1/users/{id}/block` - Desbloquear
- `GET /api/v1/users/me/blocked` - Lista de bloqueados

### Admin
- `GET /api/v1/admin/stats` - Estadisticas globales
- `GET /api/v1/admin/users` - Lista de usuarios
- `PUT /api/v1/admin/users/{id}/ban` - Banear/desbanear
- `GET /api/v1/admin/reports` - Lista de reportes
- `PUT /api/v1/admin/reports/{id}/resolve` - Resolver reporte
- `GET /api/v1/admin/listings` - Lista de publicaciones
- `DELETE /api/v1/admin/listings/{id}` - Eliminar publicacion
- `GET /api/v1/admin/revenue` - Desglose de ingresos

## Ciudades Disponibles

| Ciudad | Distritos |
|--------|-----------|
| Huancayo | El Tambo, Chilca, Cercado, Huancan, Pilcomayo |
| Tarma | Tarma Centro, Acobamba, Palca |
| La Oroya | La Oroya Centro, Santa Rosa de Sacco, Yauli |
| Junin | Junin Centro, Ondores, Carhuamayo |
| Jauja | Jauja Centro, Sausa, Yauyos |
| Concepcion | Concepcion Centro, Aco, Orcotuna |
| Chupaca | Chupaca Centro, Ahuac, Huachac |

## Despliegue en Produccion

**Backend (Railway):**
1. Conecta el repo en railway.app
2. Agrega PostgreSQL y Redis como addons
3. Configura las variables de entorno del `.env.example`

**Web (Vercel):**
1. Importa el directorio `web/` en vercel.com
2. Configura `VITE_API_URL` al dominio de Railway

**Mobile (EAS Build):**
```bash
cd mobile
npx eas-cli build --platform android  # APK o AAB
npx eas-cli build --platform ios      # iOS build
npx eas-cli submit --platform android # Subir a Google Play
npx eas-cli submit --platform ios     # Subir a App Store
```

## Roadmap

- [x] MVP: swipe, match, chat basico
- [x] Verificacion DNI con RENIEC API
- [x] Pagos reales con Culqi v2
- [x] Push notifications FCM HTTP v1
- [x] iOS App Store (configuracion completa)
- [x] Expansion a Tarma, La Oroya, Junin, Jauja, Concepcion, Chupaca
- [x] Sistema de favoritos
- [x] Reportes y bloqueos
- [x] Panel de administrador
- [x] Rate limiting
- [x] Recuperacion de contrasena completa
- [x] Alembic migrations
- [ ] Verificacion por selfie con IA
- [ ] Chat con envio de imagenes
- [ ] Mapa interactivo con pins de habitaciones
- [ ] Sistema de calificaciones y resenas
- [ ] Integración WhatsApp Business API
- [ ] App para Smart TV (tours virtuales)

## Licencia

MIT - Kevin Garcia Espiritu - Huancayo, Peru
