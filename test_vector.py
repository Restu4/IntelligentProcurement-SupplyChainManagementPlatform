from sklearn.feature_extraction.text import TfidfVectorizer

documents = [
    "supplier dikenakan penalti 10%",
    "payment term net 30 days"
]

vectorizer = TfidfVectorizer()

doc_vectors = vectorizer.fit_transform(documents)

print("VECTOR OK")