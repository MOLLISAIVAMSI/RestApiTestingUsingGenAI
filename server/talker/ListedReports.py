from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
from pymongo import MongoClient
import gridfs
from bson import ObjectId
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB Configuration
MONGO_URI = ""
client = MongoClient(MONGO_URI)
db = client["report_db"]
fs = gridfs.GridFS(db)

@app.route('/api/documents', methods=['GET'])
def get_documents():
    try:
        files = fs.find()
        documents = []
        for file in files:
            document = {
                "_id": str(file._id),
                "filename": file.filename,
                "date": file.upload_date.isoformat(),
                "contentType": file.content_type,
                "length": round(file.length / 1024, 2),  # Convert bytes to KB
            }
            documents.append(document)
        
        return jsonify(documents)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    try:
        file = fs.get(ObjectId(doc_id))
        return send_file(
            file,
            download_name=file.filename,
            as_attachment=True
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    try:
        fs.delete(ObjectId(doc_id))
        return jsonify({"message": "Document deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/<doc_id>', methods=['PATCH'])
def update_document(doc_id):
    try:
        data = request.json
        new_filename = data.get('filename')
        
        # Since GridFS doesn't support direct updates, we need to:
        # 1. Get the original file
        # 2. Save it with the new filename
        # 3. Delete the original
        
        original = fs.get(ObjectId(doc_id))
        file_data = original.read()
        
        # Delete original
        fs.delete(ObjectId(doc_id))
        
        # Save with new filename
        new_id = fs.put(
            file_data,
            filename=new_filename,
            content_type=original.content_type
        )
        
        return jsonify({
            "message": "Document renamed successfully",
            "_id": str(new_id),
            "filename": new_filename
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5100, debug=True)