import logging

from app.core.request_context import request_id_var


def configure_logging(level: str) -> None:
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id_var.get() or "-"
        return record

    logging.setLogRecordFactory(record_factory)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s request_id=%(request_id)s %(message)s",
    )
