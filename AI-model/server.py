# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import json
import re
import spacy
import math
from collections import OrderedDict

# -------------------- CONFIG --------------------
# Asegúrate de que MAX_LEN coincida con el valor usado en el entrenamiento (500 en tu caso)
MAX_LEN = 500
VOCAB_SIZE = 10000 # Este valor no se usa directamente en el servidor, pero se mantiene por consistencia
OOV_TOKEN = "<OOV>"

# -------------------- CARGAR RECURSOS --------------------
try:
    with open("tokenizer.pkl", "rb") as f:
        tokenizer = pickle.load(f)
    with open("response_map.json", "r", encoding="utf-8") as f:
        resp2idx = json.load(f)
        distinct_responses = [None] * len(resp2idx)
        for r, i in resp2idx.items():
            distinct_responses[int(i)] = r
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)["conversations"]
    model = tf.keras.models.load_model("best_model.keras")
    nlp = spacy.load("es_core_news_sm")
    oov_index = tokenizer.word_index.get(OOV_TOKEN, 1)
    print("Recursos cargados exitosamente.")
except Exception as e:
    print(f"Error al cargar recursos: {e}")
    # Considera salir o manejar el error de forma más robusta en un entorno de producción
    exit()

memory = OrderedDict()

# -------------------- FUNCIONES --------------------
def normalize_text(text):
    # Aumentar el límite de tokens que procesa spaCy si es necesario, como en el entrenamiento
    nlp.max_length = 1000000 
    doc = nlp(text.lower())
    # Mantener más tokens para preservar el significado, como en el entrenamiento
    tokens = [t.lemma_ for t in doc if t.is_alpha or t.is_digit]
    return ' '.join(tokens)

def contains_math_expression(text):
    patterns = [
        r'\d+\s*[\+\-\*/x×÷]\s*\d+',
        r'cuanto es (.*)\?',
        r'calcula (.*)',
        r'resultado de (.*)',
        r'\d+\s*\^\s*\d+',
        r'raiz cuadrada de \d+',
        r'\d+\s*!'
    ]
    return any(re.search(p, text.lower()) for p in patterns)

def evaluate_math_expression(expr):
    try:
        expr = expr.replace("×", "*").replace("x", "*").replace("÷", "/").replace("^", "**")
        # Limpiar la expresión para permitir solo caracteres seguros para eval
        expr = re.sub(r"[^0-9+\-*/.()^ ]", "", expr)
        if not expr.strip(): # Si la expresión está vacía después de limpiar
            return None
        result = eval(expr, {"__builtins__": None}, {"math": math})
        return float(result) if isinstance(result, (int, float)) else result
    except Exception as e:
        print(f"Error al evaluar expresión matemática '{expr}': {e}")
        return None

def generate_response(user_text):
    # Verificar si es una expresión matemática
    if contains_math_expression(user_text):
        # Extraer la expresión matemática de la frase
        expr_match = re.search(r'(?:cuanto es|calcula|resultado de)\s*(.*?)\??$', user_text.lower())
        math_expr = expr_match.group(1) if expr_match else user_text
        
        result = evaluate_math_expression(math_expr)
        if result is not None:
            # Formatear el resultado (entero si es posible, sino redondeado)
            result = int(result) if isinstance(result, float) and result.is_integer() else round(result, 4)
            return f"El resultado de {math_expr} es {result}"
        return "No pude calcular esa expresión matemática. ¿Podrías formularla de otra manera?"
    
    # Procesar con el modelo de NLP
    normalized = normalize_text(user_text)
    seq = tokenizer.texts_to_sequences([normalized])[0]
    
    if not seq:
        return "Lo siento, no te entendí."
    
    # Verificar ratio de palabras desconocidas
    oov_ratio = sum(1 for i in seq if i == oov_index) / len(seq)
    if oov_ratio > 0.4:
        return "No entendí bien. ¿Podrías decirlo de otra forma?"
    
    # Hacer predicción
    padded = pad_sequences([seq], maxlen=MAX_LEN, padding='post')
    pred = model.predict(padded, verbose=0)[0]
    top_index = np.argmax(pred)
    top_response = distinct_responses[top_index]
    
    # Buscar en los datos originales para incluir ejemplos
    for conv in data:
        if conv['completion'] == top_response:
            # Incluir ejemplos para intents técnicos
            if conv.get("intent") in ["programacion", "ciberseguridad"] and conv.get('examples'):
                example = conv['examples'][0]
                return f"{top_response}\n\nEjemplo:\n{example}"
            break # Salir del bucle una vez que se encuentra la conversación
            
    return top_response

# -------------------- FLASK --------------------
app = Flask(__name__)
# Habilitar CORS para permitir solicitudes desde tu frontend
# Asegúrate de que la URL de origen sea la correcta para tu frontend
CORS(app, origins=["http://localhost:3000"])

@app.route("/chat", methods=["POST"])
def chat():
    data_json = request.get_json()
    user_input = data_json.get("message", "")
    
    if not user_input:
        return jsonify({"response": "Por favor, envía un mensaje."}), 400

    response = generate_response(user_input)
    return jsonify({"response": response})

if __name__ == "__main__":
    # Ejecutar la aplicación Flask
    # debug=True es útil para desarrollo, pero debe ser False en producción
    app.run(debug=True, port=4000)
