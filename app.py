import os
import time
import traceback
from flask import Flask, request, jsonify, send_from_directory

# Try importing real dependencies
try:
    from google import genai
    from google.cloud import storage
    HAS_GCP = True
except ImportError:
    HAS_GCP = False

app = Flask(__name__, static_folder='static', static_url_path='')

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'document' not in request.files:
        return jsonify({'error': 'No document uploaded'}), 400
    
    file = request.files['document']
    
    # In a real scenario, we'd upload to GCS. 
    # For this demo, we mock the GCS URI generation.
    file_id = f"gs://mock-bucket-{int(time.time())}/{file.filename}"
    
    return jsonify({'file_id': file_id, 'filename': file.filename, 'status': 'uploaded'})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    file_id = data.get('file_id')
    
    if not file_id:
        return jsonify({'error': 'No file_id provided'}), 400
        
    use_mock = True
    
    # If we have actual Google Auth, we could try the real API
    # But for demo purposes, we will return a highly structured mock response
    # to simulate the long-context capabilities of Gemini 1.5 Pro.
    
    time.sleep(2.5) # Simulate processing time for a "100+ page document"
    
    mock_response = {
        "summary": "This document is a standard Residential Lease Agreement. It establishes a 12-month initial term, automatically transitioning to month-to-month thereafter. The tenant is responsible for direct utilities (electricity, internet), while the landlord provides water, sewage, and standard garbage collection. Subletting or assigning the lease is strictly prohibited without prior written consent from the property management.",
        "red_flags": [
            "Section 4.b: The landlord reserves the right to terminate the lease with merely 7 days' notice for undefined 'minor infractions'.",
            "Section 7.a: Contains a broad indemnification clause where the tenant waives their right to a jury trial in all potential disputes.",
            "Section 9.d: Places an unusually high burden on the tenant, making them strictly liable for all maintenance or repair costs up to $500 per incident, regardless of fault."
        ]
    }
    
    return jsonify(mock_response)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    question = data.get('question', '').lower()
    
    time.sleep(1.5) # Simulate inference time
    
    answer = "Based on the provided document, I cannot locate a specific clause addressing that question."
    
    if "notice" in question or "enter" in question or "landlord" in question:
         answer = "Yes, according to **Section 11 (Right of Entry)**, the landlord may enter the premises immediately and without notice exclusively in the case of an emergency (e.g., fire, flood). For all non-emergencies (inspections, repairs), the landlord is required to provide a minimum of **24 hours written notice** prior to entry."
    elif "pets" in question or "dog" in question or "animal" in question:
         answer = "**Section 5 (Pets)** explicitly prohibits all pets. However, there is a sub-clause that allows pets if a separate pet addendum is signed, accompanied by a $500 non-refundable pet fee and an additional $50/month in 'pet rent'."
    elif "deposit" in question or "security deposit" in question:
         answer = "Your security deposit ($2,000) is held under **Section 3**. It must be returned within 30 days of vacating the premises, minus any itemized deductions for damages beyond normal wear and tear."
         
    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
