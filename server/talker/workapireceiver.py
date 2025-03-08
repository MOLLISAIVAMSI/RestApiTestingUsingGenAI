from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
from pymongo import MongoClient
import gridfs
import os
import datetime
from io import BytesIO
from wordconverter import process_plain_text_to_word

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure the API key for Google Generative AI
genai.configure(api_key="")
model = genai.GenerativeModel("gemini-1.5-flash")

# MongoDB configuration
MONGO_URI =""
client = MongoClient(MONGO_URI)
db = client["report_db"]  # Database name
fs = gridfs.GridFS(db)  # Initialize GridFS for file storage

@app.route('/generate_report', methods=['POST'])
def generate_content():
    try:
        # Validate input JSON
        input_data = request.get_json()
        if not input_data or 'requestData' not in input_data:
            return jsonify({"error": "Prompt is required and must be in JSON format"}), 400

        # Extract requestData dictionary
        request_data = input_data.get("requestData")

        # Prepare the prompt for AI model
        prompt = (
            "Analyze the following API HTTP method response and generate a detailed 1000-word report covering these aspects:\n"
            "1. API URL, method, headers, response.\n"
            "2. Detailed report on the particular API.\n"
            "3. Errors in the logical approach.\n"
            "4. Errors in the syntax and, if none, suggest better approaches for code writing.\n"
            "5. Rate the working of API out of 10 using different metrics and mention the metrics considered.\n\n"
            "API Details:\n"
            f"URL: {request_data.get('apiURL', 'N/A')}\n"
            f"Method: {request_data.get('apiMethod', 'N/A')}\n"
            f"Headers: {request_data.get('apiHeaders', 'N/A')}\n"
            f"Body: {request_data.get('apiBody', 'N/A')}\n"
            f"Response: {request_data.get('apiResponse', 'N/A')}\n"
        )

        # Call the Generative AI model
        response = model.generate_content(prompt)
        print(f"Generated response: {response}")

        # Validate AI response
        if not hasattr(response, 'text'):
            return jsonify({"error": "Invalid response from the AI model"}), 500

        # Generate Word document content
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        file_name = f"API_Report_{timestamp}.docx"
        word_buffer = BytesIO()
        process_plain_text_to_word(response.text, word_buffer)  # Use buffer instead of file path

        # Store the Word document in MongoDB GridFS
        word_buffer.seek(0)  # Reset buffer pointer
        file_id = fs.put(word_buffer, filename=file_name, api_details=request_data, created_at=datetime.datetime.now())

        # Send the file back to the client
        return send_file(BytesIO(fs.get(file_id).read()), as_attachment=True, download_name=file_name)

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Run the app
if __name__ == '__main__':
    app.run(port=5062, debug=True)
