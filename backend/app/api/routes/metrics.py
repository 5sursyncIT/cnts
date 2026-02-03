from fastapi import APIRouter, Response

from app.core.metrics import metrics

router = APIRouter()


@router.get("/metrics")
def get_metrics() -> Response:
    return Response(content=metrics.render_prometheus(), media_type="text/plain; version=0.0.4")
