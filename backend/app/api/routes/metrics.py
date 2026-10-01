from fastapi import APIRouter, Depends, Response

from app.api.deps import require_admin
from app.core.metrics import metrics

router = APIRouter()


@router.get("/metrics", dependencies=[Depends(require_admin)])
def get_metrics() -> Response:
    return Response(content=metrics.render_prometheus(), media_type="text/plain; version=0.0.4")
