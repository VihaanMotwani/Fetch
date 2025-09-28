import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

from neo4j_driver import Neo4jDriver
from query_functions import *

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
    name: str = Query(..., description="Student name (you)"),
    by: str = Query("id", pattern="^(id|name)$", description="How to interpret 'course'"),
    course: str = Query(..., description="Course ID (by=id) or Course Name (by=name)"),
    minSim: float = Query(0.8, ge=0.0, le=1.0),
    grades: str = Query("A,A-,B+"),
):
    drv = Neo4jDriver()
    try:
        drv.connect()

        # Resolve course_id if needed
        if by == "name":
            course_id = find_course_id_from_name(drv, course_name=course)
            if not course_id:
                raise HTTPException(status_code=404, detail=f"Course not found: {course}")
        else:
            course_id = course

        # Always use the ID-based finder
        grade_list = _parse_grades(grades)
        recs = find_successful_peers_id(
            drv,
            student_name=name,
            course_id=course_id,
            min_similarity=minSim,
            grades=grade_list,
        )

        out = []
        for r in recs:
            row = r if isinstance(r, dict) else (getattr(r, "data", lambda: dict(r))())
            pid  = row.get("id")  or row.get("peer.id")
            pname= row.get("name") or row.get("peer.name")
            grade= row.get("grade") or row.get("peerGrade.grade")
            sim  = row.get("similarity") or row.get("sim.similarity") or 0.0
            out.append({"id": pid, "name": pname, "grade": grade, "similarity": float(sim)})

        out.sort(key=lambda x: x["similarity"], reverse=True)
        return out

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()