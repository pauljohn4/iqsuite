# firebase_init.py
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

_initialized = False
_db = None

def init_firebase():
    global _initialized, _db
    if _initialized and _db:
        return _db

    # Option A: path to service file
    sa_path = os.getenv("FIREBASE_SA_JSON")
    if sa_path and os.path.exists(sa_path):
        cred = credentials.Certificate(sa_path)
    else:
        # Option B: service JSON stored in env var
        sa_content = os.getenv("FIREBASE_SA_JSON_CONTENT")
        if not sa_content:
            raise RuntimeError("Firebase service account not configured. Set FIREBASE_SA_JSON or FIREBASE_SA_JSON_CONTENT.")
        sa_dict = json.loads(sa_content)
        cred = credentials.Certificate(sa_dict)

    # initialize app with project id if provided
    firebase_admin.initialize_app(cred, {
        'projectId': os.getenv("FIREBASE_PROJECT_ID")
    })
    _db = firestore.client()
    _initialized = True
    return _db
