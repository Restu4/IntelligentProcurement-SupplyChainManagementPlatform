import os

documents = []
sources = []

folder = "data"

for file in os.listdir(folder):

    if file.endswith(".txt"):

        path = os.path.join(folder, file)

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            documents.append(
                f.read()
            )

            sources.append(
                file
            )


def ask(question):

    q = question.lower()

    # Intent Mapping

    if "supplier terbaik" in q:
        return {
            "answer": documents[2],
            "source": sources[2]
        }

    if "approval" in q:
        return {
            "answer": documents[1],
            "source": sources[1]
        }

    if "sla" in q:
        return {
            "answer": documents[0],
            "source": sources[0]
        }

    if "penalti" in q:
        return {
            "answer": documents[1],
            "source": sources[1]
        }

    if "procurement" in q:
        return {
            "answer": documents[1],
            "source": sources[1]
        }

    return {
        "answer":
        "Maaf, informasi tidak ditemukan dalam knowledge base SmartProcure AI.",
        "source": "-"
    }