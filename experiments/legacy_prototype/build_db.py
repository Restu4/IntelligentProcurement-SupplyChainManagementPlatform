import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path

# Load model lokal
model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

client = chromadb.PersistentClient(
    path="vectordb"
)

collection = client.get_or_create_collection(
    name="smartprocure"
)

folder = Path("data")

extensions = ("*.txt", "*.md")

files = []
for ext in extensions:
    files.extend(folder.glob(ext))

if not files:
    print("Tidak ada file ditemukan di folder data/")
else:
    for file in sorted(files):
        text = file.read_text(
            encoding="utf-8"
        )

        if not text.strip():
            print(f"{file.name} kosong, dilewati")
            continue

        embedding = model.encode(
            text
        ).tolist()

        collection.add(
            documents=[text],
            embeddings=[embedding],
            ids=[file.stem]
        )

        print(
            f"{file.name} berhasil ditambahkan"
        )

print("Database selesai dibuat")
print(f"Total dokumen di collection: {collection.count()}")
