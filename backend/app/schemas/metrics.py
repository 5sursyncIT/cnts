from pydantic import BaseModel

class MetricPoint(BaseModel):
    time: str
    requests: int
    errors: int
    latency: int

class ServiceStatus(BaseModel):
    name: str
    status: str
    uptime: str
    version: str

class ErrorDistribution(BaseModel):
    name: str
    count: int

class MonitoringDashboard(BaseModel):
    metrics: list[MetricPoint]
    services: list[ServiceStatus]
    errors: list[ErrorDistribution]
    total_requests: int
    avg_latency: int
    error_rate: float
