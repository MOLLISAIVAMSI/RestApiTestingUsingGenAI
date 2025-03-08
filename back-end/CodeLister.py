from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)

# MongoDB Atlas connection details
MONGO_URI = ""
DB_NAME = "DataStorage"
COLLECTION_NAME = "collections"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
files_collection = db[COLLECTION_NAME]


@app.route('/files', methods=['GET'])
def get_file_system():
    """Fetches the entire file system structure."""
    files = list(files_collection.find({}))
    for file in files:
        file['_id'] = str(file['_id'])
    return jsonify(files)

@app.route('/files', methods=['POST'])
def create_file():
    """Creates a new file or folder."""
    data = request.get_json()
    name = data.get('name')
    item_type = data.get('type')
    parent_id = data.get('parent_id')

    if not name or not item_type:
        return jsonify({'error': 'Name and type are required.'}), 400
    
    new_file = {
        'name': name,
        'type': item_type,
        'parent_id': parent_id,
        'content': '',
        'isOpen': False if item_type == 'folder' else None
    }
    
    if item_type == 'folder':
        new_file['children'] = []

    inserted_file = files_collection.insert_one(new_file)

    new_file['_id'] = str(inserted_file.inserted_id)

    return jsonify(new_file), 201


@app.route('/files/<file_id>', methods=['PUT'])
def update_file(file_id):
    """Renames a file or folder or stores the content."""
    data = request.get_json()
    new_name = data.get('newName')
    content = data.get('content')
    
    update_data = {}

    if new_name:
        update_data['name'] = new_name
    if content is not None:
        update_data['content'] = content


    if not update_data:
        return jsonify({'error': 'New name or Content required for update'}), 400
    
    result = files_collection.update_one({'_id': ObjectId(file_id)}, {'$set': update_data})

    if result.modified_count == 0:
        return jsonify({'error': 'File not found'}), 404

    return jsonify({'message': 'File updated successfully'}), 200


@app.route('/files/<file_id>', methods=['GET'])
def get_file_content(file_id):
    """Get the content of the file from the file_id"""
    file = files_collection.find_one({'_id': ObjectId(file_id)})
    if file:
        file['_id'] = str(file['_id'])
        return jsonify(file), 200
    else:
       return jsonify({'error': 'File not found'}), 404



@app.route('/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Deletes a file or folder."""
    result = files_collection.delete_one({'_id': ObjectId(file_id)})
    if result.deleted_count == 0:
        return jsonify({'error': 'File not found'}), 404
    return jsonify({'message': 'File deleted successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5260)