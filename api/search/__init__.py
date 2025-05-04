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
        search_index = database.get_container_client("search_index")
        acts = database.get_container_client("acts")

        # todo: sanitize input as cosmos db doesn't support parameters properly

        if len(search_keys) == 0:
            return func.HttpResponse(
                json.dumps({"error": "Search keys are required"}),
                mimetype="application/json",
                status_code=400
            )

        query = f"""
            SELECT c.act_num, c.relevance, c.search_key
            FROM c
            WHERE (c.year BETWEEN {from_year} AND {to_year})
            AND c.search_key IN ({','.join([f"'{key}'" for key in search_keys])})
        """

        if len(states) > 0:
            query += f""" AND c.state IN ({','.join([f"'{state}'" for state in states])})"""

        query += f"""
            ORDER BY c.relevance DESC
            OFFSET {offset} LIMIT {limit}
        """

        search_items = [item for item in search_index.query_items(
            query=query,
            enable_cross_partition_query=True
        )]

        acts_to_fetch = [item['act_num'] for item in search_items]
        if len(acts_to_fetch) == 0:
            return func.HttpResponse(
                json.dumps([]),
                mimetype="application/json",
                status_code=200
            )

        acts_items = acts.query_items(
            query=f"""SELECT * FROM c WHERE c.act_num IN ({','.join([f"'{act}'" for act in acts_to_fetch])})""",
            enable_cross_partition_query=True
        )

        act_data = {}
        for act_item in acts_items:
            act_data[act_item['act_num']] = act_item

        act_items = {}
        for search_item in search_items:
            act_item = act_data[search_item['act_num']]
            # truncate name to 500 characters
            if act_items.get(act_item['act_num']) is None:
                act_items[act_item['act_num']] = {
                    "act_num": act_item['act_num'],
                    "year": act_item['year'],
                    "state": act_item['state'],
                    "name": act_item['name'][:500] + '...' if len(act_item['name']) > 500 else act_item['name'],
                    "link": act_item['link'],
                    "backup_link": f"https://statelegislativedata.blob.core.windows.net/raw-data/{search_item['act_num']}.pdf",
                    "relevances": []
                }

            act_items[act_item['act_num']]['relevances'].append({
                "score": search_item['relevance'],
                "search_key": search_item['search_key'],
            })

        return func.HttpResponse(
            json.dumps(list(act_items.values())),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        return func.HttpResponse(f"Error: {e}", status_code=500)
