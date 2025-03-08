from flask import Flask, request, jsonify
from http import HTTPStatus
from werkzeug.exceptions import BadRequest, NotFound
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],  # Add your React app's origin
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],  # Allow all necessary methods
        "allow_headers": ["Content-Type"]
    }
})

# In-memory database for demonstration
items = {
        1: {'id': 1, 'name': 'Item 1', 'description': 'Description 1'},
        2: {'id': 2, 'name': 'Item 2', 'description': 'Description 2'}
}

# Error handlers
@app.errorhandler(BadRequest)
def handle_bad_request(e):
    return jsonify(error=str(e)), HTTPStatus.BAD_REQUEST

@app.errorhandler(NotFound)
def handle_not_found(e):
    return jsonify(error=str(e)), HTTPStatus.NOT_FOUND

# GET all items
@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify(items=list(items.values())), HTTPStatus.OK

# GET single item
@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    item = items.get(item_id)
    if not item:
        raise NotFound(f"Item with id {item_id} not found")
    return jsonify(item=item), HTTPStatus.OK

# POST new item
@app.route('/api/items', methods=['POST'])
def create_item():
    if not request.is_json:
        raise BadRequest("Content-Type must be application/json")
    
    data = request.get_json()
    
    if not data or 'name' not in data:
        raise BadRequest("Request must include 'name' field")
    
    item_id = len(items) + 1
    new_item = {
        'id': item_id,
        'name': data['name'],
        'description': data.get('description', '')
    }
    
    items[item_id] = new_item
    return jsonify(item=new_item), HTTPStatus.CREATED

# PUT update item
@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    if not request.is_json:
        raise BadRequest("Content-Type must be application/json")
    
    if item_id not in items:
        raise NotFound(f"Item with id {item_id} not found")
    
    data = request.get_json()
    
    if not data or not ('name' in data or 'description' in data):
        raise BadRequest("Request must include either 'name' or 'description' field")
    
    items[item_id].update({
        'name': data.get('name', items[item_id]['name']),
        'description': data.get('description', items[item_id]['description'])
    })
    
    return jsonify(item=items[item_id]), HTTPStatus.OK

# PATCH partial update item
@app.route('/api/items/<int:item_id>', methods=['PATCH'])
def patch_item(item_id):
    if not request.is_json:
        raise BadRequest("Content-Type must be application/json")
    
    if item_id not in items:
        raise NotFound(f"Item with id {item_id} not found")
    
    data = request.get_json()
    
    if not data:
        raise BadRequest("Request body cannot be empty")
    
    # Only update provided fields
    for key in data:
        if key in ['name', 'description']:
            items[item_id][key] = data[key]
    
    return jsonify(item=items[item_id]), HTTPStatus.OK

# DELETE item
@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    if item_id not in items:
        raise NotFound(f"Item with id {item_id} not found")
    
    deleted_item = items.pop(item_id)
    return jsonify(item=deleted_item), HTTPStatus.OK

if __name__ == '__main__':
    # Add some sample data
    app.run(debug=True)