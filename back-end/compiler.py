from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import sys
import os
import random
import time
import tempfile
import socket
import psutil
import threading

app = Flask(__name__)
CORS(app)

# Configuration
FLASK_PORT_START = 6000
FLASK_PORT_END = 6100
used_ports = set()
running_processes = {}

def is_port_in_use(port):
    """Check if a port is already in use"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('127.0.0.1', port))
            return result == 0
    except:
        return True

def get_free_port():
    """Get a random free port"""
    while True:
        port = random.randint(FLASK_PORT_START, FLASK_PORT_END)
        if port not in used_ports and not is_port_in_use(port):
            used_ports.add(port)
            return port

def cleanup_process(port):
    """Clean up process running on a specific port"""
    if port in running_processes:
        try:
            process = running_processes[port]
            if process.poll() is None:  # Process is still running
                # Kill process tree on Windows
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(process.pid)], 
                             capture_output=True)
        except Exception as e:
            print(f"Error cleaning up process: {e}")
        finally:
            used_ports.discard(port)
            running_processes.pop(port, None)

def modify_flask_code(code, port):
    """Modify Flask code to run on specific port with Windows compatibility"""
    # Split the code into lines
    lines = code.splitlines()
    
    # Remove any existing if __name__ == '__main__': block
    filtered_lines = [line for line in lines 
                     if not line.strip().startswith('if __name__')
                     and not line.strip().startswith('app.run')]
    
    # Add our custom run configuration
    new_code = '\n'.join(filtered_lines) + """

if __name__ == '__main__':
    from werkzeug.serving import run_simple
    run_simple('127.0.0.1', {port}, app, use_debugger=False, use_reloader=False)
""".format(port=port)
    
    return new_code

@app.route('/run', methods=['POST'])
def run_code():
    try:
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify(error="No code provided"), 400

        # Check if code is a Flask app
        is_flask_app = 'from flask import Flask' in code and 'app = Flask(__name__)' in code

        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            temp_file = f.name
            if is_flask_app:
                port = get_free_port()
                modified_code = modify_flask_code(code, port)
                f.write(modified_code)
            else:
                f.write(code)

        try:
            if is_flask_app:
                # Start Flask app as a subprocess
                process = subprocess.Popen(
                    [sys.executable, temp_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                )
                
                running_processes[port] = process
                
                # Wait for the server to start
                time.sleep(2)
                
                # Check if process started successfully
                if process.poll() is not None:
                    _, stderr = process.communicate()
                    cleanup_process(port)
                    return jsonify(error=f"Failed to start Flask app: {stderr}"), 500
                
                # Check if port is actually in use
                if not is_port_in_use(port):
                    cleanup_process(port)
                    return jsonify(error="Flask app failed to bind to port"), 500
                
                url = f"http://127.0.0.1:{port}"
                return jsonify({
                    "url": url,
                    "message": "Flask application started successfully",
                    "port": port
                }), 200
            else:
                # Run regular Python script
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                return jsonify({
                    "output": result.stdout if result.returncode == 0 else result.stderr,
                    "success": result.returncode == 0
                }), 200 if result.returncode == 0 else 400

        finally:
            # Cleanup temporary file
            try:
                os.unlink(temp_file)
            except:
                pass

    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/cleanup', methods=['POST'])
def cleanup():
    """Endpoint to cleanup a specific port"""
    try:
        data = request.get_json()
        port = data.get('port')
        
        if not port:
            return jsonify(error="No port provided"), 400
            
        cleanup_process(int(port))
        return jsonify(message=f"Cleaned up process on port {port}"), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/cleanup-all', methods=['POST'])
def cleanup_all():
    """Endpoint to cleanup all running processes"""
    try:
        ports = list(running_processes.keys())
        for port in ports:
            cleanup_process(port)
        return jsonify(message=f"Cleaned up all processes"), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

def cleanup_on_exit():
    """Cleanup all processes before exit"""
    for port in list(running_processes.keys()):
        cleanup_process(port)

if __name__ == '__main__':
    try:
        # Register cleanup on exit
        import atexit
        atexit.register(cleanup_on_exit)
        
        # Start the main Flask app
        app.run(host='127.0.0.1', port=5600, debug=True, use_reloader=False)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)