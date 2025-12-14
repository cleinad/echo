"""
Smoke tests - verify API starts and basic connectivity.
"""


def test_root_endpoint(client):
    """API should respond to root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_check(client):
    """Health check should return configuration status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supabase_configured" in data


def test_openapi_docs_available(client):
    """OpenAPI docs should be accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "paths" in response.json()


def test_unauthenticated_request_rejected(client):
    """Protected endpoints should reject unauthenticated requests."""
    response = client.get("/api/v1/clips")
    assert response.status_code in [401, 403]


