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
from app.models.listing import Listing, RoomType, District
from app.models.swipe import Swipe, SwipeAction
from app.models.match import Match, MatchStatus
from app.models.message import Message

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
]

DEMO_LISTINGS = [
    # El Tambo (8)
    {"title": "Habitacion amoblada cerca UNCP con wifi", "description": "Habitacion individual amoblada a 5 minutos de la UNCP. Incluye cama, escritorio, closet. Wifi de fibra optica 100Mbps. Agua 24 horas. Zona tranquila ideal para estudiar.", "price": 380, "room_type": "single", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": False, "owner_idx": 0, "is_boosted": True, "address": "Av. Universitaria 456, El Tambo", "latitude": -12.0651, "longitude": -75.2049},
    {"title": "Cuarto con bano privado El Tambo economico", "description": "Cuarto amplio con bano privado en El Tambo. Piso de ceramico, ventana amplia con buena iluminacion. Cerca a mercados y transporte publico.", "price": 450, "room_type": "single", "district": "el_tambo", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "has_bathroom_private": True, "owner_idx": 0, "address": "Jr. Huancas 234, El Tambo", "latitude": -12.0623, "longitude": -75.2115},
    {"title": "Mini departamento para pareja El Tambo", "description": "Mini departamento ideal para pareja. Incluye cocineta, bano privado y espacio para sala. Zona residencial tranquila. Cerca a la avenida principal.", "price": 650, "room_type": "studio", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 0, "is_boosted": True, "address": "Av. Mariscal Castilla 1234, El Tambo", "latitude": -12.0587, "longitude": -75.2078},
    {"title": "Habitacion para estudiante UNCP precio comodo", "description": "Habitacion economica ideal para estudiante. A 10 minutos caminando de la UNCP. Bano compartido con un solo inquilino mas. Ambiente tranquilo.", "price": 280, "room_type": "single", "district": "el_tambo", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "owner_idx": 1, "address": "Psje. Los Pinos 89, El Tambo", "latitude": -12.0634, "longitude": -75.2032},
    {"title": "Cuarto doble amoblado cerca mercado Modelo", "description": "Cuarto doble con dos camas, ideal para compartir. Totalmente amoblado. Cerca al mercado Modelo de El Tambo. Agua las 24 horas.", "price": 320, "room_type": "double", "district": "el_tambo", "is_furnished": True, "has_wifi": False, "has_water_24h": True, "max_occupants": 2, "owner_idx": 1, "address": "Jr. Amazonas 567, El Tambo", "latitude": -12.0598, "longitude": -75.2067},
    {"title": "Departamento compartido para estudiantes El Tambo", "description": "Habitacion en departamento compartido. Cocina equipada, sala comun, lavanderia. Ideal para estudiantes que buscan convivencia.", "price": 350, "room_type": "shared", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_kitchen": True, "owner_idx": 3, "address": "Av. Ferrocarril 890, El Tambo", "latitude": -12.0612, "longitude": -75.2098},
    {"title": "Suite premium amoblada El Tambo todo incluido", "description": "Suite completamente amoblada con todo incluido. Cable, wifi, agua, luz. Bano privado con agua caliente. Estacionamiento disponible. La mejor opcion.", "price": 750, "room_type": "studio", "district": "el_tambo", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_parking": True, "has_kitchen": True, "owner_idx": 3, "is_boosted": True, "address": "Residencial Las Flores, El Tambo", "latitude": -12.0567, "longitude": -75.2023},
    {"title": "Habitacion economica con wifi rapido El Tambo", "description": "Habitacion basica pero con wifi de alta velocidad. Ideal para trabajadores remotos o estudiantes. Bano compartido. Zona segura.", "price": 300, "room_type": "single", "district": "el_tambo", "is_furnished": False, "has_wifi": True, "has_water_24h": False, "owner_idx": 1, "address": "Jr. Cusco 345, El Tambo", "latitude": -12.0645, "longitude": -75.2056},

    # Chilca (5)
    {"title": "Cuarto amplio en Chilca precio de oferta", "description": "Cuarto amplio en Chilca, excelente precio. Zona tranquila, cerca a paradero de combis. Ideal para trabajadores del centro.", "price": 250, "room_type": "single", "district": "chilca", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 1, "address": "Av. Jacinto Ibarra 456, Chilca", "latitude": -12.0789, "longitude": -75.2134},
    {"title": "Habitacion amoblada Chilca cerca a Continental", "description": "Habitacion amoblada a 15 minutos de la Universidad Continental. Wifi incluido. Bano compartido limpio. Inquilinos solo estudiantes.", "price": 350, "room_type": "single", "district": "chilca", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Grau 789, Chilca", "latitude": -12.0756, "longitude": -75.2109},
    {"title": "Departamento pequeno Chilca para profesional", "description": "Departamento pequeno ideal para profesional soltero. Incluye cocineta y bano privado. Zona residencial tranquila en Chilca.", "price": 500, "room_type": "studio", "district": "chilca", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "owner_idx": 2, "address": "Av. Leoncio Prado 123, Chilca", "latitude": -12.0812, "longitude": -75.2078},
    {"title": "Cuarto compartido barato Chilca para dos", "description": "Cuarto para compartir entre dos personas. Precio por persona. Bano compartido. Cerca a mercado y transporte. Excelente precio.", "price": 180, "room_type": "shared", "district": "chilca", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "max_occupants": 2, "owner_idx": 1, "address": "Jr. Bolivar 567, Chilca", "latitude": -12.0834, "longitude": -75.2156},
    {"title": "Habitacion con estacionamiento Chilca segura", "description": "Habitacion con espacio de estacionamiento incluido. Puerta metalica, zona segura. Ideal para quien tiene moto o auto.", "price": 420, "room_type": "single", "district": "chilca", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "has_parking": True, "owner_idx": 3, "address": "Urb. Santa Rosa, Chilca", "latitude": -12.0798, "longitude": -75.2089},

    # Cercado (4)
    {"title": "Cuarto centrico en Huancayo Real pleno centro", "description": "Habitacion en pleno centro de Huancayo, a una cuadra de la calle Real. Acceso a todos los servicios. Ideal para quien trabaja en el centro.", "price": 480, "room_type": "single", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Ancash 234, Cercado", "latitude": -12.0653, "longitude": -75.2050},
    {"title": "Habitacion ejecutiva Cercado de Huancayo amoblada", "description": "Habitacion tipo ejecutiva totalmente amoblada. Escritorio amplio, closet grande, bano semi-privado. Para profesionales exigentes.", "price": 550, "room_type": "single", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "owner_idx": 2, "address": "Jr. Puno 456, Cercado", "latitude": -12.0678, "longitude": -75.2034},
    {"title": "Mini departamento plaza Constitucion Huancayo", "description": "Mini departamento cerca de la plaza Constitucion. Vista a la calle, cocina equipada, bano privado. Perfecto para parejas.", "price": 700, "room_type": "apartment", "district": "cercado", "is_furnished": True, "has_wifi": True, "has_water_24h": True, "has_bathroom_private": True, "has_kitchen": True, "allows_couples": True, "owner_idx": 3, "address": "Av. Giraldes 890, Cercado", "latitude": -12.0690, "longitude": -75.2045},
    {"title": "Cuarto basico Cercado precio estudiante barato", "description": "Cuarto basico pero bien ubicado en el Cercado. Precio accesible para estudiantes. Cerca a bibliotecas y centros de estudio.", "price": 300, "room_type": "single", "district": "cercado", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "owner_idx": 2, "address": "Jr. Lima 678, Cercado", "latitude": -12.0665, "longitude": -75.2067},

    # Huancan (2)
    {"title": "Habitacion tranquila Huancan aire puro campo", "description": "Habitacion en zona tranquila de Huancan. Aire puro, naturaleza cercana. Ideal para quien busca tranquilidad fuera del ruido de la ciudad.", "price": 220, "room_type": "single", "district": "huancan", "is_furnished": False, "has_wifi": False, "has_water_24h": False, "owner_idx": 1, "address": "Av. Principal s/n, Huancan", "latitude": -12.0923, "longitude": -75.2234},
    {"title": "Cuarto con chacra vista hermosa Huancan relax", "description": "Cuarto con vista a chacras. Ambiente campestre pero con servicios basicos. A 20 minutos del centro en combi. Perfecto para relajarse.", "price": 200, "room_type": "single", "district": "huancan", "is_furnished": False, "has_wifi": False, "has_water_24h": True, "allows_pets": True, "owner_idx": 1, "address": "Sector La Rivera, Huancan", "latitude": -12.0956, "longitude": -75.2267},

    # Pilcomayo (1)
    {"title": "Habitacion nueva Pilcomayo construccion moderna", "description": "Habitacion en construccion nueva en Pilcomayo. Acabados modernos, bano compartido nuevo. Zona en crecimiento con buenos accesos.", "price": 320, "room_type": "single", "district": "pilcomayo", "is_furnished": False, "has_wifi": True, "has_water_24h": True, "owner_idx": 3, "address": "Urb. Los Jardines, Pilcomayo", "latitude": -12.0534, "longitude": -75.2312},
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
            print("⚠️  La base de datos ya tiene datos. Limpiando...")
            from app.core.database import engine, Base
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)
            print("🗑️  Tablas recreadas")

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
                is_verified=u_data.get("is_premium", False),  # Premium users are verified
                profile_photo=f"https://picsum.photos/seed/user{DEMO_USERS.index(u_data)}/200/200",
            )
            db.add(user)
            users.append(user)

        await db.flush()
        print(f"👤 {len(users)} usuarios creados")

        # Create listings
        landlords = [u for u in users if u.role in ("landlord", "both")]
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
        print(f"🏠 {len(listings)} habitaciones creadas")

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
        print(f"👆 {len(swipes)} swipes creados")

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
        print(f"🤝 {len(matches)} matches creados")

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

        await db.commit()
        print(f"💬 {len(chat_messages)} mensajes de chat creados")

    print("\n✅ Base de datos poblada con datos demo")
    print("\n📋 Credenciales de prueba:")
    print("  Propietario Premium: maria.quispe@demo.com / Demo1234!")
    print("  Inquilino:           jose.flores@demo.com / Demo1234!")
    print("  Test general:        test@cuartoya.pe / Test1234!")
    print(f"\n🏠 {len(DEMO_LISTINGS)} habitaciones en Huancayo")
    print("  - El Tambo: 8 | Chilca: 5 | Cercado: 4 | Huancan: 2 | Pilcomayo: 1")


if __name__ == "__main__":
    asyncio.run(seed_database())
