import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

from neo4j_driver import Neo4jDriver
from query_functions import *
from ML import predict as ml_predict
from ai_summarizer import generate_summary
from models import *

load_dotenv()

app = FastAPI(title="Student Insight API", version="0.1.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _parse_grades(grades_csv: str) -> List[str]:
    if not grades_csv:
        return ["A", "A-", "B+"]
    return [g.strip() for g in grades_csv.split(",") if g.strip()]

@app.get("/peers")
def get_peers(
    name: str = Query(...),
    by: str = Query("id", pattern="^(id|name)$"),
    course: str = Query(...),
    minSim: float = Query(0.8, ge=0.0, le=1.0),
    grades: str = Query("A,A-,B+"),
    withTextbooks: bool = Query(False),
):
    drv = Neo4jDriver()
    try:
        drv.connect()

        # 1) resolve to course_id if needed
        if by == "name":
            course_id = find_course_id_from_name(drv, course_name=course)
            if not course_id:
                raise HTTPException(status_code=404, detail=f"Course not found: {course}")
        else:
            course_id = course

        grade_list = _parse_grades(grades)

        # 2) run the appropriate query
        if withTextbooks:
            recs = find_peers_with_textbooks(
                drv, student_name=name, course_id=course_id,
                min_similarity=minSim, grades=grade_list
            )
        else:
            recs = find_successful_peers_id(
                drv, student_name=name, course_id=course_id,
                min_similarity=minSim, grades=grade_list
            )

        # 3) normalize rows → dicts (your Cypher uses AS aliases already)
        out = []
        for r in recs:
            row = r if isinstance(r, dict) else (getattr(r, "data", lambda: dict(r))())
            item = {
                "id": row.get("id") or row.get("peer.id"),
                "name": row.get("name") or row.get("peer.name"),
                "grade": row.get("grade") or row.get("peerGrade.grade"),
                "similarity": float(row.get("similarity") or row.get("sim.similarity") or 0.0),
            }
            if withTextbooks:
                item["textbooks"] = row.get("textbooks") or []
            out.append(item)

        out.sort(key=lambda x: x["similarity"], reverse=True)
        return out

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()

@app.get("/course/learner-types")
def get_learner_types(
    by: str = Query("id", pattern="^(id|name)$"),
    course: str = Query(..., description="Course ID (by=id) or Course Name (by=name)"),
):
    drv = Neo4jDriver()
    try:
        drv.connect()
        course_id = course
        if by == "name":
            course_id = find_course_id_from_name(drv, course_name=course)
            if not course_id:
                raise HTTPException(status_code=404, detail=f"Course not found: {course}")

        recs = learner_types_enrolled_in_a_course(drv, course_id=course_id)
        # Normalize Neo4j records -> dicts
        out = [dict(r) if isinstance(r, dict) else dict(r) for r in recs]
        # shape: [{ c_id, c_name, grade, learning_style, students }]
        return out
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()

@app.get("/student/alumni")
def get_alumni_from_same_degree(studentName: str = Query(...)):
    drv = Neo4jDriver()
    try:
        drv.connect()
        student_id = find_student_id(drv, student_name=studentName)
        if not student_id:
            raise HTTPException(status_code=404, detail=f"Student not found: {studentName}")

        deg = find_student_degree(drv, student_id=student_id)
        if not deg or not deg.get("degree_id"):
            raise HTTPException(status_code=404, detail="Degree for student is missing or lacks degree_id")

        alumni = find_alumni_that_finished_from_same_degree(drv, degree_id=deg["degree_id"])
        # alumni is already a list of dicts per your function
        return {
            "student_id": student_id,
            "degree_id": deg["degree_id"],
            "degree_name": deg["degree_name"],
            "alumni": alumni,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()

@app.get("/ml/recommendations", tags=["ML"])
def get_ml_recommendations(
    name: str = Query(..., description="Student name to base recommendations on"),
):
    """Return ML-based course recommendations for a student.

    Calls ML.predict(name) which returns (courses:list[str], avg_score:float, sem_list:list[str]).
    """
    try:
        courses, avg_score, sem_list = ml_predict(name)
        recs = []
        for i, cname in enumerate(courses):
            recs.append({
                "rank": i + 1,
                "course_name": cname,
                "suggested_term": sem_list[i] if i < len(sem_list) else None
            })
        return {
            "student_name": name,
            "avg_peer_score": avg_score,
            "recommendations": recs
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/summary", tags=["AI"])
def ai_summary(body: AISummaryRequest):
    try:
        # Convert to a raw dict and pass straight through to the LLM prompt builder
        result = generate_summary(body.model_dump())
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI summary failed: {e}")