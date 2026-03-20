from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    match_id: str
    sender_id: str
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageList(BaseModel):
    messages: List[MessageResponse]
    has_more: bool = False
