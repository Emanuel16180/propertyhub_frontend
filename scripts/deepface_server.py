import os
import json
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from deepface import DeepFace
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import uuid

app = Flask(__name__)
CORS(app)

# Directorio para almacenar las imágenes de referencia
FACES_DIR = "face_database"
os.makedirs(FACES_DIR, exist_ok=True)

def base64_to_image(base64_string):
    """Convierte base64 a imagen PIL"""
    try:
        # Remover el prefijo data:image/...;base64,
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        return image
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

def save_temp_image(image):
    """Guarda imagen temporal para DeepFace"""
    temp_path = os.path.join(tempfile.gettempdir(), f"temp_face_{uuid.uuid4()}.jpg")
    image.save(temp_path)
    return temp_path

@app.route('/register_face', methods=['POST'])
def register_face():
    """Registra una nueva cara en la base de datos"""
    try:
        data = request.json
        resident_id = data.get('resident_id')
        face_image_base64 = data.get('face_image')
        
        if not resident_id or not face_image_base64:
            return jsonify({'success': False, 'error': 'Missing resident_id or face_image'})
        
        # Convertir base64 a imagen
        image = base64_to_image(face_image_base64)
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image format'})
        
        # Guardar imagen de referencia
        face_path = os.path.join(FACES_DIR, f"{resident_id}.jpg")
        image.save(face_path)
        
        # Verificar que DeepFace puede detectar la cara
        try:
            DeepFace.represent(img_path=face_path, model_name='Facenet')
            return jsonify({'success': True, 'message': f'Face registered for resident {resident_id}'})
        except Exception as e:
            os.remove(face_path)  # Eliminar imagen si no se puede procesar
            return jsonify({'success': False, 'error': f'No face detected in image: {str(e)}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    """Reconoce una cara comparándola con la base de datos"""
    try:
        data = request.json
        face_image_base64 = data.get('face_image')
        
        if not face_image_base64:
            return jsonify({'success': False, 'error': 'Missing face_image'})
        
        # Convertir base64 a imagen
        image = base64_to_image(face_image_base64)
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image format'})
        
        # Guardar imagen temporal
        temp_path = save_temp_image(image)
        
        try:
            # Buscar coincidencias en la base de datos usando DeepFace
            results = DeepFace.find(
                img_path=temp_path,
                db_path=FACES_DIR,
                model_name='Facenet',
                distance_metric='cosine',
                enforce_detection=True
            )
            
            # Limpiar archivo temporal
            os.remove(temp_path)
            
            if len(results) > 0 and len(results[0]) > 0:
                # Obtener el mejor match
                best_match = results[0].iloc[0]
                distance = best_match['distance']
                identity_path = best_match['identity']
                
                # Extraer resident_id del nombre del archivo
                resident_id = os.path.splitext(os.path.basename(identity_path))[0]
                
                # Convertir distancia a confianza (menor distancia = mayor confianza)
                confidence = max(0, 1 - distance)
                
                # Umbral de confianza (ajustable)
                confidence_threshold = 0.6
                
                if confidence >= confidence_threshold:
                    return jsonify({
                        'success': True,
                        'recognized': True,
                        'resident_id': resident_id,
                        'confidence': confidence,
                        'distance': distance
                    })
                else:
                    return jsonify({
                        'success': True,
                        'recognized': False,
                        'message': 'Face not recognized with sufficient confidence',
                        'confidence': confidence
                    })
            else:
                return jsonify({
                    'success': True,
                    'recognized': False,
                    'message': 'No matching face found in database'
                })
                
        except Exception as e:
            # Limpiar archivo temporal en caso de error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({'success': False, 'error': f'Face recognition error: {str(e)}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({'status': 'healthy', 'message': 'DeepFace server is running'})

if __name__ == '__main__':
    print("Starting DeepFace server...")
    print(f"Face database directory: {FACES_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=True)
