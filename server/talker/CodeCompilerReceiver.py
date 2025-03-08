from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
from wordconverter import process_plain_text_to_word

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure the API key for Google Generative AI
genai.configure(api_key="")
model = genai.GenerativeModel("gemini-1.5-flash")

@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        input_data = request.get_json()
        if not input_data or 'code' not in input_data:
            return jsonify({"error": "Prompt is required and must be in JSON format"}), 400

        prompt = input_data.get("code")
        #print(f"Received prompt: {prompt}")

        # Prepare the prompt for the Generative AI
        prompt = (
            "Analyze the following Python code and generate a detailed 1000-word report covering these aspects:\n"
            "1. Required imports and commands needed for installation.\n"
            "2. Python modules used in the code and their logical approach.\n"
            "3. Errors in the logical approach.\n"
            "4. Errors in the syntax and if none, suggest better approaches for code writing.\n"
            "5. Rate the code out of 10 using different metrics and mention the metrics considered.\n\n"
            "6. Propose test cases to validate the http methods for Get,Post,Put,Delete each 5 test cases with like http method,testable url,its request body,its header example[post,'http:url',{key=value},key=value] in this 5 for each http method.\n\n"
            "Code:\n" + prompt
        )

        response = model.generate_content(prompt)
        #print(f"Generated response: {response}")

        # Check if response.text exists
        if not hasattr(response, 'text'):
            return jsonify({"error": "Invalid response from the AI model"}), 500

        # Generate Word document using response.text
        word_path = process_plain_text_to_word(response.text)

        # Send the Word document to the client
        return send_file(word_path, as_attachment=True)

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Run the app
if __name__ == '__main__':
    app.run(port=5042, debug=True)
