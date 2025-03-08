from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return app.send_static_file('index.html')

# Store active rooms
rooms = {}

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    # Find and clean up any rooms this user was in
    for room_id in list(rooms.keys()):
        if request.sid in rooms[room_id]:
            rooms[room_id].remove(request.sid)
            if len(rooms[room_id]) == 0:
                rooms.pop(room_id, None)
            else:
                socketio.emit('user-disconnected', to=room_id)

@socketio.on('create')
def handle_create(room_id):
    print(f'Create room request: {room_id} from {request.sid}')
    if room_id not in rooms:
        rooms[room_id] = [request.sid]
        join_room(room_id)
        emit('created', room_id)
        print(f'Room {room_id} created by {request.sid}')
    else:
        emit('full', room_id)
        print(f'Room {room_id} is full')

@socketio.on('join')
def handle_join(room_id):
    print(f'Join room request: {room_id} from {request.sid}')
    if room_id not in rooms:
        rooms[room_id] = [request.sid]
        join_room(room_id)
        emit('created', room_id)
        print(f'Room {room_id} created by {request.sid} (via join)')
    elif len(rooms[room_id]) < 2:
        rooms[room_id].append(request.sid)
        join_room(room_id)
        emit('joined', room_id)
        print(f'User {request.sid} joined room {room_id}')
    else:
        emit('full', room_id)
        print(f'Room {room_id} is full')

@socketio.on('ready')
def handle_ready(room_id):
    print(f'User {request.sid} is ready in room {room_id}')
    emit('ready', skip_sid=request.sid, to=room_id)

@socketio.on('offer')
def handle_offer(data):
    print(f'User {request.sid} sent offer in room {data["room"]}')
    emit('offer', data['sdp'], skip_sid=request.sid, to=data['room'])

@socketio.on('answer')
def handle_answer(data):
    print(f'User {request.sid} sent answer in room {data["room"]}')
    emit('answer', data['sdp'], skip_sid=request.sid, to=data['room'])

@socketio.on('candidate')
def handle_candidate(data):
    print(f'User {request.sid} sent ICE candidate in room {data["room"]}')
    emit('candidate', data, skip_sid=request.sid, to=data['room'])

@socketio.on('leave')
def handle_leave(room_id):
    print(f'User {request.sid} left room {room_id}')
    leave_room(room_id)
    if room_id in rooms and request.sid in rooms[room_id]:
        rooms[room_id].remove(request.sid)
        if len(rooms[room_id]) == 0:
            rooms.pop(room_id, None)
        else:
            emit('user-disconnected', skip_sid=request.sid, to=room_id)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)