"""Genera src/data/mapa-topicos-eu.json a partir del subcorpus en español
del proyecto de NLP (Parlamento Europeo 2021).

Uso (corre una sola vez, con el venv de Datos):
  C:/Users/Daniel/Python/Datos/.venv/Scripts/python.exe scripts/lda_mapa_topicos.py
"""

import json
import re
import unicodedata
from pathlib import Path

import pandas as pd
from sklearn.decomposition import PCA, LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

DATA_DIR = Path("C:/Users/Daniel/Python/Procesamiento_lenguaje_EU")
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "mapa-topicos-eu.json"


EXTRA_STOPWORDS = {
    "senor",
    "senora",
    "presidente",
    "presidenta",
    "mas",
    "europea",
    "union",
    "tambien",
    "digit",
}

SNIPPET_LARGO = 150


def quitar_tildes(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def preprocesar(texto: str) -> str:
    texto = quitar_tildes(texto.lower())
    return re.sub(r"\d+", "digit", texto)


def main() -> None:
    df = pd.read_csv(DATA_DIR / "df_esp.csv", encoding="utf-8")
    stopwords = set(pd.read_csv(DATA_DIR / "stop_words_complete.csv")["word"]) | EXTRA_STOPWORDS

    textos = df["TEXT"].fillna("").map(preprocesar)

    vectorizer = CountVectorizer(token_pattern=r"[a-z]+", stop_words=list(stopwords))
    dtm = vectorizer.fit_transform(textos)

    lda = LatentDirichletAllocation(n_components=12, random_state=42)
    distribucion_topicos = lda.fit_transform(dtm)

    coords = PCA(n_components=2, random_state=42).fit_transform(distribucion_topicos)
    dominante = distribucion_topicos.argmax(axis=1)

    # Generar labels automáticos a partir de los top 3 términos de cada tópico
    feature_names = vectorizer.get_feature_names_out()
    topic_labels = []
    for topic_id in range(12):
        top_indices = lda.components_[topic_id].argsort()[-3:][::-1]
        top_terms = [feature_names[idx].capitalize() for idx in top_indices]
        label = " / ".join(top_terms)
        topic_labels.append(label)

    registros = []
    for i, fila in df.reset_index(drop=True).iterrows():
        texto = str(fila["TEXT"]) if pd.notna(fila["TEXT"]) else ""
        snippet = texto[:SNIPPET_LARGO].strip()
        if len(texto) > SNIPPET_LARGO:
            snippet += "..."

        registros.append(
            {
                "x": round(float(coords[i, 0]), 4),
                "y": round(float(coords[i, 1]), 4),
                "topic": int(dominante[i]),
                "label": topic_labels[int(dominante[i])],
                "country": fila["country"] if pd.notna(fila["country"]) else "Sin dato",
                "gender": fila["gender"] if pd.notna(fila["gender"]) else "Sin dato",
                "party": fila["party_final"] if pd.notna(fila["party_final"]) else "Sin dato",
                "date": fila["DATE"] if pd.notna(fila["DATE"]) else "Sin dato",
                "snippet": snippet,
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(registros, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Escritos {len(registros)} discursos en {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
