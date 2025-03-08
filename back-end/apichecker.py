from flask import Flask, request, jsonify, g
from flask_cors import CORS
import requests
import time
import psutil
from collections import deque
from prometheus_client import Counter
from flask_limiter import Limiter

app = Flask(__name__)
CORS(app, resources={
    r"/test_api": {
        "origins": ["http://localhost:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Rate Limiting Setup
limiter = Limiter(key_func=lambda: request.remote_addr)
limiter.init_app(app)

# Throughput Tracking
request_times = deque(maxlen=100)

# Total Requests Counter
request_counter = Counter('flask_requests_total', 'Total requests received')

# Error Counter
error_counter = Counter('flask_errors_total', 'Total failed requests')

@app.route('/test_api', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limit: 10 requests per minute per IP
def test_api():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    
    try:
        g.start_time = time.time()
        request_times.append(time.time())
        request_counter.inc()
        request_size = request.content_length or 0
        
        data = request.get_json()
        api_method = data.get('apiMethod')
        api_url = data.get('apiURL')
        api_body = data.get('apiBody')
        api_headers = data.get('apiHeaders', {})

        if not api_method:
            return jsonify({"error": "API method is required"}), 400
        if not api_url:
            return jsonify({"error": "API URL is required"}), 400

        response = requests.request(
            method=api_method,
            url=api_url,
            headers=api_headers,
            json=api_body if api_body else None
        )

        latency = time.time() - g.start_time
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent
        now = time.time()
        one_second_ago = now - 1
        throughput = sum(1 for t in request_times if t > one_second_ago)

        response_data = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "data": None if response.status_code == 204 else response.json() if response.headers.get("Content-Type", "").startswith("application/json") else response.text,
            "metrics": {
                "response_time": latency,
                "request_size": request_size,
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "requests_per_second": throughput,
                "total_requests": request_counter._value.get(),
                "error_count": error_counter._value.get()
            }
        }

        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        error_counter.inc()
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except Exception as e:
        error_counter.inc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)
