"""
Pytest fixtures for API testing.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Mock settings before importing app
@pytest.fixture(autouse=True)
def mock_settings():
    """Mock settings for all tests."""
    with patch("config.get_settings") as mock:
        mock.return_value = MagicMock(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_KEY="test-key",
            SUPABASE_JWT_SECRET="test-secret-at-least-32-characters-long",
            DEBUG=True
        )
        yield mock


@pytest.fixture(autouse=True)
def mock_supabase():
    """Mock Supabase client for all tests."""
    # Clear the cache before each test
    from services.database import get_supabase_client
    get_supabase_client.cache_clear()
    
    # Create a mock client
    mock_client = MagicMock()
    
    # Patch in all the places where it's used
    with patch("services.database.get_supabase_client", return_value=mock_client):
        with patch("routes.clips.get_supabase_client", return_value=mock_client):
            with patch("routes.playback.get_supabase_client", return_value=mock_client):
                # Also patch create_client to prevent any real client creation
                with patch("supabase.create_client"):
                    yield mock_client


@pytest.fixture
def client(mock_settings, mock_supabase):
    """Test client with mocked dependencies."""
    from main import app
    return TestClient(app)


@pytest.fixture
def test_user():
    """Test user data."""
    return {
        "id": "test-user-123",
        "email": "test@example.com"
    }


@pytest.fixture
def valid_token(test_user):
    """Generate a valid JWT for testing."""
    import jwt
    return jwt.encode(
        {"sub": test_user["id"], "email": test_user["email"], "aud": "authenticated"},
        "test-secret-at-least-32-characters-long",
        algorithm="HS256"
    )


@pytest.fixture
def auth_headers(valid_token):
    """Authorization headers for authenticated requests."""
    return {"Authorization": f"Bearer {valid_token}"}


@pytest.fixture
def sample_clip():
    """Sample clip data from database."""
    return {
        "id": "clip-123",
        "user_id": "test-user-123",
        "input_type": "url",
        "input_content": "https://example.com/article",
        "context_instruction": None,
        "page_title": "Test Article",
        "target_duration": 5,
        "status": "pending",
        "audio_url": None,
        "actual_duration": None,
        "error_message": None,
        "is_favorited": False,
        "created_at": "2024-01-01T00:00:00Z",
        "completed_at": None
    }

