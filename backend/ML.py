import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.neighbors import NearestNeighbors
from neo4j_driver import *
from datetime import datetime


# -----------------------------
# Flatten Neo4j records
# -----------------------------
def flatten_records(records):
    data = []
    for record in records:
        courses, gpa_dict, student = record[0], record[1], record[2]
        row = {}
        # Student attributes
        student = student[0]
        row.update(student)
        # GPA
        row["GPA"] = gpa_dict[0]["GPA"]
        # Encode course history as a joined string
        row["course_path"] = " ".join([c["course_id"] for c in courses])
        data.append(row)
    return pd.DataFrame(data)

# -----------------------------
# Connect to Neo4j + load data
# -----------------------------
def predict(name: str):
    neo = Neo4jDriver()
    neo.connect()

    id = find_student_id(neo, name)
    degree = find_student_degree(neo, id)
    alumni = find_alumni_that_finished_from_same_degree(neo, degree)

    paths = []
    for alumnus in alumni:
        student_id = alumnus["alumni.id"]
        path = find_path_of_alumnus(neo, student_id)
        if path is not None:
            paths.append([
                sort_courses_dict(path),
                get_students_GPA_from_id(neo, student_id),
                get_student_features_from_id(neo, student_id)
            ])
    records = paths
    df = flatten_records(records)
    #print("Training dataset:", df.head())

    # -----------------------------
    # Peer-based recommendation
    # -----------------------------
    features = [
        "s.learningStyle", "s.preferredPace",
        "s.financialAidStatus", "s.preferredInstructionMode",
        "s.preferredCourseLoad", "s.workHoursPerWeek"
    ]

    categorical = ["s.learningStyle", "s.preferredPace",
                "s.financialAidStatus", "s.preferredInstructionMode"]
    numeric = ["s.preferredCourseLoad", "s.workHoursPerWeek"]

    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("num", "passthrough", numeric)
    ])

    peer_finder = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("nn", NearestNeighbors(n_neighbors=10, metric="cosine"))
    ])

    peer_finder.fit(df[features])

    # -----------------------------
    # Target student
    # -----------------------------
    student_features = get_student_features_from_id(neo, id)[0]
    student_df = pd.DataFrame([student_features])

    # Find nearest peers
    distances, indices = peer_finder.named_steps["nn"].kneighbors(
        peer_finder.named_steps["preprocessor"].transform(student_df)
    )
    peer_ids = indices[0]
    peer_records = df.iloc[peer_ids]

    # -----------------------------
    # Rank courses by peer GPA
    # -----------------------------
    peer_courses = peer_records.assign(
        course=peer_records["course_path"].str.split()
    ).explode("course")

    course_scores = (
        peer_courses.groupby("course")["GPA"]
        .mean()
        .sort_values(ascending=False)
    )

    # -----------------------------
    # Filter out students's own courses
    # -----------------------------
    student_path = find_path_of_alumnus(neo, id)
    student_path = set(c["course_id"] for c in student_path)

    recommended_courses = course_scores[~course_scores.index.isin(student_path)]

    end_sem = ""
    end_date = get_students_end_date_from_id(neo, id)
    if end_date.month < 6:
        end_sem = "Summer"
    else:
        end_sem = "Fall"
    
    sem_list = []
    if end_sem == "Summer":
        sem_list = ["Fall2025", "Fall2025", "Fall2025", "Spring2026", "Spring2026", "Spring2026"]
    else :
        sem_list = ["Fall2025", "Fall2025", "Fall2025", "Spring2026", "Spring2026", "Spring2026", "Summer2026", "Summer2026", "Summer2026"]


    neo.close()

    return recommended_courses.keys().tolist(), sum(recommended_courses.tolist())/len(recommended_courses.tolist()), sem_list
