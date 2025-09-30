# -*- coding: utf-8 -*-
import json
import re
import numpy as np
import unicodedata
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout, BatchNormalization, Bidirectional
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, LearningRateScheduler
from tensorflow.keras.regularizers import l2
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import KFold
import time
import sys
import pickle
from collections import OrderedDict
import spacy
import os
import math

# Cargar modelo spaCy
nlp = spacy.load("es_core_news_sm")
memory = OrderedDict()

# Configuracion
VOCAB_SIZE = 700    # Aumentar el tamaño del vocabulario
EMBEDDING_DIM = 256    # Incrementar la dimensión de los embeddings
MAX_LEN = 600    # Aumentar la longitud máxima de las secuencias
NUM_NEURONS = 150    # Incrementar el número de neuronas en la capa LSTM
EPOCHS = 28    # Reducir el número de épocas para evitar sobreajuste
BATCH_SIZE = 40    # Incrementar el tamaño del batch
INITIAL_LR = 1e-3    # Ajustar la tasa de aprendizaje inicial
DROPOUT_RATE = 0.4    # Reducir la tasa de dropout
L2_RATE = 1e-5    # Reducir la regularización L2
VALIDATION_SPLIT = 0.25    # Aumentar el porcentaje de datos para validación
KFOLDS = 10    # Incrementar el número de particiones para validación cruzada

# Funciones auxiliares
def warmup_scheduler(epoch, lr):
    if epoch < 5:
        return lr + (INITIAL_LR - 1e-5) / 5
    return lr

def normalize_text(text):
    # Aumentar el límite de tokens que procesa spaCy
    nlp.max_length = 1000000
    doc = nlp(text.lower())
    # Mantener más tokens para preservar el significado
    tokens = [t.lemma_ for t in doc if t.is_alpha or t.is_digit]
    return ' '.join(tokens)

def augment_texts(texts, completions, metadata_list):
    augmented_texts = []
    augmented_completions = []
    augmented_metadata = []
        
    for i, t in enumerate(texts):
        words = t.split()
        if len(words) > 2:
            idx = np.random.randint(len(words))
            words[idx] = words[idx][::-1]
        augmented_texts.append(' '.join(words))
        augmented_completions.append(completions[i])
        augmented_metadata.append(metadata_list[i])
        
    return texts + augmented_texts, completions + augmented_completions, metadata_list + augmented_metadata

# Cargar datos
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)['conversations']

expanded_prompts = []
expanded_completions = []
expanded_metadata = []

# Procesar todo el dataset incluyendo metadata completa
for conv in data:
    completion = conv['completion'].strip()
        
    # Crear metadata completa para cada conversación
    metadata = OrderedDict([
        ('prompt', conv.get('prompt', '')),
        ('completion', completion),
        ('intent', conv.get('intent', '')),
        #('pattern', conv.get('pattern', [])),
        ('task', conv.get('task', '')),
        ('meaning', conv.get('meaning', '')),
        ('examples', conv.get('examples', []))
    ])
        
    # Agregar prompt principal
    expanded_prompts.append(conv['prompt'])
    expanded_completions.append(completion)
    expanded_metadata.append(metadata.copy())
        
    # Agregar todos los patterns
    for pattern in conv['pattern']:
        expanded_prompts.append(pattern)
        expanded_completions.append(completion)
        expanded_metadata.append(metadata.copy())

# Normalizar textos
prompts = [normalize_text(p) for p in expanded_prompts]

# Aplicar augmentación de datos
prompts_aug, completions_aug, metadata_aug = augment_texts(prompts, expanded_completions, expanded_metadata)
print(f"Dataset expandido: {len(prompts_aug)} ejemplos de entrenamiento")
print(f"Intents únicos: {set([m['intent'] for m in metadata_aug])}")

# Tokenización
tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token='<OOV>')
tokenizer.fit_on_texts(prompts_aug)
oov_index = tokenizer.word_index[tokenizer.oov_token]
seqs = tokenizer.texts_to_sequences(prompts_aug)
padded_inputs = pad_sequences(seqs, maxlen=MAX_LEN, padding='post')

# Preparar salidas
distinct_responses = sorted(set(completions_aug))
resp2idx = {r: i for i, r in enumerate(distinct_responses)}
y_indices = np.array([resp2idx[c] for c in completions_aug])
y_onehot = to_categorical(y_indices, num_classes=len(distinct_responses))
print(f"Respuestas únicas: {len(distinct_responses)}")

# Guardar tokenizer, mapeo de respuestas y metadata
# Exportación: Guarda el objeto Tokenizer para su uso posterior en inferencia
with open('tokenizer.pkl', 'wb') as f:
    pickle.dump(tokenizer, f)
# Exportación: Guarda el mapeo de respuestas a índices para la inferencia
with open('response_map.json', 'w', encoding='utf-8') as f:
    json.dump(resp2idx, f, ensure_ascii=False, indent=2)
# Exportación: Guarda la metadata aumentada y los datos originales
with open('metadata.pkl', 'wb') as f:
    pickle.dump({
        'metadata': metadata_aug,
        'distinct_responses': distinct_responses,
        'original_data': data
    }, f)
print("Archivos de configuración guardados")

