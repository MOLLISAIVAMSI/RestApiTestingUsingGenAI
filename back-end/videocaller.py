from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Dictionary to store connected users and their room associations
connected_users = {}

@app.route('/')
def index():
    return "Video Call Server Running"

@socketio.on('connect')
def handle_connect():
    user_id = request.sid
    print(f"Client connected: {user_id}")
    connected_users[user_id] = None  # No room assigned yet

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    print(f"Client disconnected: {user_id}")
    if user_id in connected_users:
        del connected_users[user_id]

@socketio.on('offer')
def handle_offer(offer_data):
    print("Received offer")
    # Broadcast the offer to all other clients
    emit('offer', offer_data, broadcast=True, skip_sid=request.sid)

@socketio.on('answer')
def handle_answer(answer_data):
    print("Received answer")
    # Broadcast the answer to all other clients
    emit('answer', answer_data, broadcast=True, skip_sid=request.sid)

@socketio.on('ice-candidate')
def handle_ice_candidate(candidate):
    print("Received ICE candidate")
    # Broadcast the ICE candidate to all other clients
    emit('ice-candidate', candidate, broadcast=True, skip_sid=request.sid)

# Optional: Create a room system for supporting multiple calls
@socketio.on('join-room')
def handle_join_room(room_id):
    user_id = request.sid
    print(f"User {user_id} joining room {room_id}")
    
    # Leave current room if in one
    if connected_users[user_id]:
        emit('user-left', user_id, to=connected_users[user_id])
        
    # Join new room
    connected_users[user_id] = room_id
    emit('user-joined', user_id, to=room_id)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)