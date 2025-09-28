# ai_summarizer.py
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Peer:
    id: str
    name: Optional[str]
    course_id: Optional[str]
    grade: Optional[str]
    similarity: Optional[float]
    learner_type: Optional[str]

@dataclass
class GradeBucket:
    grade: str
    count: int

@dataclass
class LearnerTypeBucket:
    label: str
    count: int
    within_grade: Optional[str] = None  # if you’re faceting by grade

@dataclass
class SummaryResult:
    summary_md: str
    recommendations: List[str]
    cautions: List[str]
    actions: List[str]


def _client() -> OpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=key)

def _model() -> str:
    return os.getenv("LLM_MODEL", "gpt-4o-mini")

def _build_prompt(payload: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    payload fields expected (frontend can send what it has):
    - student_name: str
    - filters: { min_similarity: float, selected_grades: [str], course_mode: str, course: str }
    - peers: [ { id, name?, course_id?, grade?, similarity?, learner_type? }, ... ]
    - grade_distribution: [ { grade, count }, ... ]
    - learner_type_distribution: [
        { label, count, within_grade? }, ...
      ]
    - textbooks?: (optional, if you include that panel)
    """
    # Light compression (so we don’t send giant arrays)
    peers = payload.get("peers", [])[:200]  # cap
    grade_dist = payload.get("grade_distribution", [])
    learner_dist = payload.get("learner_type_distribution", [])
    filters = payload.get("filters", {})
    student_name = payload.get("student_name") or "Unknown Student"

    system = (
        "You are an advisor that explains academic data clearly and briefly. "
        "Use the provided aggregates and samples to infer other peers patterns. "
        "When uncertain, note limitations. Do not fabricate data."
    )

    # Few guardrails + persona + exact JSON schema
    user = f"""
    STUDENT: {student_name}

    FILTERS:
    - min_similarity: {filters.get('min_similarity')}
    - course_mode: {filters.get('course_mode')}
    - course_query: {filters.get('course')}

    GRADE_DISTRIBUTION (overall):
    {grade_dist}

    LEARNER_TYPE_DISTRIBUTION:
    {learner_dist}

    PEERS (sample, max 200):
    {[
        {
            "id": p.get("id"),
            "course_id": p.get("course_id"),
            "grade": p.get("grade"),
            "similarity": p.get("similarity"),
            "learner_type": p.get("learner_type"),
        } for p in peers
    ]}

    OBJECTIVE:
    1) Provide a concise personalized summary (observation and inference) of peers of the user in plain text (no md formatting, no special characters like new lines and slash ns) for the student.
    2) Provide 3-6 concrete recommendations tailored to the data (courses to target, study tactics aligned to learner type distribution, when to take a course, etc.).
    3) Provide 2-4 cautions/limitations (data gaps, bias/selection, low sample sizes).
    4) Provide 2-4 next actions the student can take (e.g., explore specific course groups, raise/lower similarity threshold, check required textbooks, meet advisor).
    """
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

def generate_summary(payload: Dict[str, Any]):
    msgs = _build_prompt(payload)
    client = _client()

    resp = client.chat.completions.create(
        model=_model(),
        messages=msgs,
        temperature=0.4
    )
    content = resp.choices[0].message.content
    content = content.replace("\n", " ")

    return content
