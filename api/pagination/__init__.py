from datetime import datetime
import logging
import json

import azure.functions as func
from azure.cosmos import CosmosClient

from os import environ

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info('Python HTTP trigger function processed a request.')

        try:
            body = req.get_json()
        except ValueError:
            body = {}

        states = body.get('states', [])
        from_year = body.get('from_year', 1975)
        to_year = body.get('to_year', datetime.now().year)
        search_keys = body.get('search_keys', [])

        client = CosmosClient(environ["ACCOUNT_URI"], credential=environ["ACCOUNT_KEY"])
        database = client.get_database_client(environ["COSMOS_DB_NAME"])
        container = database.get_container_client("search_index")

        # todo: sanitize input as cosmos db doesn't support parameters properly
        # todo: currently this returns count for an act_num multiple times if it has multiple search keys

        if len(search_keys) == 0:
            return func.HttpResponse(
                json.dumps({"error": "Search keys are required"}),
                mimetype="application/json",
                status_code=400
            )

        query = f"""
            SELECT VALUE COUNT(1)
            FROM c
            WHERE (c.year BETWEEN {from_year} AND {to_year})
            AND c.search_key IN ({','.join([f"'{key}'" for key in search_keys])})
        """

        if len(states) > 0:
            query += f""" AND c.state IN ({','.join([f"'{state}'" for state in states])})"""

        items = container.query_items(
            query=query,
            enable_cross_partition_query=True
        )

        # Convert ItemPaged iterator to list and get first (and only) item
        count = list(items)[0]

        resp = {
            "total": count
        }

        return func.HttpResponse(
            json.dumps(resp),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        return func.HttpResponse(f"Error: {e}", status_code=500)
