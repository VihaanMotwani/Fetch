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
    return records[0]["course_id"] if records else None

def find_peers_with_textbooks(neodriver, student_name: str, course_id: str, min_similarity: float = 0.8, grades=("A","A-","B+")):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (you:Student {name: $name})-[yourGrade:COMPLETED]->(course:Course {id: $course_id})
    MATCH (you)-[sim:SIMILAR_LEARNING_STYLE]->(peer:Student)-[peerGrade:COMPLETED]->(course)
    WHERE sim.similarity >= $minSim 
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

def textbooks_popularity_among_courses_groupped_by_grades(neodriver, course_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    // Find how many students (per grade) interacted with each textbook
    MATCH (c:Course {id: $course_id})<- [g:COMPLETED]-(s:Student)-[:INTERACTED_WITH]->(t:Textbook)<-[:ASSIGNED_TO_A_COURSE]-(c)
    WITH t, g.grade AS grade, count(DISTINCT s) AS readers
    // Count total students with that grade in the course
    MATCH (c:Course {id: $course_id})<- [g2:COMPLETED]-(s2:Student)
    WITH t, grade, readers, g2.grade AS grade2, count(DISTINCT s2) AS total_students
    WHERE grade = grade2
    RETURN t.id AS textbook_id,
           t.name AS textbook_name,
           grade,
           readers,
           total_students,
           (toFloat(readers) / total_students) AS proportion
    ORDER BY grade DESC, readers DESC
    """,
    course_id=course_id,
    database_=neodriver._db
    )
    return records

def learner_types_enrolled_in_a_course(neodriver, course_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (c:Course {id: $course_id})<- [g:COMPLETED]-(s:Student)
    WITH c, s.learningStyle AS learning_style, g.grade AS grade, count(DISTINCT s) AS students
    RETURN c.id AS c_id,
           c.name AS c_name,
           grade,
            learning_style,
           students
    ORDER BY grade DESC, learning_style DESC
    """,
    course_id=course_id,
    database_=neodriver._db
    )
    return records

def find_student_id(neodriver, student_name: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (me:Student {name: $student_name})
    RETURN me.id as id
    """,
    student_name=student_name,
    database_=neodriver._db
    )
    return records[0]["id"] if records else None

def find_student_degree(neodriver, student_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    // Find the degree(s) of the given student
    MATCH (me:Student {id: $student_id})-[:DEGREE]->(d:Degree)
    RETURN d.id AS degree_id
    """,
    student_id=student_id,
    database_=neodriver._db
    )
    return records[0]["degree_id"] if records else None

def find_alumni_that_finished_from_same_degree(neodriver, degree_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (alumni:Student)-[:DEGREE]->(d:Degree {id: $degree_id})
    WHERE alumni.expectedGraduation < date()
    RETURN alumni.id
    ORDER BY alumni.expectedGraduation
    """,
    degree_id=degree_id,
    database_=neodriver._db
    )
    return [dict(record) for record in records] if records else None

def find_path_of_alumnus(neodriver, student_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (alumni:Student {id: $student_id})-[rel:COMPLETED]->(c:Course)
    RETURN c.id AS course_id,
        rel.term AS term
    """,
    student_id=student_id,
    database_=neodriver._db
    )
    return [dict(record) for record in records] if records else None

def get_student_features_from_id(neodriver, student_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (s:Student {id: $student_id})
    RETURN s.learningStyle, s.preferredCourseLoad, s.preferredPace, s.workHoursPerWeek,
                s.financialAidStatus, s.preferredInstructionMode
    """,
    student_id=student_id,
    database_=neodriver._db
    )
    return [dict(record) for record in records] if records else None

def get_students_GPA_from_id(neodriver, student_id: str):
    records, summary, keys = neodriver._driver.execute_query("""
    MATCH (student:Student {id: $student_id})-[g:COMPLETED]->(:Course)
    WITH student,
        AVG(CASE g.grade
            WHEN 'A' THEN 4.0 WHEN 'A-' THEN 3.7
            WHEN 'B+' THEN 3.3 WHEN 'B' THEN 3.0 WHEN 'B-' THEN 2.7
            WHEN 'C+' THEN 2.3 WHEN 'C' THEN 2.0 WHEN 'C-' THEN 1.7
            WHEN 'D+' THEN 1.3 WHEN 'D' THEN 1.0
            ELSE 0 END) AS GPA
    RETURN GPA
    """,
    student_id=student_id,
    database_=neodriver._db
    )
    return [dict(record) for record in records] if records else None
