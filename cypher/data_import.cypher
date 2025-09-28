// First, clear any existing data (optional)
MATCH (n) DETACH DELETE n;

// Create constraints and indexes (REQUIRED - run first!)
CREATE CONSTRAINT student_id IF NOT EXISTS FOR (s:Student) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT course_id IF NOT EXISTS FOR (c:Course) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT faculty_id IF NOT EXISTS FOR (f:Faculty) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT degree_id IF NOT EXISTS FOR (d:Degree) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT requirement_id IF NOT EXISTS FOR (r:RequirementGroup) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT term_id IF NOT EXISTS FOR (t:Term) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT textbook_id IF NOT EXISTS FOR (tb:Textbook) REQUIRE tb.id IS UNIQUE;

// Create indexes for better query performance
CREATE INDEX student_learning_style IF NOT EXISTS FOR (s:Student) ON (s.learningStyle);
CREATE INDEX course_department IF NOT EXISTS FOR (c:Course) ON (c.department);
CREATE INDEX course_level IF NOT EXISTS FOR (c:Course) ON (c.level);
CREATE INDEX term_type IF NOT EXISTS FOR (t:Term) ON (t.type);


// Students
LOAD CSV WITH HEADERS FROM 'file:///students.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Student {
    id: row.`id:ID(Student)`,
    name: row.name,
    enrollmentDate: date(row.enrollmentDate),
    expectedGraduation: date(row.expectedGraduation),
    learningStyle: row.learningStyle,
    preferredCourseLoad: toInteger(row.`preferredCourseLoad:int`),
    preferredPace: row.preferredPace,
    workHoursPerWeek: CASE 
      WHEN row.`workHoursPerWeek:int` IS NULL OR row.`workHoursPerWeek:int` = '' 
      THEN NULL 
      ELSE toInteger(row.`workHoursPerWeek:int`) 
    END,
    financialAidStatus: row.financialAidStatus,
    preferredInstructionMode: row.preferredInstructionMode
  })
} IN TRANSACTIONS OF 1000 ROWS;

// Faculty
LOAD CSV WITH HEADERS FROM 'file:///faculty.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Faculty {
    id: row.`id:ID(Faculty)`,
    name: row.name,
    department: row.department,
    // Accept either a JSON-ish array in the CSV or a pipe-delimited list
    teachingStyle: CASE 
      WHEN row.teachingStyle STARTS WITH '[' THEN apoc.convert.fromJsonList(row.teachingStyle)
      ELSE CASE WHEN row.teachingStyle IS NULL OR row.teachingStyle = '' THEN [] ELSE split(row.teachingStyle,'|') END
    END,
    avgRating: row.`avgRating:float`
  })
} IN TRANSACTIONS OF 1000 ROWS;

// Courses
LOAD CSV WITH HEADERS FROM 'file:///courses.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Course {
    id: row.`id:ID(Course)`,
    name: row.name,
    department: row.department,
    credits: CASE WHEN row.`credits:int` IS NULL OR row.`credits:int` = '' THEN NULL ELSE toInteger(row.credits) END,
    level:   CASE WHEN row.`level:int`   IS NULL OR row.`level:int`   = '' THEN NULL ELSE toInteger(row.`level:int`)   END,
    avgDifficulty: CASE WHEN row.`avgDifficulty:float` IS NULL OR row.`avgDifficulty:float` = '' THEN NULL ELSE toInteger(row.`avgDifficulty:float`) END,
    avgTimeCommitment: CASE WHEN row.`avgTimeCommitment:int` IS NULL OR row.`avgTimeCommitment:int` = '' THEN NULL ELSE toInteger(row.`avgTimeCommitment:int`) END,
    termAvailability: CASE 
      WHEN row.termAvailability STARTS WITH '[' THEN apoc.convert.fromJsonList(row.termAvailability)
      ELSE CASE WHEN row.termAvailability IS NULL OR row.termAvailability = '' THEN [] ELSE split(row.termAvailability,'|') END
    END,
    instructionModes: CASE 
      WHEN row.instructionModes STARTS WITH '[' THEN apoc.convert.fromJsonList(row.instructionModes)
      ELSE CASE WHEN row.instructionModes IS NULL OR row.instructionModes = '' THEN [] ELSE split(row.instructionModes,'|') END
    END,
    tags: CASE 
      WHEN row.tags STARTS WITH '[' THEN apoc.convert.fromJsonList(row.tags)
      ELSE CASE WHEN row.tags IS NULL OR row.tags = '' THEN [] ELSE split(row.tags,'|') END
    END,
    visualLearnerSuccess:   CASE WHEN row.`visualLearnerSuccess:float`   IS NULL OR row.`visualLearnerSuccess:float`   = '' THEN NULL ELSE toFloat(row.`visualLearnerSuccess:float`)   END,
    auditoryLearnerSuccess: CASE WHEN row.`auditoryLearnerSuccess:float` IS NULL OR row.`auditoryLearnerSuccess:float` = '' THEN NULL ELSE toFloat(row.`auditoryLearnerSuccess:float`) END,
    kinestheticLearnerSuccess: CASE WHEN row.`kinestheticLearnerSuccess:float` IS NULL OR row.`kinestheticLearnerSuccess:float` = '' THEN NULL ELSE toFloat(row.`kinestheticLearnerSuccess:float`) END,
    readingLearnerSuccess:  CASE WHEN row.`readingLearnerSuccess:float`  IS NULL OR row.`readingLearnerSuccess:float`  = '' THEN NULL ELSE toFloat(row.`readingLearnerSuccess:float`)  END
  })
} IN TRANSACTIONS OF 1000 ROWS;

// Terms
LOAD CSV WITH HEADERS FROM 'file:///terms.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Term {
    id: row.`id:ID(Term)`,
    name: row.name,
    startDate: date(row.startDate),
    endDate: date(row.endDate),
    type: row.type
  })
} IN TRANSACTIONS OF 1000 ROWS;

// Degrees
LOAD CSV WITH HEADERS FROM 'file:///degrees.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Degree {
    id: row.`id:ID(Degree)`,
    name: row.name,
    department: row.department,
    type: row.type,
    totalCreditsRequired: row.`totalCreditsRequired:int`,
    coreCreditsRequired: row.`coreCreditsRequired:int`,
    electiveCreditsRequired: row.`electiveCreditsRequired:int`
  })
} IN TRANSACTIONS OF 1000 ROWS;

// Requirement Groups
LOAD CSV WITH HEADERS FROM 'file:///requirement_groups.csv' AS row
CALL (row) {
  WITH row
  CREATE (:RequirementGroup {
    id: row.`id:ID(RequirementGroup)`,
    name: row.name,
    minCredits: row.`minimumCourses:int`,
    minimumCredits: row.`minimumCredits:int`
  })
} IN TRANSACTIONS OF 1000 ROWS;


// Textbooks
LOAD CSV WITH HEADERS FROM 'file:///textbooks.csv' AS row
CALL (row) {
  WITH row
  CREATE (:Textbook {
    id: row.id, //this one breaks the constraints TODO!!!!
    name: row.name,
    publisher: row.publisher,
    price: row.`price:float`,
    page: row.`pages:int`,
    edition: row.`edition:int`,
    publicationYear: row.`publicationYear:int`,    
    isbn: row.isbn,
    category: row.category
  })
} IN TRANSACTIONS OF 1000 ROWS;

