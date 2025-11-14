from flask import Flask, redirect, url_for, session, render_template, request,jsonify
from flask_cors import CORS
import msal
import os
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
import os
import pyodbc
import requests
import base64
from datetime import datetime
import uuid
from firebase_init import init_firebase
from firebase_admin import firestore, storage


load_dotenv()

app = Flask(__name__)
app.secret_key = "flask_secret_key"
CORS(app)

db = None
try:
    db = init_firebase()
    print("✅ Firestore initialized")
except Exception as e:
    print("⚠️ Firestore not initialized:", e)

# Microsoft App Config
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
REDIRECT_PATH = os.getenv("REDIRECT_PATH")
SCOPE = ["User.Read", "User.Read.All"]
PATH_XML = os.getenv("XML_PATH")

try:
    with open(PATH_XML, 'r', encoding='utf-8') as f:
        print("✅ File opened successfully!")
        print(f.readline())  # print first line
except FileNotFoundError:
    print("❌ File not found. Check path and filename.")
except PermissionError:
    print("❌ Permission denied. Check your access rights.")
except Exception as e:
    print(f"⚠️ Other error: {e}")
# ----------------- MSAL SETUP -----------------
def _build_msal_app(cache=None):
    return msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
        token_cache=cache
    )

def get_db_connection():
    try:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={os.getenv('DB_HOST')};"
            f"DATABASE={os.getenv('DB_DATABASE')};"
            f"UID={os.getenv('DB_USERNAME')};"
            f"PWD={os.getenv('DB_PASSWORD')}"
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        print("Database connection error:", e)
        return None

def get_redirect_uri():
    # Dynamically use localhost or 127.0.0.1
    return request.host_url.rstrip('/') + REDIRECT_PATH

def _build_auth_url():
    redirect_uri = get_redirect_uri()
    print("Redirect URI being sent to Microsoft:", redirect_uri)
    return _build_msal_app().get_authorization_request_url(
        SCOPE,
        redirect_uri=get_redirect_uri()
    )

# ----------------- ROUTES -----------------
@app.route("/")
def index():
    if "user" in session:
        return redirect(url_for("dashboard"))
    return render_template("login.html")

@app.route("/login")
def login():
    auth_url = _build_auth_url()
    return redirect(auth_url)

@app.route(REDIRECT_PATH)
def authorized():
    if "code" not in request.args:
        return redirect(url_for("index"))

    result = _build_msal_app().acquire_token_by_authorization_code(
        request.args["code"],
        scopes=SCOPE,
        redirect_uri=get_redirect_uri()
    )

    if "access_token" in result:
        access_token = result["access_token"]

        # ✅ Store access token in session for later API calls
        session["access_token"] = access_token
        print(session.get("access_token"))


        # 1. Get basic profile info
        graph_response = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={'Authorization': f'Bearer {access_token}'}
        )

        if graph_response.status_code != 200:
            return f"<h3>Failed to fetch user profile</h3><p>{graph_response.text}</p>"

        graph_data = graph_response.json()

        # 2. Try to fetch user photo (binary)
        photo_b64 = None
        photo_response = requests.get(
            "https://graph.microsoft.com/v1.0/me/photo/$value",
            headers={'Authorization': f'Bearer {access_token}'}
        )

        if photo_response.status_code == 200:
            photo_b64 = base64.b64encode(photo_response.content).decode("utf-8")
        else:
            print("No profile photo found or access denied.")

        # 3. Store only small info in session
        session["user"] = {
            "displayName": graph_data.get("displayName", "N/A"),
            "email": graph_data.get("mail") or graph_data.get("userPrincipalName"),
            "jobTitle": graph_data.get("jobTitle", "N/A"),
            "office": graph_data.get("officeLocation", "N/A"),
            "mobile": graph_data.get("mobilePhone", "N/A"),
            "userPrincipalName": graph_data.get("userPrincipalName", "N/A"),
            "department": graph_data.get("department", "N/A"),
        }

        # 4. Pass photo separately to template
        return render_template("dashboard.html", user=session["user"], photo_b64=photo_b64)

    else:
        error = result.get("error_description", "Unknown error during login.")
        return f"<h3>Login failed:</h3><p>{error}</p>"


