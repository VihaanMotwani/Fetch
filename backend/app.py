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
        # Use existing helper that queries by course_id
        # The helper has hard-coded thresholds; we’ll filter post-query to respect minSim/grades if needed.
        records, filtered = [], []
        recs = find_successful_peers_id(name=name, course_id=courseId, neodriver=drv)

        accepted = set(_parse_grades(grades))
        for r in recs:
            # r should expose .data() or mapping-like fields depending on neo4j version
            row = dict(r)
            # Normalize keys based on your Cypher RETURN
            sim = float(row.get("sim.similarity") or row.get("sim_similarity") or row.get("similarity") or 0.0)
            grade = row.get("peerGrade.grade") or row.get("grade") or row.get("peer_grade")
            peer_id = row.get("peer.id") or row.get("id") or row.get("peer_id")
            peer_name = row.get("peer.name") or row.get("name") or row.get("peer_name")

            if sim >= minSim and (not accepted or (grade in accepted)):
                filtered.append({
                    "id": peer_id,
                    "name": peer_name,
                    "grade": grade,
                    "similarity": sim,
                })
        # Sort like the UI expects
        filtered.sort(key=lambda x: x["similarity"], reverse=True)
        print(filtered)
        return filtered
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
        # The helper has hard-coded thresholds; we’ll filter post-query to respect minSim/grades if needed.
        records, filtered = [], []
        recs = find_successful_peers_name(name=name, course_name=courseName, neodriver=drv)

        accepted = set(_parse_grades(grades))
        for r in recs:
            # r should expose .data() or mapping-like fields depending on neo4j version
            row = dict(r)
            # Normalize keys based on your Cypher RETURN
            sim = float(row.get("sim.similarity") or row.get("sim_similarity") or row.get("similarity") or 0.0)
            grade = row.get("peerGrade.grade") or row.get("grade") or row.get("peer_grade")
            peer_id = row.get("peer.id") or row.get("id") or row.get("peer_id")
            peer_name = row.get("peer.name") or row.get("name") or row.get("peer_name")

            if sim >= minSim and (not accepted or (grade in accepted)):
                filtered.append({
                    "id": peer_id,
                    "name": peer_name,
                    "grade": grade,
                    "similarity": sim,
                })
        # Sort like the UI expects
        filtered.sort(key=lambda x: x["similarity"], reverse=True)
        print(filtered)
        return filtered
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        drv.close()
