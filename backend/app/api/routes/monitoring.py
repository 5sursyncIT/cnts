import random
from typing import Any

from fastapi import APIRouter

from app.schemas import metrics as schemas

router = APIRouter()


@router.get("/dashboard", response_model=schemas.MonitoringDashboard)
async def get_monitoring_dashboard() -> Any:
    """
    Get monitoring dashboard data.
    """
    # Generate mock data
    metrics = [
        schemas.MetricPoint(
            time=f"{i}:00",
            requests=random.randint(100, 600),
            errors=random.randint(0, 20),
            latency=random.randint(20, 120)
        )
        for i in range(24)
    ]

    services = [
        schemas.ServiceStatus(name='API Gateway', status='healthy', uptime='99.99%', version='v1.2.0'),
        schemas.ServiceStatus(name='Auth Service', status='healthy', uptime='99.95%', version='v1.1.5'),
        schemas.ServiceStatus(name='Stock Service', status='degraded', uptime='98.50%', version='v2.0.1'),
        schemas.ServiceStatus(name='Notification Service', status='healthy', uptime='99.99%', version='v1.0.2'),
    ]

    errors = [
        schemas.ErrorDistribution(name='500 Internal Error', count=45),
        schemas.ErrorDistribution(name='401 Unauthorized', count=120),
        schemas.ErrorDistribution(name='404 Not Found', count=80),
        schemas.ErrorDistribution(name='400 Bad Request', count=200),
        schemas.ErrorDistribution(name='503 Service Unavailable', count=15),
    ]

    return schemas.MonitoringDashboard(
        metrics=metrics,
        services=services,
        errors=errors,
        total_requests=1200000,
        avg_latency=45,
        error_rate=0.12
    )