@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("index"))
    user = session["user"]
    print(user)
    return render_template("dashboard.html", user=user)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        f"https://login.microsoftonline.com/common/oauth2/v2.0/logout"
        f"?post_logout_redirect_uri={url_for('index', _external=True)}"
        
    )

@app.route('/license-overview-data')
def license_overview_data():
    xml_path = os.getenv("XML_PATH")
    license_data = []
    valid_keys = [
        "SAP Business One Limited Logistics User",
        "SAP Business One Limited Financials User",
        "SAP Business One Professional User",
        "SAP Business One Limited CRM User"
    ]

    # --- Read from XML ---
    if not os.path.exists(xml_path):
        return jsonify({"error": f"XML file not found at {xml_path}"}), 404

    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        for user in root.findall(".//User"):
            user_name = user.findtext("UserName", "N/A").strip()
            is_connected = user.findtext("IsConnected", "0").strip()
            key_descs = [
                mod.findtext("KeyDesc", "N/A")
                for mod in user.findall(".//Module")
                if mod.findtext("KeyDesc") in valid_keys
            ]
            if key_descs:
                license_data.append({
                    "UserName": user_name,
                    "IsConnected": "Yes" if is_connected == "1" else "No",
                    "Modules": ", ".join(key_descs)
                })
    except Exception as e:
        print("❌ XML parsing error:", e)
        return jsonify({"error": f"XML parsing failed: {str(e)}"}), 500
    
    

    # --- Database Connection ---
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT USER_CODE, U_NAME, LOCKED, DfltsGroup
            FROM OUSR
        """)
        rows = cursor.fetchall()

        db_data = {
            row.USER_CODE.strip(): {
                "UserCode": row.USER_CODE.strip(),
                "FullName": row.U_NAME.strip() if row.U_NAME else "N/A",
                "Locked": "Yes" if row.LOCKED == 'Y' else "No",
                "DfltsGroup": row.DfltsGroup if row.DfltsGroup else "N/A"
            }
            for row in rows
        }
    except Exception as e:
        print("SQL Query Error:", e)
        return jsonify({"error": f"SQL query failed: {str(e)}"}), 500
    finally:
        conn.close()

    # --- Merge XML and DB Data ---
    merged_data = []
    for lic in license_data:
        db_info = db_data.get(lic["UserName"])
        if db_info:
            merged_data.append({
                "UserCode": db_info["UserCode"],
                "FullName": db_info["FullName"],
                "Locked": db_info["Locked"],
                "DfltsGroup": db_info["DfltsGroup"],
                "IsConnected": lic["IsConnected"],
                "Modules": lic["Modules"]
            })

    return jsonify(merged_data)

@app.route('/production-view-data')
def production_view_data():
    # --- Extract parameters from query string ---
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    warehouse = request.args.get("warehouse")

    # --- Validate parameters ---
    if not start_date or not end_date or not warehouse:
        return jsonify({"error": "Missing required parameters: start_date, end_date, warehouse"}), 400

    # --- Database connection ---
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # --- Execute stored procedure ---
        query = f"""
            EXEC GetProductionView '{start_date}', '{end_date}', '{warehouse}';
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]

        # --- Convert rows to JSON ---
        data = [dict(zip(columns, row)) for row in rows]

        # --- Compute unique project names ---
        project_name_col = next((col for col in columns if col.lower() == "project name".lower()), None)
        unique_project_names = set()

        if project_name_col:
            for row in data:
                project_name = row.get(project_name_col)
                if project_name:
                    unique_project_names.add(project_name)

        unique_count = len(unique_project_names)

        # --- Return both raw data and summary ---
        return jsonify({
            "unique_project_count": unique_count,
            "total_records": len(data),
            "records": data
        })

    except Exception as e:
        print("SQL Execution Error:", e)
        return jsonify({"error": f"Query execution failed: {str(e)}"}), 500

    finally:
        conn.close()

# -- Ticket schema example (Firestore collection: "tickets")
# {
#   "ticket_id": "uuid",
#   "title": "string",
#   "description": "string",
#   "status": "open"|"in_progress"|"closed",
#   "priority": "low"|"medium"|"high",
#   "created_by": { "email": "...", "displayName": "..." },
#   "assigned_to": { "email": "...", "displayName": "..." } | None,
#   "comments": [ { "by": {...}, "text": "...", "created_at": timestamp } ... ],
#   "created_at": timestamp,
#   "updated_at": timestamp
# }

