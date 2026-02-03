import datetime as dt
import os
import time
import uuid

import httpx
import pytest


BASE_URL = "http://localhost:8000"


def _wait_api_ready(client: httpx.Client, timeout_s: float = 15.0) -> None:
    if os.environ.get("CNTS_RUN_E2E") != "1":
        pytest.skip("E2E désactivés (définir CNTS_RUN_E2E=1 pour activer)")
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            r = client.get("/health", timeout=2)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("API not ready")


def _cursor_at_end(client: httpx.Client) -> str | None:
    cursor = None
    while True:
        r = client.get("/sync/events", params={"cursor": cursor, "limit": 1000})
        r.raise_for_status()
        payload = r.json()
        next_cursor = payload.get("next_cursor")
        events = payload.get("events") or []
        if not events:
            return cursor
        cursor = next_cursor
        if len(events) < 1000:
            return cursor


def test_sync_push_pull_idempotent() -> None:
    with httpx.Client(base_url=BASE_URL) as client:
        _wait_api_ready(client)
        cursor0 = _cursor_at_end(client)

        device_id = f"device-{uuid.uuid4().hex[:8]}"
        cni = f"CNI-{uuid.uuid4().hex[:10]}"
        client_donneur_event_id = f"ev-{uuid.uuid4().hex}"
        client_don_event_id = f"ev-{uuid.uuid4().hex}"

        push = client.post(
            "/sync/events",
            json={
                "device_id": device_id,
                "events": [
                    {
                        "client_event_id": client_donneur_event_id,
                        "type": "donneur.upsert",
                        "payload": {"cni": cni, "nom": "Diop", "prenom": "Amadou", "sexe": "H"},
                    },
                    {
                        "client_event_id": client_don_event_id,
                        "type": "don.create",
                        "payload": {
                            "donneur_cni": cni,
                            "date_don": dt.date.today().isoformat(),
                            "type_don": "SANG_TOTAL",
                        },
                    },
                ],
            },
        )
        push.raise_for_status()
        out = push.json()
        assert out["device_id"] == device_id
        assert [r["status"] for r in out["results"]] == ["ACCEPTE", "ACCEPTE"]
        din = out["results"][1]["response"]["din"]

        push2 = client.post(
            "/sync/events",
            json={
                "device_id": device_id,
                "events": [
                    {
                        "client_event_id": client_donneur_event_id,
                        "type": "donneur.upsert",
                        "payload": {"cni": cni, "nom": "Diop", "prenom": "Amadou", "sexe": "H"},
                    },
                    {
                        "client_event_id": client_don_event_id,
                        "type": "don.create",
                        "payload": {
                            "donneur_cni": cni,
                            "date_don": dt.date.today().isoformat(),
                            "type_don": "SANG_TOTAL",
                        },
                    },
                ],
            },
        )
        push2.raise_for_status()
        out2 = push2.json()
        assert [r["status"] for r in out2["results"]] == ["DUPLICATE", "DUPLICATE"]

        pull = client.get("/sync/events", params={"cursor": cursor0, "limit": 200})
        pull.raise_for_status()
        pulled = pull.json()["events"]
        assert any(e["event_type"] == "don.created" and e["payload"].get("din") == din for e in pulled)
