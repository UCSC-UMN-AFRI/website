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
        offset = body.get('offset', 0)
        limit = body.get('limit', 100)

        if limit > 500:
            return func.HttpResponse(
                json.dumps({"error": "Limit must be less than 500"}),
                mimetype="application/json",
                status_code=400
            )

        client = CosmosClient(environ["ACCOUNT_URI"], credential=environ["ACCOUNT_KEY"])
        database = client.get_database_client(environ["COSMOS_DB_NAME"])
        container = database.get_container_client(environ["CONTAINER_NAME"])

        query = f"""
            SELECT c.act_num, c.year, c.state, c.name, c.link FROM c
            WHERE c.year >= {from_year} AND c.year <= {to_year}
            AND c.state IN ({','.join([f"'{state}'" for state in states])})
        """

        if len(search_keys) > 0:
            query += f""" AND ARRAY_CONTAINS_ALL(c.search_keys, {','.join([f"'{key}'" for key in search_keys])})"""

        query += f"""
            ORDER BY c.year ASC
            OFFSET {offset} LIMIT {limit}
        """

        items = container.query_items(
            query=query,
            enable_cross_partition_query=True
        )

        dict_items = []
        for item in items:
            dict_items.append(item)

        return func.HttpResponse(
            json.dumps(dict_items),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        return func.HttpResponse(f"Error: {e}", status_code=500)