@app.route("/api/tickets", methods=["POST"])
def create_ticket():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    title = request.form.get("title")
    description = request.form.get("description", "")
    priority = request.form.get("priority", "medium")
    ticket_id = request.form.get("ticket_id")

    if not title or not ticket_id:
        return jsonify({"error": "Missing title or ticket_id"}), 400

    now = datetime.utcnow()

    # --- FILE UPLOAD ---
    file_url = None
    if "file" in request.files:
        file = request.files["file"]
        if file.filename:
            bucket = storage.bucket()
            blob = bucket.blob(f"tickets/{ticket_id}/{file.filename}")
            blob.upload_from_file(file)
            blob.make_public()
            file_url = blob.public_url

    ticket_doc = {
        "ticket_id": ticket_id,
        "title": title,
        "description": description,
        "status": "open",
        "priority": priority,
        "file_url": file_url,
        "created_by": {
            "email": session["user"].get("email"),
            "displayName": session["user"].get("displayName")
        },
        "assigned_to": None,
        "comments": [],
        "created_at": now,
        "updated_at": now
    }

    db.collection("tickets").document(ticket_id).set(ticket_doc)

    return jsonify({"ok": True, "ticket_id": ticket_id}), 201

@app.route("/api/tickets", methods=["GET"])
def list_tickets():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    # optional query params: status, priority
    status = request.args.get("status")
    priority = request.args.get("priority")

    try:
        coll = db.collection("tickets")
        query = coll
        if status:
            query = query.where("status", "==", status)
        if priority:
            query = query.where("priority", "==", priority)
        docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(200).stream()

        results = []
        for d in docs:
            data = d.to_dict()
            # convert Firestore timestamp to isoformat string for JSON
            if "created_at" in data and hasattr(data["created_at"], "isoformat"):
                data["created_at"] = data["created_at"].isoformat()
            if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
                data["updated_at"] = data["updated_at"].isoformat()
            results.append(data)

        return jsonify(results)
    except Exception as e:
        print("Firestore list error:", e)
        return jsonify({"error": "failed to list tickets"}), 500


