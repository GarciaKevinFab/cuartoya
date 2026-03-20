"""
Seed script for CuartoYa demo data.
Run: cd backend && python -m app.utils.seed_data
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone
from app.core.database import async_session, create_tables
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.listing import Listing, RoomType, District, City
from app.models.swipe import Swipe, SwipeAction
from app.models.match import Match, MatchStatus
from app.models.message import Message
from app.models.report import Report, ReportReason, ReportStatus
from app.models.favorite import Favorite

DEMO_USERS = [
    # Propietarios
    {
        "email": "maria.quispe@demo.com", "password": "Demo1234!",
        "full_name": "Maria Quispe Huaman", "role": "landlord",
        "phone": "+51987654321", "is_premium": True,
        "bio": "Propietaria con 5 habitaciones en El Tambo. Experiencia de 3 anios alquilando.",
    },
    {
        "email": "carlos.pumayalli@demo.com", "password": "Demo1234!",
        "full_name": "Carlos Pumayalli Torres", "role": "landlord",
        "phone": "+51987654322",
        "bio": "Alquilo cuartos cerca a la UNCP. Buenos precios para estudiantes.",
    },
    {
        "email": "rosa.ccanto@demo.com", "password": "Demo1234!",
        "full_name": "Rosa Ccanto Palomino", "role": "landlord",
        "phone": "+51987654323", "is_premium": True,
        "bio": "Habitaciones en el Cercado de Huancayo. Todas amobladas y con wifi.",
    },
    {
        "email": "agencia.premium@demo.com", "password": "Demo1234!",
        "full_name": "Inmuebles Junin SAC", "role": "landlord",
        "phone": "+51987654324", "is_premium": True,
        "bio": "Agencia inmobiliaria con las mejores habitaciones de Huancayo.",
    },
    # Inquilinos
    {
        "email": "jose.flores@demo.com", "password": "Demo1234!",
        "full_name": "Jose Flores Mendoza", "role": "tenant",
        "phone": "+51987654325", "university": "UNCP", "occupation": "estudiante",
        "bio": "Estudiante de Ingenieria de Sistemas en la UNCP. Busco cuarto cerca al campus.",
    },
    {
        "email": "ana.gutierrez@demo.com", "password": "Demo1234!",
        "full_name": "Ana Gutierrez Rojas", "role": "tenant",
        "phone": "+51987654326", "university": "Universidad Continental",
        "occupation": "estudiante",
        "bio": "Estudiante de Derecho en Continental. Tranquila y ordenada.",
    },
    {
        "email": "pedro.yupanqui@demo.com", "password": "Demo1234!",
        "full_name": "Pedro Yupanqui Ccama", "role": "tenant",
        "phone": "+51987654327", "occupation": "trabajador",
        "bio": "Trabajo en el centro de Huancayo. Busco habitacion tranquila.",
    },
    # Test general
    {
        "email": "test@cuartoya.pe", "password": "Test1234!",
        "full_name": "Usuario de Prueba", "role": "both",
        "phone": "+51987654328",
        "bio": "Cuenta de prueba para desarrollo.",
    },
    # Admin
    {
        "email": "admin@cuartoya.pe", "password": "Admin1234!",
        "full_name": "Administrador CuartoYa", "role": "admin",
        "phone": "+51987654329",
        "bio": "Cuenta de administrador del sistema.",
    },
    # Propietarios en nuevas ciudades
    {
        "email": "luis.tarma@demo.com", "password": "Demo1234!",
        "full_name": "Luis Zavala Contreras", "role": "landlord",
        "phone": "+51987654330",
        "bio": "Propietario en Tarma. Habitaciones con vista a la campiña.",
    },
    {
        "email": "elena.oroya@demo.com", "password": "Demo1234!",
        "full_name": "Elena Rodriguez Ponce", "role": "landlord",
        "phone": "+51987654331",
        "bio": "Alquilo habitaciones en La Oroya para trabajadores mineros.",
    },
    {
        "email": "victor.junin@demo.com", "password": "Demo1234!",
        "full_name": "Victor Huaman Crispin", "role": "landlord",
        "phone": "+51987654332",
        "bio": "Habitaciones en Junin, cerca al Lago de los Reyes.",
    },
]

DEMO_LISTINGS = [
    # El Tambo (8) - Huancayo
    {"title": "Habitacion amoblada cerca UNCP con wifi", "description": "Habitacion individual amoblada a 5 minutos de la UNCP. Incluye cama, escritorio, closet. Wifi de fibra optica 100Mbps. Agua 24 horas. Zona tranquila ideal para estudiar.", "price": 380, "room_type": "single", "city": "huancayo", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": False, "owner_idx": 0, "is_boosted": True, "address": "Av. Universitaria 456, El Tambo", "latitude": -12.0651, "longitude": -75.2049},
    {"title": "Cuarto con bano privado El Tambo economico", "description": "Cuarto amplio con bano privado en El Tambo. Piso de ceramico, ventana amplia con buena iluminacion. Cerca a mercados y transporte publico.", "price": 450, "room_type": "single", "city": "huancayo", "district": "el_tambo", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "has_bathroom_private": True, "owner_idx": 0, "address": "Jr. Huancas 234, El Tambo", "latitude": -12.0623, "longitude": -75.2115},
    {"title": "Mini departamento para pareja El Tambo", "description": "Mini departamento ideal para pareja. Incluye cocineta, bano privado y espacio para sala. Zona residencial tranquila. Cerca a la avenida principal.", "price": 650, "room_type": "studio", "city": "huancayo", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 0, "is_boosted": True, "address": "Av. Mariscal Castilla 1234, El Tambo", "latitude": -12.0587, "longitude": -75.2078},
    {"title": "Habitacion para estudiante UNCP precio comodo", "description": "Habitacion economica ideal para estudiante. A 10 minutos caminando de la UNCP. Bano compartido con un solo inquilino mas. Ambiente tranquilo.", "price": 280, "room_type": "single", "city": "huancayo", "district": "el_tambo", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "owner_idx": 1, "address": "Psje. Los Pinos 89, El Tambo", "latitude": -12.0634, "longitude": -75.2032},
    {"title": "Cuarto doble amoblado cerca mercado Modelo", "description": "Cuarto doble con dos camas, ideal para compartir. Totalmente amoblado. Cerca al mercado Modelo de El Tambo. Agua las 24 horas.", "price": 320, "room_type": "double", "city": "huancayo", "district": "el_tambo", "is_furnished": True, "has_wifi": False, "has_water_24h": True, "max_occupants": 2, "owner_idx": 1, "address": "Jr. Amazonas 567, El Tambo", "latitude": -12.0598, "longitude": -75.2067},
    {"title": "Departamento compartido para estudiantes El Tambo", "description": "Habitacion en departamento compartido. Cocina equipada, sala comun, lavanderia. Ideal para estudiantes que buscan convivencia.", "price": 350, "room_type": "shared", "city": "huancayo", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_kitchen": True, "owner_idx": 3, "address": "Av. Ferrocarril 890, El Tambo", "latitude": -12.0612, "longitude": -75.2098},
    {"title": "Suite premium amoblada El Tambo todo incluido", "description": "Suite completamente amoblada con todo incluido. Cable, wifi, agua, luz. Bano privado con agua caliente. Estacionamiento disponible. La mejor opcion.", "price": 750, "room_type": "studio", "city": "huancayo", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_parking": True, "has_kitchen": True, "owner_idx": 3, "is_boosted": True, "address": "Residencial Las Flores, El Tambo", "latitude": -12.0567, "longitude": -75.2023},
    {"title": "Habitacion economica con wifi rapido El Tambo", "description": "Habitacion basica pero con wifi de alta velocidad. Ideal para trabajadores remotos o estudiantes. Bano compartido. Zona segura.", "price": 300, "room_type": "single", "city": "huancayo", "district": "el_tambo", "is_furnished": False, "has_wifi": True, "has_water_24h": False, "owner_idx": 1, "address": "Jr. Cusco 345, El Tambo", "latitude": -12.0645, "longitude": -75.2056},

    # Chilca (5) - Huancayo
    {"title": "Cuarto amplio en Chilca precio de oferta", "description": "Cuarto amplio en Chilca, excelente precio. Zona tranquila, cerca a paradero de combis. Ideal para trabajadores del centro.", "price": 250, "room_type": "single", "city": "huancayo", "district": "chilca", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 1, "address": "Av. Jacinto Ibarra 456, Chilca", "latitude": -12.0789, "longitude": -75.2134},
    {"title": "Habitacion amoblada Chilca cerca a Continental", "description": "Habitacion amoblada a 15 minutos de la Universidad Continental. Wifi incluido. Bano compartido limpio. Inquilinos solo estudiantes.", "price": 350, "room_type": "single", "city": "huancayo", "district": "chilca", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Grau 789, Chilca", "latitude": -12.0756, "longitude": -75.2109},
    {"title": "Departamento pequeno Chilca para profesional", "description": "Departamento pequeno ideal para profesional soltero. Incluye cocineta y bano privado. Zona residencial tranquila en Chilca.", "price": 500, "room_type": "studio", "city": "huancayo", "district": "chilca", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "owner_idx": 2, "address": "Av. Leoncio Prado 123, Chilca", "latitude": -12.0812, "longitude": -75.2078},
    {"title": "Cuarto compartido barato Chilca para dos", "description": "Cuarto para compartir entre dos personas. Precio por persona. Bano compartido. Cerca a mercado y transporte. Excelente precio.", "price": 180, "room_type": "shared", "city": "huancayo", "district": "chilca", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "max_occupants": 2, "owner_idx": 1, "address": "Jr. Bolivar 567, Chilca", "latitude": -12.0834, "longitude": -75.2156},
    {"title": "Habitacion con estacionamiento Chilca segura", "description": "Habitacion con espacio de estacionamiento incluido. Puerta metalica, zona segura. Ideal para quien tiene moto o auto.", "price": 420, "room_type": "single", "city": "huancayo", "district": "chilca", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "has_parking": True, "owner_idx": 3, "address": "Urb. Santa Rosa, Chilca", "latitude": -12.0798, "longitude": -75.2089},

    # Cercado (4) - Huancayo
    {"title": "Cuarto centrico en Huancayo Real pleno centro", "description": "Habitacion en pleno centro de Huancayo, a una cuadra de la calle Real. Acceso a todos los servicios. Ideal para quien trabaja en el centro.", "price": 480, "room_type": "single", "city": "huancayo", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Ancash 234, Cercado", "latitude": -12.0653, "longitude": -75.2050},
    {"title": "Habitacion ejecutiva Cercado de Huancayo amoblada", "description": "Habitacion tipo ejecutiva totalmente amoblada. Escritorio amplio, closet grande, bano semi-privado. Para profesionales exigentes.", "price": 550, "room_type": "single", "city": "huancayo", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "owner_idx": 2, "address": "Jr. Puno 456, Cercado", "latitude": -12.0678, "longitude": -75.2034},
    {"title": "Mini departamento plaza Constitucion Huancayo", "description": "Mini departamento cerca de la plaza Constitucion. Vista a la calle, cocina equipada, bano privado. Perfecto para parejas.", "price": 700, "room_type": "apartment", "city": "huancayo", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 3, "address": "Av. Giraldes 890, Cercado", "latitude": -12.0690, "longitude": -75.2045},
    {"title": "Cuarto basico Cercado precio estudiante barato", "description": "Cuarto basico pero bien ubicado en el Cercado. Precio accesible para estudiantes. Cerca a bibliotecas y centros de estudio.", "price": 300, "room_type": "single", "city": "huancayo", "district": "cercado", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Lima 678, Cercado", "latitude": -12.0665, "longitude": -75.2067},

    # Huancan (2) - Huancayo
    {"title": "Habitacion tranquila Huancan aire puro campo", "description": "Habitacion en zona tranquila de Huancan. Aire puro, naturaleza cercana. Ideal para quien busca tranquilidad fuera del ruido de la ciudad.", "price": 220, "room_type": "single", "city": "huancayo", "district": "huancan", "is_furnished": False, "has_wifi": False, "has_water_24h": False, "owner_idx": 1, "address": "Av. Principal s/n, Huancan", "latitude": -12.0923, "longitude": -75.2234},
    {"title": "Cuarto con chacra vista hermosa Huancan relax", "description": "Cuarto con vista a chacras. Ambiente campestre pero con servicios basicos. A 20 minutos del centro en combi. Perfecto para relajarse.", "price": 200, "room_type": "single", "city": "huancayo", "district": "huancan", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "allows_pets": True, "owner_idx": 1, "address": "Sector La Rivera, Huancan", "latitude": -12.0956, "longitude": -75.2267},

    # Pilcomayo (1) - Huancayo
    {"title": "Habitacion nueva Pilcomayo construccion moderna", "description": "Habitacion en construccion nueva en Pilcomayo. Acabados modernos, bano compartido nuevo. Zona en crecimiento con buenos accesos.", "price": 320, "room_type": "single", "city": "huancayo", "district": "pilcomayo", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "owner_idx": 3, "address": "Urb. Los Jardines, Pilcomayo", "latitude": -12.0534, "longitude": -75.2312},

    # ===== TARMA (5) =====
    {"title": "Habitacion centrica en Tarma con wifi incluido", "description": "Habitacion en el centro de Tarma, cerca a la plaza principal. Wifi incluido. Bano compartido. Ideal para turistas o trabajadores temporales.", "price": 250, "room_type": "single", "city": "tarma", "district": "tarma_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 9, "address": "Jr. Lima 123, Tarma", "latitude": -11.4190, "longitude": -75.6900},
    {"title": "Cuarto amoblado vista a la campiña Tarma", "description": "Cuarto con vista panoramica a la hermosa campiña de Tarma. Amoblado, tranquilo, aire puro. Perfecto para descansar.", "price": 280, "room_type": "single", "city": "tarma", "district": "tarma_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": False, "owner_idx": 9, "is_boosted": True, "address": "Av. Pacheco 456, Tarma", "latitude": -11.4175, "longitude": -75.6885},
    {"title": "Mini depa en Acobamba Tarma para pareja", "description": "Mini departamento en Acobamba, distrito de Tarma. Incluye cocina y bano privado. Zona tranquila y segura. Clima agradable.", "price": 400, "room_type": "studio", "city": "tarma", "district": "acobamba_tarma", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 9, "address": "Calle Principal s/n, Acobamba", "latitude": -11.3850, "longitude": -75.6700},
    {"title": "Habitacion economica en Palca para trabajador", "description": "Habitacion sencilla en Palca, ideal para trabajadores de la zona. Servicios basicos incluidos. Precio muy accesible.", "price": 180, "room_type": "single", "city": "tarma", "district": "palca", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 9, "address": "Av. Central s/n, Palca", "latitude": -11.3600, "longitude": -75.5800},
    {"title": "Cuarto doble Tarma centro para compartir", "description": "Cuarto doble en el centro de Tarma para compartir. Amoblado con dos camas. Bano compartido. Cerca a todo.", "price": 200, "room_type": "double", "city": "tarma", "district": "tarma_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "max_occupants": 2, "owner_idx": 9, "address": "Jr. Huancayo 789, Tarma", "latitude": -11.4200, "longitude": -75.6920},

    # ===== LA OROYA (5) =====
    {"title": "Habitacion para trabajador minero La Oroya centro", "description": "Habitacion para trabajador minero en La Oroya. Cerca a la zona industrial. Agua caliente, puerta segura. Precio mensual accesible.", "price": 300, "room_type": "single", "city": "la_oroya", "district": "la_oroya_centro", "is_furnished": True, "has_wifi": False, "has_water_24h": True, "owner_idx": 10, "address": "Av. Horacio Zevallos 234, La Oroya", "latitude": -11.5230, "longitude": -75.9000},
    {"title": "Cuarto amoblado Santa Rosa de Sacco tranquilo", "description": "Cuarto amoblado en Santa Rosa de Sacco. Zona tranquila alejada del ruido industrial. Bano compartido. Ambiente familiar.", "price": 280, "room_type": "single", "city": "la_oroya", "district": "santa_rosa_sacco", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 10, "address": "Jr. Los Andes 567, Santa Rosa de Sacco", "latitude": -11.5150, "longitude": -75.8950},
    {"title": "Habitacion con wifi La Oroya centro economica", "description": "Habitacion con wifi incluido en el centro de La Oroya. Cerca a mercados y transporte. Ideal para profesionales.", "price": 320, "room_type": "single", "city": "la_oroya", "district": "la_oroya_centro", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "owner_idx": 10, "is_boosted": True, "address": "Jr. Arequipa 890, La Oroya", "latitude": -11.5245, "longitude": -75.9020},
    {"title": "Cuarto en Yauli para trabajadores de mina", "description": "Cuarto sencillo en Yauli. Perfecto para trabajadores de las minas cercanas. Servicios basicos. Precio comodo.", "price": 200, "room_type": "single", "city": "la_oroya", "district": "yauli", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 10, "address": "Calle Principal s/n, Yauli", "latitude": -11.6700, "longitude": -76.0880},
    {"title": "Mini departamento La Oroya con cocina propia", "description": "Mini departamento con cocina propia y bano privado en La Oroya. Ideal para parejas o profesionales que buscan independencia.", "price": 450, "room_type": "studio", "city": "la_oroya", "district": "la_oroya_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 10, "address": "Av. Lima 456, La Oroya", "latitude": -11.5210, "longitude": -75.8980},

    # ===== JUNIN (5) =====
    {"title": "Habitacion en Junin centro cerca al lago", "description": "Habitacion en el centro de Junin, a minutos del hermoso Lago de los Reyes. Clima frio pero habitacion acogedora. Buen precio.", "price": 220, "room_type": "single", "city": "junin", "district": "junin_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 11, "address": "Jr. Bolivar 123, Junin", "latitude": -11.1600, "longitude": -75.9930},
    {"title": "Cuarto para turista en Junin vista al lago", "description": "Cuarto con vista al Lago Junin. Amoblado y con calefaccion. Perfecto para turistas o investigadores de naturaleza.", "price": 300, "room_type": "single", "city": "junin", "district": "junin_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "owner_idx": 11, "is_boosted": True, "address": "Av. San Martin 456, Junin", "latitude": -11.1580, "longitude": -75.9910},
    {"title": "Habitacion economica Ondores naturaleza pura", "description": "Habitacion sencilla en Ondores. Aire puro, naturaleza, tranquilidad total. Para quienes buscan desconectarse de la ciudad.", "price": 150, "room_type": "single", "city": "junin", "district": "ondores", "is_furnished": False, "has_wifi": False, "has_water_24h": False, "owner_idx": 11, "address": "Plaza Principal s/n, Ondores", "latitude": -11.0700, "longitude": -76.1500},
    {"title": "Cuarto en Carhuamayo para trabajadores zona", "description": "Cuarto en Carhuamayo con servicios basicos. Cerca a la carretera central. Ideal para trabajadores de paso o temporada.", "price": 180, "room_type": "single", "city": "junin", "district": "carhuamayo", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 11, "address": "Av. Principal 789, Carhuamayo", "latitude": -10.9200, "longitude": -76.0300},
    {"title": "Departamento compartido Junin para investigadores", "description": "Habitacion en departamento compartido en Junin. Cocina equipada. Ideal para investigadores o biologos que estudian el Lago Junin.", "price": 350, "room_type": "shared", "city": "junin", "district": "junin_centro", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_kitchen": True, "owner_idx": 11, "address": "Jr. Grau 234, Junin", "latitude": -11.1620, "longitude": -75.9950},
]

PLACEHOLDER_PHOTOS = [
    "https://picsum.photos/seed/room{}/800/600",
]


async def seed_database():
    """Populate database with demo data."""
    await create_tables()

    async with async_session() as db:
        # Check if data already exists
        from sqlalchemy import select, func
        result = await db.execute(select(func.count(User.id)))
        if result.scalar() > 0:
            print("[WARN]  La base de datos ya tiene datos. Limpiando...")
            from app.core.database import engine, Base
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)
            print("[OK]  Tablas recreadas")

    async with async_session() as db:
        # Create users
        users = []
        for u_data in DEMO_USERS:
            user = User(
                id=str(uuid.uuid4()),
                email=u_data["email"],
                phone=u_data["phone"],
                full_name=u_data["full_name"],
                hashed_password=get_password_hash(u_data["password"]),
                role=u_data["role"],
                is_premium=u_data.get("is_premium", False),
                bio=u_data.get("bio"),
                occupation=u_data.get("occupation"),
                university=u_data.get("university"),
                is_verified=u_data.get("is_premium", False),
                profile_photo=f"https://picsum.photos/seed/user{DEMO_USERS.index(u_data)}/200/200",
            )
            db.add(user)
            users.append(user)

        await db.flush()
        print(f"[+] {len(users)} usuarios creados (incluye admin y propietarios de nuevas ciudades)")

        # Create listings
        listings = []
        for i, l_data in enumerate(DEMO_LISTINGS):
            owner = users[l_data["owner_idx"]]
            photos = [
                f"https://picsum.photos/seed/room{i}a/800/600",
                f"https://picsum.photos/seed/room{i}b/800/600",
                f"https://picsum.photos/seed/room{i}c/800/600",
            ]

            listing = Listing(
                id=str(uuid.uuid4()),
                owner_id=owner.id,
                title=l_data["title"],
                description=l_data["description"],
                price=l_data["price"],
                room_type=l_data["room_type"],
                city=l_data.get("city", "huancayo"),
                district=l_data["district"],
                address=l_data.get("address"),
                latitude=l_data.get("latitude"),
                longitude=l_data.get("longitude"),
                max_occupants=l_data.get("max_occupants", 1),
                is_furnished=l_data.get("is_furnished", False),
                has_wifi=l_data.get("has_wifi", False),
                has_water_24h=l_data.get("has_water_24h", False),
                has_parking=l_data.get("has_parking", False),
                has_kitchen=l_data.get("has_kitchen", False),
                has_bathroom_private=l_data.get("has_bathroom_private", False),
                allows_couples=l_data.get("allows_couples", False),
                allows_pets=l_data.get("allows_pets", False),
                allows_smoking=l_data.get("allows_smoking", False),
                is_boosted=l_data.get("is_boosted", False),
                boost_until=datetime.now(timezone.utc) + timedelta(days=7) if l_data.get("is_boosted") else None,
                photos=photos,
                available_from=date.today(),
                view_count=50 + i * 12,
            )
            db.add(listing)
            listings.append(listing)

        await db.flush()
        print(f"[+] {len(listings)} habitaciones creadas")

        # Create swipes (tenants swiping on listings)
        tenants = [u for u in users if u.role in ("tenant", "both")]
        swipes = []
        swipe_pairs = set()

        # Jose likes several listings
        for idx in [0, 2, 5, 6, 8, 9, 14]:
            if idx < len(listings):
                pair = (tenants[0].id, listings[idx].id)
                if pair not in swipe_pairs:
                    swipe = Swipe(
                        id=str(uuid.uuid4()),
                        swiper_id=tenants[0].id,
                        listing_id=listings[idx].id,
                        action=SwipeAction.like if idx != 2 else SwipeAction.super_like,
                    )
                    db.add(swipe)
                    swipes.append(swipe)
                    swipe_pairs.add(pair)

        # Ana likes other listings
        for idx in [1, 3, 7, 10, 13]:
            if idx < len(listings):
                pair = (tenants[1].id, listings[idx].id)
                if pair not in swipe_pairs:
                    swipe = Swipe(
                        id=str(uuid.uuid4()),
                        swiper_id=tenants[1].id,
                        listing_id=listings[idx].id,
                        action=SwipeAction.like,
                    )
                    db.add(swipe)
                    swipes.append(swipe)
                    swipe_pairs.add(pair)

        # Pedro nopes and likes
        for idx in [0, 4, 11, 15]:
            if idx < len(listings):
                pair = (tenants[2].id, listings[idx].id)
                if pair not in swipe_pairs:
                    swipe = Swipe(
                        id=str(uuid.uuid4()),
                        swiper_id=tenants[2].id,
                        listing_id=listings[idx].id,
                        action=SwipeAction.nope if idx in [4, 15] else SwipeAction.like,
                    )
                    db.add(swipe)
                    swipes.append(swipe)
                    swipe_pairs.add(pair)

        await db.flush()
        print(f"[+] {len(swipes)} swipes creados")

        # Create matches
        match_data = [
            (0, tenants[0].id, users[0].id),   # Jose matched with Maria's listing 0
            (2, tenants[0].id, users[0].id),    # Jose super_liked Maria's listing 2
            (9, tenants[1].id, users[2].id),    # Ana matched with Rosa's listing 9
            (0, tenants[2].id, users[0].id),    # Pedro matched with Maria's listing 0
            (3, tenants[1].id, users[1].id),    # Ana matched with Carlos's listing 3
        ]

        matches = []
        for listing_idx, tenant_id, landlord_id in match_data:
            if listing_idx < len(listings):
                match = Match(
                    id=str(uuid.uuid4()),
                    listing_id=listings[listing_idx].id,
                    tenant_id=tenant_id,
                    landlord_id=landlord_id,
                    status=MatchStatus.active,
                )
                db.add(match)
                matches.append(match)

        await db.flush()
        print(f"[+] {len(matches)} matches creados")

        # Create messages for matches
        chat_messages = [
            # Match 0: Jose and Maria
            (0, tenants[0].id, "Hola Maria, estoy interesado en tu habitacion cerca de la UNCP"),
            (0, users[0].id, "Hola Jose! Claro, la habitacion esta disponible desde este mes"),
            (0, tenants[0].id, "Genial! Podria ir a verla este sabado?"),
            (0, users[0].id, "Si, perfecto. Te espero a las 10am. La direccion es Av. Universitaria 456"),
            (0, tenants[0].id, "Ahi estare. Gracias!"),

            # Match 1: Jose super_liked
            (1, tenants[0].id, "Hola! Me encanto el mini depa. Es muy bonito"),
            (1, users[0].id, "Gracias Jose! Es nuestra mejor unidad. Incluye todo"),

            # Match 2: Ana and Rosa
            (2, tenants[1].id, "Buenas tardes, me interesa la habitacion en Chilca"),
            (2, users[2].id, "Buenas tardes Ana. Esta cerca a Continental, te queda bien?"),
            (2, tenants[1].id, "Si, estudio en Continental. El precio incluye wifi?"),
            (2, users[2].id, "Si, wifi de 50Mbps incluido en el precio"),

            # Match 3: Pedro and Maria
            (3, tenants[2].id, "Buenas, aun esta disponible el cuarto?"),
            (3, users[0].id, "Si, todavia esta disponible. Cuando podrias venir a verlo?"),

            # Match 4: Ana and Carlos
            (4, tenants[1].id, "Hola Carlos, vi tu publicacion del cuarto para estudiantes"),
            (4, users[1].id, "Hola Ana! Si, es ideal para estudiantes. Precio comodo"),
        ]

        for match_idx, sender_id, content in chat_messages:
            if match_idx < len(matches):
                msg = Message(
                    id=str(uuid.uuid4()),
                    match_id=matches[match_idx].id,
                    sender_id=sender_id,
                    content=content,
                )
                db.add(msg)

        await db.flush()
        print(f"[+] {len(chat_messages)} mensajes de chat creados")

        # Create demo reports
        report1 = Report(
            id=str(uuid.uuid4()),
            reporter_id=tenants[0].id,  # Jose reports
            reported_listing_id=listings[11].id if len(listings) > 11 else listings[0].id,
            reported_user_id=listings[11].owner_id if len(listings) > 11 else listings[0].owner_id,
            reason=ReportReason.fake,
            description="Las fotos no corresponden a la habitacion real. Fui a verla y es completamente diferente.",
            status=ReportStatus.pending,
        )
        db.add(report1)

        report2 = Report(
            id=str(uuid.uuid4()),
            reporter_id=tenants[1].id,  # Ana reports
            reported_user_id=users[1].id,  # Carlos
            reason=ReportReason.harassment,
            description="El propietario me envia mensajes inapropiados por WhatsApp.",
            status=ReportStatus.pending,
        )
        db.add(report2)

        report3 = Report(
            id=str(uuid.uuid4()),
            reporter_id=tenants[2].id,  # Pedro reports
            reported_listing_id=listings[6].id if len(listings) > 6 else listings[0].id,
            reported_user_id=listings[6].owner_id if len(listings) > 6 else listings[0].owner_id,
            reason=ReportReason.scam,
            description="Pide adelanto por transferencia antes de mostrar la habitacion. Posible estafa.",
            status=ReportStatus.reviewed,
        )
        db.add(report3)

        await db.flush()
        print(f"[+] 3 reportes demo creados")

        # Create demo favorites
        fav1 = Favorite(
            id=str(uuid.uuid4()),
            user_id=tenants[0].id,  # Jose
            listing_id=listings[6].id if len(listings) > 6 else listings[0].id,
        )
        db.add(fav1)

        fav2 = Favorite(
            id=str(uuid.uuid4()),
            user_id=tenants[0].id,  # Jose
            listing_id=listings[13].id if len(listings) > 13 else listings[1].id,
        )
        db.add(fav2)

        fav3 = Favorite(
            id=str(uuid.uuid4()),
            user_id=tenants[1].id,  # Ana
            listing_id=listings[2].id,
        )
        db.add(fav3)

        fav4 = Favorite(
            id=str(uuid.uuid4()),
            user_id=tenants[1].id,  # Ana
            listing_id=listings[14].id if len(listings) > 14 else listings[0].id,
        )
        db.add(fav4)

        await db.flush()
        print(f"[+] 4 favoritos demo creados")

        await db.commit()

    # Count listings per city
    huancayo_count = sum(1 for l in DEMO_LISTINGS if l.get("city", "huancayo") == "huancayo")
    tarma_count = sum(1 for l in DEMO_LISTINGS if l.get("city") == "tarma")
    la_oroya_count = sum(1 for l in DEMO_LISTINGS if l.get("city") == "la_oroya")
    junin_count = sum(1 for l in DEMO_LISTINGS if l.get("city") == "junin")

    print("\n[OK] Base de datos poblada con datos demo v2.0")
    print("\n[INFO] Credenciales de prueba:")
    print("  Propietario Premium: maria.quispe@demo.com / Demo1234!")
    print("  Inquilino:           jose.flores@demo.com / Demo1234!")
    print("  Test general:        test@cuartoya.pe / Test1234!")
    print("  Administrador:       admin@cuartoya.pe / Admin1234!")
    print(f"\n[+] {len(DEMO_LISTINGS)} habitaciones en la region Junin:")
    print(f"  Huancayo: {huancayo_count} (El Tambo: 8 | Chilca: 5 | Cercado: 4 | Huancan: 2 | Pilcomayo: 1)")
    print(f"  Tarma: {tarma_count}")
    print(f"  La Oroya: {la_oroya_count}")
    print(f"  Junin: {junin_count}")
    print(f"\n[+] 3 reportes demo | [+] 4 favoritos demo")


if __name__ == "__main__":
    asyncio.run(seed_database())
