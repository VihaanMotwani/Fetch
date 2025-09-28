from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PeerIn(BaseModel):
    id: str
    name: Optional[str] = None
    course_id: Optional[str] = None
    grade: Optional[str] = None
    similarity: Optional[float] = None
    learner_type: Optional[str] = None

class GradeBucketIn(BaseModel):
    grade: str
    count: int

class LearnerTypeBucketIn(BaseModel):
    label: str
    count: int
    within_grade: Optional[str] = None

class FiltersIn(BaseModel):
    min_similarity: Optional[float] = Field(None, ge=0, le=1)
    selected_grades: Optional[List[str]] = None
    course_mode: Optional[str] = None
    course: Optional[str] = None

class AISummaryRequest(BaseModel):
    student_name: Optional[str] = None
    filters: Optional[FiltersIn] = None
    peers: Optional[List[PeerIn]] = None
    grade_distribution: Optional[List[GradeBucketIn]] = None
    learner_type_distribution: Optional[List[LearnerTypeBucketIn]] = None
    textbooks: Optional[List[Dict[str, Any]]] = None  # if you have it

class AISummaryResponse(BaseModel):
    summary_md: str
    recommendations: List[str]
    cautions: List[str]
    actions: List[str]