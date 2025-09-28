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
def get_peers_by_course_id(
    name: str = Query(..., description="Student name (you)"),
    courseId: str = Query(..., description="Course ID"),
    minSim: float = Query(0.8, ge=0.0, le=1.0, description="Minimum similarity (0..1)"),
    grades: str = Query("A,A-,B+", description="CSV of accepted grades"),
):
    """
    Returns peers with similar learning styles who achieved successful grades in the course (by ID).
    """
    drv = Neo4jDriver()
    try:
        drv.connect()
        recs = find_successful_peers_id(
            name=name,
            course_id=courseId,
            neodriver=drv,
            min_similarity=minSim,
            grades=_parse_grades(grades),
        )
        return [dict(r) for r in recs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()


@app.get("/peers/by-name")
def get_peers_by_course_name(
    name: str = Query(..., description="Student name (you)"),
    courseName: str = Query(..., description="Course name"),
    minSim: float = Query(0.8, ge=0.0, le=1.0, description="Minimum similarity (0..1)"),
    grades: str = Query("A,A-,B+", description="CSV of accepted grades"),
):
    """
    Returns peers with similar learning styles who achieved successful grades in the course (by Course Name).
    """
    drv = Neo4jDriver()
    try:
        drv.connect()
        recs = find_successful_peers_name(
            name=name,
            course_name=courseName,
            neodriver=drv,
            min_similarity=minSim,
            grades=_parse_grades(grades),
        )
        return [dict(r) for r in recs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()
