from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

URI = os.getenv("NEO4J_DATABASE_URI")
username = os.getenv(("NEO4J_USERNAME"))
password = os.getenv(("NEO4J_PASSWORD"))
AUTH = (username, password)

with GraphDatabase.driver(URI, auth=AUTH) as driver:
    driver.verify_connectivity()

class Neo4jDriver:
    def __init__(self):
        load_dotenv()
        self._uri = os.getenv("NEO4J_DATABASE_URI")
        self._user = os.getenv(("NEO4J_USERNAME"))
        self._pwd = os.getenv(("NEO4J_PASSWORD"))
        self._driver = None

    def connect(self):
        if not all([self._uri, self._user, self._pwd]):
            raise ValueError("Neo4j credentials are missing or invalid.")
        
        self._driver = GraphDatabase.driver(
            self._uri, auth=(self._user, self._password)
        )

    def verify(self):
        if not self._driver:
            raise ConnectionError("Driver is not initialised. Call connect() first.")
        self._driver.verify_connectivity()