"""Contrôles d'accès du contenu public et limites des fichiers publiés."""

from io import BytesIO

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.models import Article, FaqItem, Partner, TeamMember
from app.main import app


def test_draft_lists_require_staff(client: TestClient):
    for path in ("articles", "faq", "team", "partners"):
        assert client.get(f"/api/{path}?published_only=false").status_code == 403
    assert client.get("/api/articles?status=DRAFT").status_code == 403


def test_unpublished_details_are_not_public(client: TestClient, db_session: Session):
    article = Article(slug="internal-draft", title="Brouillon", content="Privé", category="Actualité", status="DRAFT")
    faq = FaqItem(question="Interne ?", answer="Réponse", is_published=False)
    member = TeamMember(name="Interne", role="Test", is_published=False)
    partner = Partner(name="Interne", is_published=False)
    db_session.add_all([article, faq, member, partner])
    db_session.commit()

    for path in (
        f"/api/articles/{article.slug}",
        f"/api/faq/{faq.id}",
        f"/api/team/{member.id}",
        f"/api/partners/{partner.id}",
    ):
        assert client.get(path).status_code == 404


def test_public_metrics_require_admin(client: TestClient):
    previous = app.dependency_overrides.pop(require_admin, None)
    try:
        assert client.get("/api/metrics").status_code == 401
    finally:
        if previous is not None:
            app.dependency_overrides[require_admin] = previous


def test_upload_rejects_active_content_and_oversized_images(client: TestClient, monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    script = client.post(
        "/api/upload", files={"file": ("test.html", b"<script>alert(1)</script>", "text/html")}
    )
    assert script.status_code == 415

    spoofed = client.post(
        "/api/upload", files={"file": ("test.png", b"<script>alert(1)</script>", "image/png")}
    )
    assert spoofed.status_code == 415

    oversized = client.post(
        "/api/upload",
        files={"file": ("test.png", BytesIO(b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024)), "image/png")},
    )
    assert oversized.status_code == 413
    assert list((tmp_path / "static" / "uploads").iterdir()) == []
