def sort_courses_dict(courses, descending=False):
    season_order = {"Spring": 1, "Summer": 2, "Fall": 3, "Winter": 4}
    
    def parse_term(term):
        # split into season + year
        for i, ch in enumerate(term):
            if ch.isdigit():
                return term[:i], int(term[i:])
        return term, 0

    return sorted(
        courses,
        key=lambda course: (
            parse_term(course["term"])[1],                 # year
            season_order[parse_term(course["term"])[0]]    # season
        ),
        reverse=descending
    )

data = [
    {"course_id": "CS101", "term": "Spring2021"},
    {"course_id": "CS102", "term": "Fall2024"},
    {"course_id": "CS103", "term": "Summer2025"},
    {"course_id": "CS104", "term": "Fall2020"},
    {"course_id": "CS105", "term": "Winter2021"},
]

# Example usage
sorted_data = sort_courses_dict(data)
for c in sorted_data:
    print(c)
