from __future__ import annotations

import threading
from collections import defaultdict


class Metrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: dict[tuple[str, tuple[tuple[str, str], ...]], int] = defaultdict(int)
        self._timers_ms_sum: dict[tuple[str, tuple[tuple[str, str], ...]], float] = defaultdict(float)
        self._timers_ms_count: dict[tuple[str, tuple[tuple[str, str], ...]], int] = defaultdict(int)

    def inc(self, name: str, *, labels: dict[str, str]) -> None:
        key = (name, tuple(sorted(labels.items())))
        with self._lock:
            self._counters[key] += 1

    def observe_ms(self, name: str, *, value_ms: float, labels: dict[str, str]) -> None:
        key = (name, tuple(sorted(labels.items())))
        with self._lock:
            self._timers_ms_sum[key] += float(value_ms)
            self._timers_ms_count[key] += 1

    def render_prometheus(self) -> str:
        lines: list[str] = []
        with self._lock:
            for (name, labels), value in sorted(self._counters.items()):
                lines.append(f"{name}{_fmt_labels(labels)} {value}")
            for (name, labels), value in sorted(self._timers_ms_sum.items()):
                lines.append(f"{name}_sum{_fmt_labels(labels)} {value}")
            for (name, labels), value in sorted(self._timers_ms_count.items()):
                lines.append(f"{name}_count{_fmt_labels(labels)} {value}")
        return "\n".join(lines) + "\n"


def _fmt_labels(labels: tuple[tuple[str, str], ...]) -> str:
    if not labels:
        return ""
    parts = []
    for k, v in labels:
        parts.append(f'{k}="{_escape_label(v)}"')
    return "{" + ",".join(parts) + "}"


def _escape_label(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


metrics = Metrics()
