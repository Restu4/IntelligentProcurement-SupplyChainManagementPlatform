from flask import Flask, render_template, request
from rag import ask

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def home():

    print("STEP 1")

    answer = ""
    source = ""

    if request.method == "POST":

        print("STEP 2")

        question = request.form["question"]

        print("QUESTION:", question)

        result = ask(question)

        print("STEP 3")

        answer = result["answer"]
        source = result["source"]

    return render_template(
        "index.html",
        answer=answer,
        source=source
    )

if __name__ == "__main__":
    app.run(
        debug=False,
        use_reloader=False
    )