"""Client SMS (Brevo) : normalisation des numéros et requête envoyée."""

import io
import json
import urllib.error

import pytest

from app.core import sms
from app.core.config import settings


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("77 123 45 67", "221771234567"),
        ("+221 77 123 45 67", "221771234567"),
        ("00221771234567", "221771234567"),
        ("338211234", "221338211234"),
        ("+33 6 12 34 56 78", "33612345678"),
        ("12345", None),
        ("", None),
        (None, None),
    ],
)
def test_normalize_phone(raw, expected):
    assert sms.normalize_phone(raw) == expected


def test_mask_phone_hides_the_middle():
    assert sms.mask_phone("221771234567") == "+221 •• ••• •• 67"


class _FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def test_send_sms_posts_to_brevo(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured.update(url=request.full_url, headers=dict(request.header_items()), body=json.loads(request.data))
        return _FakeResponse(b'{"messageId": 1}')

    monkeypatch.setattr(settings, "sms_api_key", "cle-test")
    monkeypatch.setattr(settings, "sms_api_url", "")
    monkeypatch.setattr(sms.urllib.request, "urlopen", fake_urlopen)
    sms.send_sms("221771234567", "Code 123456", tag="activation")

    assert captured["url"] == sms.BREVO_SMS_URL
    assert captured["headers"]["Api-key"] == "cle-test"
    assert captured["body"] == {
        "sender": settings.sms_sender,
        "recipient": "221771234567",
        "content": "Code 123456",
        "type": "transactional",
        "tag": "activation",
    }


def test_send_sms_http_error_raises(monkeypatch):
    def fake_urlopen(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 401, "Unauthorized", {}, io.BytesIO(b'{"code":"unauthorized"}'))

    monkeypatch.setattr(settings, "sms_api_key", "mauvaise-cle")
    monkeypatch.setattr(sms.urllib.request, "urlopen", fake_urlopen)
    with pytest.raises(sms.SmsError):
        sms.send_sms("221771234567", "x", tag="t")


def test_send_sms_without_key_outside_dev_raises(monkeypatch):
    monkeypatch.setattr(settings, "sms_api_key", "")
    monkeypatch.setattr(settings, "env", "production")
    with pytest.raises(sms.SmsError):
        sms.send_sms("221771234567", "x", tag="t")
