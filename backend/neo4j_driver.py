from neo4j import GraphDatabase
from dotenv import load_dotenv
from query_functions import *
import os


load_dotenv()
class Neo4jDriver:
    def __init__(self):
        self._uri = os.getenv("NEO4J_DATABASE_URI")
        self._user = os.getenv("NEO4J_USERNAME")
        self._pwd = os.getenv("NEO4J_PASSWORD")
        self._db = os.getenv("NEO4J_DATABASE")
        self._driver = None

    def connect(self):
        if not all([self._uri, self._user, self._pwd]):
            raise ValueError("Neo4j credentials are missing or invalid.")
        
        self._driver = GraphDatabase.driver(
            self._uri, auth=(self._user, self._pwd)
        )
        with self._driver.session(database=self._db) as session:
            session.run("RETURN 1")

    def close(self):
        if self._driver:
            self._driver.close()

    def run_query(self, query: str):
        if not self._driver:
            raise RuntimeError("Driver is not connected. Call connect() first.")

        records, summary, keys = self._driver.execute_query(
            query,
            database_=self._db
        )
        
        return records, summary, keys
