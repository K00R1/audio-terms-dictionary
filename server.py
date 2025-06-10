from flask import Flask, jsonify, send_from_directory, render_template, request
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app) # Enable CORS for all routes

AUDIO_TERMS_FILE = 'audio_termsnull.txt'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/terms')
def get_terms():
    terms = []
    unique_categories = set()
    try:
        with open(AUDIO_TERMS_FILE, 'r', encoding='gbk', errors='replace') as f:
            # Skip header
            next(f)
            for line in f:
                parts = line.strip().split('\t')
                # Ensure there are at least 3 parts for basic term info
                if len(parts) < 3:
                    continue # Skip lines that don't even have basic info

                category = "分类进行中" # Default category
                # Check if the 4th part exists and is not 'null' or empty
                if len(parts) >= 4 and parts[3].strip().lower() != 'null' and parts[3].strip():
                    category = parts[3].strip()

                term = {
                    'abbreviation': parts[0].strip(),
                    'english': parts[1].strip(),
                    'chinese': parts[2].strip(),
                    'category': category
                }
                terms.append(term)
                unique_categories.add(category)
    except Exception as e:
        print(f"Error reading terms file: {e}")
        return jsonify({"error": "Could not read terms data"}), 500
    print("Unique Categories found:", unique_categories)
    print("Terms sent to frontend:", terms)
    return jsonify(terms)

@app.route('/report_error', methods=['POST'])
def report_error():
    if request.is_json:
        error_data = request.get_json()
        report_file = 'error_reports.txt'
        try:
            with open(report_file, 'a', encoding='utf-8') as f:
                f.write(str(error_data) + '\n---\n')
            return jsonify({"message": "Report submitted successfully"}), 200
        except Exception as e:
            print(f"Error writing error report: {e}")
            return jsonify({"error": "Could not save report"}), 500
    return jsonify({"error": "Request must be JSON"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001) 