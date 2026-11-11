import app.api.documents as documents_module


class FakeEmbedder:
    def embed_batch(self, texts):
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeCollection:
    def __init__(self):
        self.added = []
        self.deleted = []

    def add(self, **kwargs):
        self.added.append(kwargs)

    def delete(self, where=None):
        self.deleted.append(where)


def patch_document_dependencies(monkeypatch, tmp_path):
    collection = FakeCollection()
    monkeypatch.setattr(documents_module, "embedder", FakeEmbedder())
    monkeypatch.setattr(documents_module, "get_collection", lambda: collection)
    monkeypatch.setattr(documents_module.settings, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(documents_module.settings, "MAX_CHUNKS_PER_DOCUMENT", 500)
    return collection


async def test_admin_can_upload_txt_and_delete_it(
    client, admin_headers, monkeypatch, tmp_path
):
    collection = patch_document_dependencies(monkeypatch, tmp_path)

    response = await client.post(
        "/api/upload",
        files={"file": ("policy.txt", b"Payment terms are Net 45 days. " * 40, "text/plain")},
        data={"description": "Payment policy"},
        headers=admin_headers,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["chunk_count"] >= 1
    assert body["original_filename"] == "policy.txt"
    assert collection.added and collection.added[0]["ids"]

    stored_files = list(tmp_path.iterdir())
    assert len(stored_files) == 1

    listing = await client.get("/api/documents", headers=admin_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    detail = await client.get(
        f"/api/documents/{body['id']}", headers=admin_headers
    )
    assert detail.status_code == 200

    deleted = await client.delete(
        f"/api/documents/{body['id']}", headers=admin_headers
    )
    assert deleted.status_code == 204
    assert collection.deleted == [{"document_id": str(body["id"])}]
    assert list(tmp_path.iterdir()) == []

    empty = await client.get("/api/documents", headers=admin_headers)
    assert empty.json() == []


async def test_upload_rejects_unsupported_extension(
    client, admin_headers, monkeypatch, tmp_path
):
    patch_document_dependencies(monkeypatch, tmp_path)
    response = await client.post(
        "/api/upload",
        files={"file": ("payload.exe", b"MZ...", "application/octet-stream")},
        headers=admin_headers,
    )
    assert response.status_code == 400


async def test_upload_rejects_empty_text(
    client, admin_headers, monkeypatch, tmp_path
):
    patch_document_dependencies(monkeypatch, tmp_path)
    response = await client.post(
        "/api/upload",
        files={"file": ("blank.txt", b"   \n  ", "text/plain")},
        headers=admin_headers,
    )
    assert response.status_code == 400
    # The temporary file must not be left behind.
    assert list(tmp_path.iterdir()) == []


async def test_viewer_cannot_upload(client, viewer_headers, monkeypatch, tmp_path):
    patch_document_dependencies(monkeypatch, tmp_path)
    response = await client.post(
        "/api/upload",
        files={"file": ("policy.txt", b"hello", "text/plain")},
        headers=viewer_headers,
    )
    assert response.status_code == 403
