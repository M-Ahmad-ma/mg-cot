1. Start Visit:

POST /api/schools/1/start-visit
Headers: Authorization: Bearer {token}

pass the school id 

2. Add Grades:

POST /api/visits/1/add-grades
Body: {
  "grades": [
    {"grade_name": "Grade 5", "subject": "Math", "total_students": 40, "present_boys": 18, "present_girls": 15},
    {"grade_name": "Grade 6", "subject": "Science", "total_students": 35, "present_boys": 16, "present_girls": 14}
  ]
}

pass the visit id 

3. Get Previous Ratings (Single Grade):

POST /api/visits/1/previous-ratings
Body: {
  "grade_names": ["Grade 5"],
  "context_type": "single"
}
Response: Shows previous ratings for Grade 5 if any

pass the visit id 

4. Get Previous Ratings (Combined Grades):

POST /api/visits/1/previous-ratings
Body: {
  "grade_names": ["Grade 5", "Grade 6"],
  "context_type": "combined"
}
Response: Shows previous combined ratings if same grades were rated together before

pass the visit id here 

5. Submit Ratings (Single Grade):

POST /api/visits/1/submit-ratings
Body: {
  "grade_names": ["Grade 5"],
  "context_type": "single",
  "ratings": [
    {"question_id": 1, "rating": 4, "comments": "Good"},
    {"question_id": 2, "rating": 3, "comments": "Average"}
  ]
}

pass visit id 

6. Submit Ratings (Combined Grades):

POST /api/visits/1/submit-ratings
Body: {
  "grade_names": ["Grade 5", "Grade 6"],
  "context_type": "combined",
  "ratings": [
    {"question_id": 1, "rating": 4, "comments": "Both good"},
    {"question_id": 2, "rating": 3, "comments": "Both average"}
  ]
}

pass visit id 

