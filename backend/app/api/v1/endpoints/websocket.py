import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, async_session
from app.core.security import verify_token
from app.models.match import Match
from app.models.message import Message
from app.models.user import User

router = APIRouter()

# In-memory connection manager (use Redis Pub/Sub for production scaling)
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, key: str, websocket: WebSocket):
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def send_to(self, key: str, message: dict):
        if key in self.active_connections:
            for ws in self.active_connections[key]:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, key: str, message: dict):
        await self.send_to(key, message)


manager = ConnectionManager()


@router.websocket("/chat/{match_id}")
async def websocket_chat(websocket: WebSocket, match_id: str):
    """WebSocket endpoint for real-time chat."""
    # Authenticate via query param
    token = websocket.query_params.get("token", "")
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Token invalido")
        return

    user_id = payload.get("sub")

    # Verify match access
    async with async_session() as db:
        result = await db.execute(select(Match).where(Match.id == match_id))
        match = result.scalar_one_or_none()
        if not match or (match.tenant_id != user_id and match.landlord_id != user_id):
            await websocket.close(code=4003, reason="No tienes acceso a este chat")
            return

    await manager.connect(f"chat_{match_id}", websocket)

    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)

            # Save message to DB
            async with async_session() as db:
                message = Message(
                    match_id=match_id,
                    sender_id=user_id,
                    content=msg_data.get("content", ""),
                )
                db.add(message)
                await db.commit()
                await db.refresh(message)

                # Get sender name
                result = await db.execute(select(User).where(User.id == user_id))
                sender = result.scalar_one()

                # Broadcast to all in chat
                await manager.broadcast(f"chat_{match_id}", {
                    "type": "message",
                    "id": message.id,
                    "sender_id": user_id,
                    "sender_name": sender.full_name,
                    "content": message.content,
                    "created_at": str(message.created_at),
                })

    except WebSocketDisconnect:
        manager.disconnect(f"chat_{match_id}", websocket)
    except Exception:
        manager.disconnect(f"chat_{match_id}", websocket)


@router.websocket("/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for live notifications."""
    token = websocket.query_params.get("token", "")
    payload = verify_token(token)
    if not payload or payload.get("sub") != user_id:
        await websocket.close(code=4001, reason="Token invalido")
        return

    await manager.connect(f"notif_{user_id}", websocket)

    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(f"notif_{user_id}", websocket)
