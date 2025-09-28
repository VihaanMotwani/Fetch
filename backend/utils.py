def sort_courses(courses):
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
            parse_term(course[1])[1],                  # year
            season_order[parse_term(course[1])[0]]     # season
        )
    )


# test
data = [
    ["CS101", "Spring2021"],
    ["CS102", "Fall2024"],
    ["CS103", "Summer2025"],
    ["CS104", "Fall2020"],
    ["CS105", "Winter2021"],
]

print(sort_courses(data))