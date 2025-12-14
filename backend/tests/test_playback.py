"""
Unit tests for playback progress endpoints.
"""
from unittest.mock import MagicMock


class TestGetProgress:
    """Tests for GET /api/v1/clips/{clip_id}/progress"""
    
    def test_get_progress_exists(self, client, auth_headers, mock_supabase):
        """Should return existing progress."""
        # Clip exists
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"id": "clip-123"}
            )
        # Progress exists
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
                data={
                    "clip_id": "clip-123",
                    "position_seconds": 120,
                    "has_completed": False,
                    "last_played_at": "2024-01-01T00:00:00Z"
                }
            )
        
        response = client.get("/api/v1/clips/clip-123/progress", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["position_seconds"] == 120
    
    def test_get_progress_not_started(self, client, auth_headers, mock_supabase):
        """Should return defaults when no progress exists."""
        # Clip exists
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"id": "clip-123"}
            )
        # No progress yet
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
                data=None
            )
        
        response = client.get("/api/v1/clips/clip-123/progress", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["position_seconds"] == 0
        assert response.json()["has_completed"] is False
    
    def test_get_progress_clip_not_found(self, client, auth_headers, mock_supabase):
        """Should return 404 when clip doesn't exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data=None
            )
        
        response = client.get("/api/v1/clips/nonexistent/progress", headers=auth_headers)
        
        assert response.status_code == 404


class TestUpdateProgress:
    """Tests for PUT /api/v1/clips/{clip_id}/progress"""
    
    def test_update_progress_success(self, client, auth_headers, mock_supabase):
        """Should upsert progress successfully."""
        # Clip exists
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"id": "clip-123"}
            )
        # Upsert returns updated data
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock(
            data=[{
                "clip_id": "clip-123",
                "position_seconds": 180,
                "has_completed": False,
                "last_played_at": "2024-01-01T00:00:00Z"
            }]
        )
        
        response = client.put(
            "/api/v1/clips/clip-123/progress",
            headers=auth_headers,
            json={"position_seconds": 180, "has_completed": False}
        )
        
        assert response.status_code == 200
        assert response.json()["position_seconds"] == 180
    
    def test_update_progress_mark_completed(self, client, auth_headers, mock_supabase):
        """Should mark clip as completed."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"id": "clip-123"}
            )
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock(
            data=[{
                "clip_id": "clip-123",
                "position_seconds": 300,
                "has_completed": True,
                "last_played_at": "2024-01-01T00:00:00Z"
            }]
        )
        
        response = client.put(
            "/api/v1/clips/clip-123/progress",
            headers=auth_headers,
            json={"position_seconds": 300, "has_completed": True}
        )
        
        assert response.status_code == 200
        assert response.json()["has_completed"] is True
    
    def test_update_progress_invalid_position(self, client, auth_headers):
        """Should reject negative position."""
        response = client.put(
            "/api/v1/clips/clip-123/progress",
            headers=auth_headers,
            json={"position_seconds": -10, "has_completed": False}
        )
        
        assert response.status_code == 422


