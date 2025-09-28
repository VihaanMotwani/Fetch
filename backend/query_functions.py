def find_successful_peers_id(name: str, course_id: str, neodriver):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {id: $course_id})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity > 0.8 
    AND peerGrade.grade IN ['A', 'A-', 'B+']
    RETURN peer.id AS id,
        peer.name AS name,
        peerGrade.grade AS grade,
        sim.similarity AS similarity
    ORDER BY sim.similarity DESC
    """,
    name=name,
    course_id=course_id,
    database_=neodriver._db
    )
    return records

def find_successful_peers_name(name: str, course_name: str, neodriver):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {name: $course_name})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity > 0.8 
    AND peerGrade.grade IN ['A', 'A-', 'B+']
    RETURN peer.id AS id,
        peer.name AS name,
        peerGrade.grade AS grade,
        sim.similarity AS similarity
    ORDER BY sim.similarity DESC
    """,
    name=name,
    course_name=course_name,
    database_=neodriver._db
    )
    return records
