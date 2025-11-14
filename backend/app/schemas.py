from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ModelResultBase(BaseModel):
    model_name: str
    confidence_real: float
    confidence_fake: float
    label: str
    heatmap_path: Optional[str] = None

    class Config:
        from_attributes = True


class JobBase(BaseModel):
    id: int
    image_id: str
    file_path: str
    status: str
    created_at: datetime
    results: List[ModelResultBase] = []

    class Config:
        from_attributes = True
