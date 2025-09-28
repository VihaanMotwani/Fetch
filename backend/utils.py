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
