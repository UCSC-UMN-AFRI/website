import logging
import json
import os
import io
import csv
import sys
import azure.functions as func
from azure.storage.blob import BlobServiceClient


csv.field_size_limit(sys.maxsize)

CACHED_DATA = []

def get_data_from_csvs():
    global CACHED_DATA
    if CACHED_DATA: return CACHED_DATA

    try:
        conn_str = os.environ.get("BLOB_CONNECTION_STRING")
        if not conn_str: return []
    

        container = os.environ.get("BLOB_CONTAINER_NAME","clean-data")
        blob_service_client = BlobServiceClient.from_connection_string(conn_str)
        container_client = blob_service_client.get_container_client(container)

        aggregated_data = []
        file_count = 0

        blobs = container_client.list_blobs()
        for blob in blobs:
            if blob.name.lower().endswith('.csv'):
                logging.info(f"Downloading CSV: {blob.name}")
                download_stream = container_client.download_blob(blob.name).readall()
                csv_file = io.StringIO(download_stream.decode("utf-8", errors='ignore'))
                reader = csv.DictReader(csv_file)
                
                for row in reader:
                    text = row.get('original_text', '') or row.get('Full text', '')
                    w_count = len(text.split()) if text else 0
                    
                    try: total = float(row.get('total_weighted_score', 0))
                    except: total = 0
                    
                    try: sentiment = float(row.get('sentiment_score', 0))
                    except: sentiment = 0
                    
                    try: year = int(float(row.get('year', 0))) if row.get('year') else 1900
                    except: year = 1900

                    # Auto-detect Stage
                    name = row.get('name', row.get('summary', 'Untitled Act'))
                    stage = "Resolution" if "Resolution" in name else "Enacted Law"

                    item = {
                        "act_num": row.get('act_num', row.get('bill_num', 'Unknown')),
                        "year": year,
                        "state": row.get('state', blob.name[:2].upper()),
                        "name": name,
                        "link": row.get('link', '#'),
                        "backup_link": "#",
                        "word_count": w_count,
                        "total_score": total,
                        "sentiment": sentiment,
                        "stage": stage,
                        "relevances": [{"score": 0.5, "search_key": "csv_match"}]
                    }
                    
                    if item['year'] > 1900:
                        aggregated_data.append(item)
                
                file_count += 1
                if file_count >= 2: break 

        logging.info(f"Loaded {len(aggregated_data)} bills from {file_count} CSV files.")
        CACHED_DATA = aggregated_data
        return aggregated_data

    except Exception as e:
        logging.error(f"Error processing CSVs: {str(e)}")
        return []

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        try:
            body = req.get_json()
        except:
            body = {}
        
        search_keys = body.get('search_keys', [])
        sort_mode = body.get('sort', 'relevance') # Get Sort Parameter
        offset = body.get('offset', 0)
        limit = body.get('limit', 20)

        # Cache data load
        all_acts = get_data_from_csvs()
        
        # 1. Filter
        filtered = []
        for act in all_acts:
            # Keyword filter
            if search_keys:
                found = False
                search_target = (act['name'] + " " + str(act['act_num'])).lower()
                for k in search_keys:
                    if k.lower() in search_target:
                        found = True
                        break
                if not found: continue
            
            # (State filters etc go here)
            filtered.append(act)

        # If empty search, cap at 1000 for sorting to be fast
        if not search_keys:
            filtered = filtered[:1000]

        # 2. Sort (Backend Power!)
        reverse = True
        key = lambda x: x['total_score'] # Default

        if sort_mode == 'recent':
            key = lambda x: x['year']
            reverse = True
        elif sort_mode == 'oldest':
            key = lambda x: x['year']
            reverse = False
        elif sort_mode == 'length_high':
            key = lambda x: x['word_count']
            reverse = True
        elif sort_mode == 'length_low':
            key = lambda x: x['word_count'] if x['word_count'] > 0 else 999999
            reverse = False
        elif sort_mode == 'stage_enacted':
            # "Resolution" comes after "Enacted" alphabetically? No.
            # Law = 2, Res = 1
            key = lambda x: 2 if "Enacted" in x['stage'] else 1
            reverse = True

        filtered.sort(key=key, reverse=reverse)

        # 3. Paginate
        start = offset
        end = offset + limit
        paged_results = filtered[start:end]

        return func.HttpResponse(json.dumps(paged_results), mimetype="application/json", status_code=200)

    except Exception as e:
        return func.HttpResponse(f"API Error: {str(e)}", status_code=500)