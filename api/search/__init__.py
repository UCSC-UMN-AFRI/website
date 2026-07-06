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

        # if keyword has spaces, replace it with two keyword one with underscore and one with hyphen
        # since we are using search key as partion key in cosmos db it's important to have correct one
        # otherwise it will return nothing.
        # NOTE: a better long-term solution would be is to standardize the search keys to a single format
        parsed_search_keys = []
        for key in search_keys:
            key = key.strip().lower()
            if ' ' in key:
                parsed_search_keys.append(key.replace(' ', '_'))
                parsed_search_keys.append(key.replace(' ', '-'))
            else:
                parsed_search_keys.append(key)

        query = f"""
            SELECT c.act_num, c.relevance, c.search_key
            FROM c
            WHERE (c.year BETWEEN {from_year} AND {to_year})
            AND c.search_key IN ({','.join([f"'{key}'" for key in parsed_search_keys])})
        """

        if len(states) > 0:
            query += f""" AND c.state IN ({','.join([f"'{state}'" for state in states])})"""

        search_items = list(
            search_index.query_items(
                query=query,
                enable_cross_partition_query=True,
            )
        )

        agg: dict[str, dict] = {}
        for item in search_items:
            act_num = item["act_num"]
            entry = agg.setdefault(act_num, {"keys": {}, "max": 0})
            search_key = item["search_key"]
            relevance = item["relevance"]
            if search_key not in entry["keys"] or relevance > entry["keys"][search_key]:
                entry["keys"][search_key] = relevance
            if relevance > entry["max"]:
                entry["max"] = relevance

        ordered_act_nums = sorted(agg.keys(), key=lambda a: (-agg[a]["max"], a))
        page_act_nums = ordered_act_nums[offset : offset + limit]
        if not page_act_nums:
            return func.HttpResponse(
                json.dumps([]),
                mimetype="application/json",
                status_code=200,
            )

        acts_items = acts.query_items(
            query=f"""SELECT * FROM c WHERE c.act_num IN ({','.join([f"'{act}'" for act in page_act_nums])})""",
            enable_cross_partition_query=True,
        )

        act_data = {act_item["act_num"]: act_item for act_item in acts_items}

        results = []
        for act_num in page_act_nums:
            act_item = act_data.get(act_num)
            if act_item is None:
                continue
            base = act_item.get("base_act_num") or act_item["act_num"]
            name = act_item["name"]
            if len(name) > 500:
                name = name[:500] + "..."
            pdf_url = (
                f"https://statelegislativedata.blob.core.windows.net/raw-data/{base}.pdf"
            )
            relevances = sorted(
                (
                    {"score": score, "search_key": search_key}
                    for search_key, score in agg[act_num]["keys"].items()
                ),
                key=lambda r: -r["score"],
            )
            results.append(
                {
                    "act_num": base,
                    "year": act_item["year"],
                    "state": act_item["state"],
                    "name": name,
                    "link": pdf_url,
                    "backup_link": pdf_url,
                    "relevances": relevances,
                }
            )

        return func.HttpResponse(
            json.dumps(results),
            mimetype="application/json",
            status_code=200,
        )

    except Exception as e:
        return func.HttpResponse(f"Error: {e}", status_code=500)