@app.route("/api/tickets/<ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        doc = db.collection("tickets").document(ticket_id).get()
        if not doc.exists:
            return jsonify({"error": "not found"}), 404
        data = doc.to_dict()
        # convert timestamps if present
        if "created_at" in data and hasattr(data["created_at"], "isoformat"):
            data["created_at"] = data["created_at"].isoformat()
        if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
            data["updated_at"] = data["updated_at"].isoformat()
        return jsonify(data)
    except Exception as e:
        print("Firestore get error:", e)
        return jsonify({"error": "failed to get ticket"}), 500


@app.route("/api/tickets/<ticket_id>", methods=["PATCH"])
def update_ticket(ticket_id):
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json() or {}
    updates = {}
    allowed = {"status", "priority", "assigned_to", "title", "description"}
    for k in allowed:
        if k in payload:
            updates[k] = payload[k]

    # optional comment
    comment_text = payload.get("comment")
    now = datetime.utcnow()

    try:
        ref = db.collection("tickets").document(ticket_id)
        doc = ref.get()
        if not doc.exists:
            return jsonify({"error": "not found"}), 404

        if updates:
            updates["updated_at"] = now
            ref.update(updates)

        if comment_text:
            comment = {
                "by": {
                    "email": session["user"].get("email"),
                    "displayName": session["user"].get("displayName")
                },
                "text": comment_text,
                "created_at": now
            }
            ref.update({
                "comments": firestore.ArrayUnion([comment]),
                "updated_at": now
            })

        return jsonify({"ok": True})
    except Exception as e:
        print("Firestore update error:", e)
        return jsonify({"error": "failed to update ticket"}), 500


@app.route("/api/tickets/<ticket_id>", methods=["DELETE"])
def delete_ticket(ticket_id):
    # optional: restrict only to admins
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        db.collection("tickets").document(ticket_id).delete()
        return jsonify({"ok": True})
    except Exception as e:
        print("Firestore delete error:", e)
        return jsonify({"error": "failed to delete ticket"}), 500

@app.route("/api/tickets/last-id", methods=["GET"])
def get_last_ticket_id():
    try:
        docs = db.collection("tickets").order_by("ticket_id", direction=firestore.Query.DESCENDING).limit(1).stream()
        last_id = None
        for d in docs:
            tid = d.to_dict().get("ticket_id")
            if tid and "IQTS-" in tid:
                last_id = tid.split("-")[1]
        return jsonify({"last_id": last_id})
    except:
        return jsonify({"last_id": None})

@app.route("/api/ms-users")
def get_ms_users():
    if "user" not in session or "access_token" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    access_token = session["access_token"]
    users = []
    url = "https://graph.microsoft.com/v1.0/users?$select=displayName,mail,jobTitle,department,officeLocation,userPrincipalName,accountEnabled"

    while url:
        graph_res = requests.get(url, headers={"Authorization": f"Bearer {access_token}"})
        if graph_res.status_code != 200:
            return jsonify({"error": "Graph API request failed", "details": graph_res.text}), 500

        data = graph_res.json()
        users.extend(data.get("value", []))
        url = data.get("@odata.nextLink")  # next page if available

    # Optional: fetch profile photos (can be slow for many users)
    for user in users:
        try:
            photo_res = requests.get(
                f"https://graph.microsoft.com/v1.0/users/{user['userPrincipalName']}/photo/$value",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if photo_res.status_code == 200:
                user["photo"] = f"data:image/jpeg;base64,{base64.b64encode(photo_res.content).decode('utf-8')}"
            else:
                user["photo"] = None
        except:
            user["photo"] = None

    return jsonify(users)

@app.route("/api/procurement/open-requests")
def open_purchase_requests():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    # Get start and end dates from query parameters
    start_date = request.args.get("start")
    end_date = request.args.get("end")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Base query
        sql = """
            SELECT T0.[CreateDate], T0.DocDate, T0.[DocNum], 
                   T1.[ItemCode], T1.[Dscription], T1.[Quantity], 
                   T1.[LineStatus], T1.[unitMsr], T0.[Comments], 
                   T0.[ReqDate], T0.[ReqName], T1.[WhsCode]
            FROM OPRQ T0
            INNER JOIN PRQ1 T1 ON T0.[DocEntry] = T1.[DocEntry]
            WHERE T1.[LineStatus] = 'O'
        """

        params = []

        # Apply date filtering if both start and end dates are provided
        if start_date and end_date:
            sql += " AND T0.[ReqDate] BETWEEN ? AND ?"
            params.extend([start_date, end_date])

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]

        return jsonify(data)

    except Exception as e:
        print("SQL Execution Error:", e)
        return jsonify({"error": f"Query execution failed: {str(e)}"}), 500
    finally:
        conn.close()

@app.route("/api/open-orders")
def api_open_orders():
    start = request.args.get("start")
    end = request.args.get("end")

    print("📌 Received start:", start, "end:", end)

    if not start or not end:
        return jsonify({"error": "Missing date range"}), 400

    try:
        # ✅ Use your existing DB connection
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        query = """
            SELECT 
                T0.DocDate, 
                T0.DocNum,
                T0.CardCode,
                T0.CardName,
                T0.DocStatus,
                T1.ItemCode,
                T1.Dscription,
                T1.LineStatus,
                T1.Quantity,
                T1.Price
            FROM OPOR T0
            INNER JOIN POR1 T1 ON T0.DocEntry = T1.DocEntry
            WHERE T0.DocStatus = 'O'
                AND T0.DocDate BETWEEN ? AND ?
        """

        cursor.execute(query, (start, end))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            results.append({
                "DocDate": str(r.DocDate),
                "DocNum": r.DocNum,
                "CardCode": r.CardCode,
                "CardName": r.CardName,
                "DocStatus": r.DocStatus,
                "ItemCode": r.ItemCode,
                "Dscription": r.Dscription,
                "LineStatus": r.LineStatus,
                "Quantity": float(r.Quantity),
                "Price": float(r.Price)
            })

        cursor.close()
        conn.close()

        return jsonify(results)

    except Exception as e:
        print("❌ SQL ERROR:", e)
        return jsonify({"error": "Database query failed"}), 500


# ----------------- MAIN -----------------
if __name__ == "__main__":
    app.run(debug=True)
