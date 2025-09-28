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

// performance_similarity.csv
// Loader (Student)–[:PERFORMANCE_SIMILARITY {score}]→(Student)
LOAD CSV WITH HEADERS FROM 'file:///performance_similarity.csv' AS row
CALL (row) {
  WITH row.`:START_ID(Student)` AS s1,
       row.`:END_ID(Student)`   AS s2,
       row.`similarity:float`   AS similarity
  WHERE s1 <> '' AND s2 <> ''
  MATCH (a:Student {id: s1})
  MATCH (b:Student {id: s2})
  CREATE (a)-[:PERFORMANCE_SIMILARITY {sim: similarity}]->(b)
} IN TRANSACTIONS OF 1000 ROWS;

// Student → Textbook (page viewed) (`page_views.csv`)
LOAD CSV WITH HEADERS FROM 'file:///page_views.csv' AS row
CALL (row) {
  WITH row.`:START_ID(Student)`  AS sid,
       row.`:END_ID(Textbook)`   AS tid,
       row.courseId              AS courseId,
       row.`pageNumber:int`      AS pageNumber,
       row.timestamp             AS ts,
       row.`duration:int`        AS duration
  MATCH (s:Student  {id: sid})
  MATCH (t:Textbook {id: tid})
  CREATE (s)-[:VIEWED_PAGE {
    courseId: courseId,
    pageNumber: pageNumber,
    timestamp: ts,
    duration: duration
  }]->(t)
} IN TRANSACTIONS OF 1000 ROWS;

// Student → Textbook (interaction) (`textbook_interactions.csv`)
LOAD CSV WITH HEADERS FROM 'file:///textbook_interactions.csv' AS row
CALL (row) {
  WITH row.`:START_ID(Student)` AS sid,
       row.`:END_ID(Textbook)`  AS tid,
       row.courseId             AS courseId,
       row.interactionType      AS interactionType,
       row.timestamp                  AS ts,
       toIntegerOrNull(row.`duration:int`) AS duration
  MATCH (s:Student  {id: sid})
  MATCH (t:Textbook {id: tid})
  CREATE (s)-[:INTERACTED_WITH {
    courseId: courseId,
    interactionType: interactionType,
    timestamp: ts,
    duration: duration
  }]->(t)
} IN TRANSACTIONS OF 1000 ROWS;
