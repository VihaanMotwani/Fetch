def find_successful_peers_id(neodriver, name: str, course_id: str, min_similarity: float = 0.8, grades=("A","A-","B+")):
    
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
    name=name,
    course_id=course_id,
    minSim=min_similarity,
    grades=grades,
    database_=neodriver._db
    )
    return records

def find_successful_peers_name(neodriver, name: str, course_name: str, min_similarity: float = 0.8, grades=("A","A-","B+")):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {name: $course_name})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity > $minSim 
    AND peerGrade.grade IN $grades
    RETURN peer.id AS id,
        peer.name AS name,
        peerGrade.grade AS grade,
        sim.similarity AS similarity
    ORDER BY sim.similarity DESC
    """,
    name=name,
    course_name=course_name,
    minSim=min_similarity,
    grades=grades,
    database_=neodriver._db
    )
    return records
