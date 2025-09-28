# UMBC Neo4j Academic Graph Database

This project is a full-stack application designed to provide data-driven insights for students at the University of Maryland, Baltimore County (UMBC). It leverages a Neo4j graph database to model the complex relationships between students, courses, faculty, and degrees, offering personalized recommendations and analytics to help students succeed. The application features a machine learning-powered course planner, a peer comparison tool, and an AI-powered summarizer to deliver actionable advice.

## Features ✨

* **Student Insight Explorer**: A dashboard to find and visualize data about successful peers who have taken the same courses.
* **ML Course Planner**: A tool that uses machine learning to recommend future courses and predict GPA based on the performance of similar students.
* **AI-Powered Summaries**: An AI assistant that provides personalized recommendations and insights based on student data.
* **Graph-Based Data Model**: A rich, interconnected dataset that captures the nuances of academic life, including learning styles, course prerequisites, and textbook interactions.
* **Synthetic Data Generation**: A Python script to generate a realistic, large-scale dataset for populating the Neo4j database.

## Technologies Used 💻

* **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Recharts
* **Backend**: FastAPI, Python, Neo4j, scikit-learn, OpenAI
* **Database**: Neo4j Graph Database

## Getting Started 🚀

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Python 3.8+
* Node.js and npm (or yarn/pnpm)
* Neo4j Desktop or Community Edition
* An OpenAI API key

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/vihaanmotwani/fetch.git
   cd fetch
   ```

2. **Set up the backend**
   * Navigate to the `backend` directory:
     ```sh
     cd backend
     ```
   * Create a virtual environment and install the required Python packages:
     ```sh
     python -m venv venv
     source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
     pip install -r ../requirements.txt
     ```
   * Create a `.env` file by copying the example and filling in your credentials:
     ```sh
     cp .env.example .env
     ```
     You will need to add your Neo4j database URI, username, password, and OpenAI API key to this file.
   * Start the backend server:
     ```sh
     uvicorn app:app --reload
     ```

3. **Set up the frontend**
   * In a new terminal, navigate to the `frontend` directory:
     ```sh
     cd frontend
     ```
   * Install the required npm packages:
     ```sh
     npm install
     ```
   * Start the frontend development server:
     ```sh
     npm run dev
     ```

4. **Set up the database**
   * Use the `generate_synthetic_dataset.py` script in the `Data` directory to create the dataset.
   * Import the data into Neo4j using the Cypher scripts in the `cypher` directory or the provided CSV files.

## Project Structure 📂

```
.
├── backend/
│   ├── app.py              # FastAPI application
│   ├── ML.py               # Machine learning model for course recommendations
│   ├── ai_summarizer.py    # AI-powered summary generator
│   ├── neo4j_driver.py     # Neo4j database driver
│   ├── query_functions.py  # Cypher queries for the database
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   │   ├── api/        # API routes for the frontend
│   │   │   ├── ml-planner/ # ML Course Planner page
│   │   │   └── ...
│   │   ├── components/     # React components
│   │   └── ...
│   └── ...
├── Data/
│   └── generate_synthetic_dataset.py # Script to generate synthetic data
├── cypher/
│   ├── data_import.cypher  # Cypher script for data import
│   └── relations.cypher    # Cypher script for creating relationships
└── ...
```

## API Endpoints 🌐

The backend provides several API endpoints to interact with the data and machine learning models:

* `GET /peers`: Fetches a list of successful peers for a given student and course.
* `GET /course/learner-types`: Retrieves the distribution of learner types for a specific course.
* `GET /student/alumni`: Finds alumni who have graduated from the same degree program as a given student.
* `GET /ml/recommendations`: Provides machine learning-based course recommendations for a student.
* `POST /ai/summary`: Generates an AI-powered summary of a student's academic standing and potential.

For more details on the request and response models, see the `models.py` file in the `backend` directory.

## Database 💾

The project uses a Neo4j graph database to store and manage the academic data. The schema is designed to capture the relationships between students, courses, faculty, degrees, and more.

The database can be populated using the synthetic data generator and the Cypher import scripts. The `data_import.cypher` file creates the nodes, and the `relations.cypher` file establishes the relationships between them.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
