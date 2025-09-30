import os
import json
import base64
import numpy as np
from io import BytesIO
from PIL import Image
from deepface import DeepFace
import tempfile
import sys

class FaceRecognitionSystem:
    def __init__(self, db_path="face_database"):
        self.db_path = db_path
        self.model_name = "ArcFace"  # Modelo más preciso
        self.detector_backend = "mtcnn"  # Detector más robusto
        self.distance_metric = "euclidean"
        self.threshold = 0.80
        
        # Crear directorio de base de datos si no existe
        os.makedirs(self.db_path, exist_ok=True)
    
    def base64_to_image(self, base64_string):
        """Convierte base64 a imagen PIL"""
        try:
            # Remover el prefijo data:image/jpeg;base64, si existe
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            
            image_data = base64.b64decode(base64_string)
            image = Image.open(BytesIO(image_data))
            return image
        except Exception as e:
            raise Exception(f"Error converting base64 to image: {str(e)}")
    
    def save_face_to_db(self, resident_id, base64_image):
        """Guarda la imagen facial en la base de datos"""
        try:
            image = self.base64_to_image(base64_image)
            image_path = os.path.join(self.db_path, f"{resident_id}.jpg")
            image.save(image_path, "JPEG", quality=95)
            return image_path
        except Exception as e:
            raise Exception(f"Error saving face to database: {str(e)}")
    
    def verify_face(self, base64_image, resident_id):
        """Verifica si la imagen coincide con un residente específico"""
        try:
            # Guardar imagen temporal para verificación
            temp_image = self.base64_to_image(base64_image)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                temp_image.save(temp_file.name, "JPEG", quality=95)
                temp_path = temp_file.name
            
            # Ruta de la imagen del residente en la base de datos
            resident_image_path = os.path.join(self.db_path, f"{resident_id}.jpg")
            
            if not os.path.exists(resident_image_path):
                return {"verified": False, "confidence": 0.0, "error": "Resident image not found"}
            
            # Realizar verificación con DeepFace
            result = DeepFace.verify(
                img1_path=temp_path,
                img2_path=resident_image_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                distance_metric=self.distance_metric
            )
            
            # Limpiar archivo temporal
            os.unlink(temp_path)
            
            # Calcular confianza basada en la distancia
            distance = result["distance"]
            confidence = max(0, 1 - (distance / self.threshold))
            
            return {
                "verified": result["verified"],
                "confidence": confidence,
                "distance": distance,
                "threshold": self.threshold
            }
            
        except Exception as e:
            # Limpiar archivo temporal si existe
            if 'temp_path' in locals():
                try:
                    os.unlink(temp_path)
                except:
                    pass
            return {"verified": False, "confidence": 0.0, "error": str(e)}
    
    def find_face_in_database(self, base64_image):
        """Busca la cara en toda la base de datos"""
        try:
            # Guardar imagen temporal
            temp_image = self.base64_to_image(base64_image)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                temp_image.save(temp_file.name, "JPEG", quality=95)
                temp_path = temp_file.name
            
            # Buscar en la base de datos
            results = DeepFace.find(
                img_path=temp_path,
                db_path=self.db_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                distance_metric=self.distance_metric
            )
            
            # Limpiar archivo temporal
            os.unlink(temp_path)
            
            if len(results) > 0 and len(results[0]) > 0:
                # Obtener el mejor match
                best_match = results[0].iloc[0]
                distance = best_match[f"{self.model_name}_{self.distance_metric}"]
                
                if distance <= self.threshold:
                    # Extraer ID del residente del nombre del archivo
                    identity_path = best_match["identity"]
                    resident_id = os.path.splitext(os.path.basename(identity_path))[0]
                    confidence = max(0, 1 - (distance / self.threshold))
                    
                    return {
                        "found": True,
                        "resident_id": resident_id,
                        "confidence": confidence,
                        "distance": distance
                    }
            
            return {"found": False, "confidence": 0.0}
            
        except Exception as e:
            # Limpiar archivo temporal si existe
            if 'temp_path' in locals():
                try:
                    os.unlink(temp_path)
                except:
                    pass
            return {"found": False, "confidence": 0.0, "error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return
    
    command = sys.argv[1]
    face_system = FaceRecognitionSystem()
    
    try:
        if command == "register":
            # Registrar nueva cara: python deepface_recognition.py register <resident_id> <base64_image>
            if len(sys.argv) != 4:
                print(json.dumps({"error": "Usage: register <resident_id> <base64_image>"}))
                return
            
            resident_id = sys.argv[2]
            base64_image = sys.argv[3]
            
            image_path = face_system.save_face_to_db(resident_id, base64_image)
            print(json.dumps({"success": True, "image_path": image_path}))
        
        elif command == "verify":
            # Verificar cara: python deepface_recognition.py verify <resident_id> <base64_image>
            if len(sys.argv) != 4:
                print(json.dumps({"error": "Usage: verify <resident_id> <base64_image>"}))
                return
            
            resident_id = sys.argv[2]
            base64_image = sys.argv[3]
            
            result = face_system.verify_face(base64_image, resident_id)
            print(json.dumps(result))
        
        elif command == "find":
            # Buscar cara: python deepface_recognition.py find <base64_image>
            if len(sys.argv) != 3:
                print(json.dumps({"error": "Usage: find <base64_image>"}))
                return
            
            base64_image = sys.argv[2]
            
            result = face_system.find_face_in_database(base64_image)
            print(json.dumps(result))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