# Modelo
def build_model():
    model = Sequential([
        Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_LEN, mask_zero=True),
        Bidirectional(LSTM(NUM_NEURONS, return_sequences=True, kernel_regularizer=l2(L2_RATE))),
        Dropout(DROPOUT_RATE),
        BatchNormalization(),
        Bidirectional(LSTM(NUM_NEURONS, kernel_regularizer=l2(L2_RATE))),
        Dropout(DROPOUT_RATE),
        Dense(128, activation='relu', kernel_regularizer=l2(L2_RATE)),  # Capa adicional densa
        Dense(len(distinct_responses), activation='softmax', kernel_regularizer=l2(L2_RATE))
    ])
        
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=INITIAL_LR),
        loss='categorical_crossentropy',     
        metrics=['accuracy']
    )
    return model

callbacks = [
    # Exportación: Guarda el mejor modelo durante el entrenamiento
    ModelCheckpoint('best_model.keras', save_best_only=True, monitor='val_loss', verbose=1),
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.3, patience=3, min_lr=1e-6, verbose=1),
    LearningRateScheduler(warmup_scheduler)
]

# Entrenamiento final
print("Iniciando entrenamiento...")
final_model = build_model()
history = final_model.fit(
    padded_inputs, y_onehot,     
    validation_split=VALIDATION_SPLIT,
    epochs=EPOCHS,     
    batch_size=BATCH_SIZE,     
    callbacks=callbacks,     
    verbose=2)

# Exportación: Guarda el modelo final después del entrenamiento
final_model.save('chatbot_model_final.keras')
print("Modelo entrenado y guardado")

# -------------------- INTERACCION --------------------
# Funciones matemáticas
def evaluate_math_expression(expr):
    try:
        expr = expr.replace('×', '*').replace('x', '*').replace('÷', '/').replace('^', '**')
        expr = re.sub(r"[^0-9+\-*/.()^ ]", "", expr)
        if expr:
            result = eval(expr, {'__builtins__': None}, {'math': math})
            return float(result) if isinstance(result, (int, float)) else result
    except:
        return None

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

# Cargar recursos entrenados
print("Cargando modelo entrenado...")
with open('tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)
with open('response_map.json', 'r', encoding='utf-8') as f:
    resp2idx = json.load(f)
    distinct_responses = [None] * len(resp2idx)
    for r, i in resp2idx.items():
        distinct_responses[int(i)] = r
with open('metadata.pkl', 'rb') as f:
    saved_data = pickle.load(f)
    metadata_aug = saved_data['metadata']
    original_data = saved_data['original_data']

# Cargar modelo entrenado
final_model = tf.keras.models.load_model('best_model.keras')

def generate_response(user_text):
    # Verificar si es una expresión matemática
    if contains_math_expression(user_text):
        expr = re.search(r'(?:cuanto es|calcula|resultado de)\s*(.*?)\??$', user_text.lower())
        math_expr = expr.group(1) if expr else user_text
        result = evaluate_math_expression(math_expr)
        if result is not None:
            if isinstance(result, float):
                result = int(result) if result.is_integer() else round(result, 4)
            return f"El resultado de {math_expr} es {result}"
        return "No pude calcular esa expresión matemática. ¿Podrías formularla de otra manera?"
        
    # Procesar con el modelo de NLP
    user_seq = tokenizer.texts_to_sequences([normalize_text(user_text)])[0]
    if not user_seq:
        return "Lo siento, no te entendí."
        
    # Verificar ratio de palabras desconocidas
    oov_ratio = sum(1 for i in user_seq if i == oov_index) / len(user_seq)
    if oov_ratio > 0.4:
        return "Como asistente virtual, solo puedo ayudarte con informacion relacionada a saferide y transporte seguro. ¿Puedes formular tu pregunta de otra manera?"
        
    # Hacer predicción
    pad = pad_sequences([user_seq], maxlen=MAX_LEN, padding='post')
    pred = final_model.predict(pad, verbose=0)[0]
    top_index = np.argmax(pred)
    top_response = distinct_responses[top_index]
        
    # Buscar en los datos originales para incluir ejemplos y patterns (frases similares)
    for conv in original_data:
        if conv.get('completion', '').strip() == top_response.strip():
            response_text = top_response

            # Incluir primer ejemplo si existe (para cualquier intent)
            # if conv.get('examples'):
            #     example = conv['examples'][0]
            #     response_text = f"{response_text}\n\nEjemplo:\n{example}"

            # Incluir patterns / frases similares si existen
            # patterns = conv.get('pattern', []) or conv.get('patterns', [])
            # if patterns:
            #     # mostrar hasta 5 patrones para no saturar la respuesta
            #     show = patterns[:5]
            #     patterns_text = '\n'.join(f"- {p}" for p in show)
            #     response_text = f"{response_text}\n\nFrases similares:\n{patterns_text}"

            return response_text

    return top_response

def simulate_typing(text, delay=0.03):
    for c in text:
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(delay)
    print()

# 💬 Interacción por consola
if __name__ == "__main__":
    print("🤖 Chatbot entrenado con dataset completo")
    print("Escribí algo (o 'salir' para terminar):")
        
    while True:
        user_input = input("\n👤 Vos: ")
        if user_input.lower() in ['salir', 'exit', 'quit']:
            print("🤖 Pura vida, hasta luego.")
            break
                
        response = generate_response(user_input)
        print("🤖 Bot: ", end="")
        simulate_typing(response)
