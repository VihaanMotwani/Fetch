def find_successful_peers_id(neodriver, student_name: str, course_id: str, min_similarity: float = 0.8, grades=("A","A-","B+")):
    
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {id: $course_id})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity >= $minSim 
    AND peerGrade.grade IN $grades
    RETURN peer.id AS id,
        peer.name AS name,
        peerGrade.grade AS grade,
        sim.similarity AS similarity
    ORDER BY sim.similarity DESC
    """,
    name=student_name,
    course_id=course_id,
    minSim=min_similarity,
    grades=grades,
    database_=neodriver._db
    )
    return records

def find_course_id_from_name(neodriver, course_name: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (c:Course {name: $course_name})
    RETURN c.id AS course_id
    LIMIT 1
    """,
    course_name=course_name,
    database_=neodriver._db
    )
    return records[0]["course_id"]

def find_peers_with_textbooks(neodriver, student_name: str, course_id: str, min_similarity: float = 0.8, grades=("A","A-","B+")):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {id: $course_id})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity > $minSim 
      AND peerGrade.grade IN $grades
    OPTIONAL MATCH (peer)-[interactionType:INTERACTED_WITH]->(textbook:Textbook)<-[:ASSIGNED_TO_A_COURSE]-(course)
    RETURN peer.id AS id,
           peer.name AS name,
           peerGrade.grade AS grade,
           sim.similarity AS similarity,
           collect(DISTINCT textbook.name) AS textbooks
    ORDER BY sim.similarity DESC
    """,
    name=student_name,
    course_id=course_id,
    minSim=min_similarity,
    grades=grades,
    database_=neodriver._db
    )
    return records
