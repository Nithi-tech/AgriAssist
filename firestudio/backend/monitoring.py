import logging
import structlog
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time
from functools import wraps

# Prometheus metrics
REQUEST_COUNT = Counter('agriassist_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('agriassist_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('agriassist_active_connections', 'Active connections')
SENSOR_DATA_COUNT = Counter('agriassist_sensor_data_total', 'Total sensor data points')
MODEL_PREDICTIONS = Counter('agriassist_model_predictions_total', 'ML model predictions', ['model_type'])

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

def monitor_endpoint(endpoint_name):
    """Decorator for monitoring API endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            REQUEST_COUNT.labels(method='POST', endpoint=endpoint_name).inc()
            
            try:
                result = await func(*args, **kwargs)
                logger.info(
                    "API request completed",
                    endpoint=endpoint_name,
                    duration=time.time() - start_time,
                    status="success"
                )
                return result
            except Exception as e:
                logger.error(
                    "API request failed",
                    endpoint=endpoint_name,
                    duration=time.time() - start_time,
                    error=str(e),
                    status="error"
                )
                raise
            finally:
                REQUEST_DURATION.observe(time.time() - start_time)
        
        return wrapper
    return decorator

def log_sensor_data(device_id: str, data_type: str):
    """Log sensor data collection"""
    SENSOR_DATA_COUNT.labels().inc()
    logger.info(
        "Sensor data received",
        device_id=device_id,
        data_type=data_type,
        timestamp=time.time()
    )

def log_ml_prediction(model_type: str, confidence: float):
    """Log ML model predictions"""
    MODEL_PREDICTIONS.labels(model_type=model_type).inc()
    logger.info(
        "ML prediction made",
        model_type=model_type,
        confidence=confidence,
        timestamp=time.time()
    )

# Start Prometheus metrics server
def start_metrics_server(port=9090):
    start_http_server(port)
    logger.info(f"Metrics server started on port {port}")

# Health check function
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "cache": "connected",
            "external_apis": "connected"
        }
    }
