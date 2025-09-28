// Student ↔ Student (learning style) (`learning_style_similarity.csv`)
LOAD CSV WITH HEADERS FROM 'file:///learning_style_similarity.csv' AS row
CALL (row) {
  WITH trim(row.`:START_ID(Student)`)               AS s1,
       trim(row.`:END_ID(Student)`)                 AS s2,
       toFloatOrNull(row.`similarity:float`)        AS similarity
  WHERE s1 <> '' AND s2 <> ''
  MATCH (a:Student {id: s1})
  MATCH (b:Student {id: s2})
  CREATE (a)-[:SIMILAR_LEARNING_STYLE {similarity: similarity}]->(b)
} IN TRANSACTIONS OF 1000 ROWS;



// Student → Course (completed) (`completed_courses.csv`)
LOAD CSV WITH HEADERS FROM 'file:///completed_courses.csv' AS row
CALL (row) {
  WITH trim(row.`:START_ID(Student)`) AS sid,
       trim(row.`:END_ID(Course)`)    AS cid,
       row.grade                      AS grade,
       toFloatOrNull(row.`difficulty:int`)  AS diff
  WHERE sid <> '' AND cid <> ''
  MATCH (s:Student {id: sid})
  MATCH (c:Course  {id: cid})
  CREATE (s)-[:COMPLETED {grade: grade, difficulty: diff}]->(c)
} IN TRANSACTIONS OF 1000 ROWS;
