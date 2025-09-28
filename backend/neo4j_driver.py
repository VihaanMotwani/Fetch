from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

class Neo4jDriver:
    def __init__(self, uri=None, user=None, password=None):
        self._uri = uri or os.getenv("NEO4J_DATABASE_URI")
        self._user = user or os.getenv("NEO4J_USERNAME")
        self._pwd = password or os.getenv("NEO4J_PASSWORD")
        self._driver = None

    def connect(self):
        if not all([self._uri, self._user, self._pwd]):
            raise ValueError("Neo4j credentials are missing or invalid.")
        
        self._driver = GraphDatabase.driver(
            self._uri, auth=(self._user, self._pwd)
        )
        self._driver.verify_connectivity()

    def close(self):
        if self._driver:
            self._driver.close()