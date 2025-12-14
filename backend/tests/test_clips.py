"""
Unit tests for clips endpoints.
"""
from unittest.mock import MagicMock


class TestCreateClip:
    """Tests for POST /api/v1/clips"""
    
    def test_create_clip_success(self, client, auth_headers, mock_supabase, sample_clip):
        """Should create clip with valid input."""
        # Mock DB insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[sample_clip]
        )
        
        response = client.post(
            "/api/v1/clips",
            headers=auth_headers,
            json={
                "input_type": "url",
                "input_content": "https://example.com/article",
                "target_duration": 5
            }
        )
        
        assert response.status_code == 201
        assert response.json()["status"] == "pending"
    
    def test_create_clip_invalid_duration(self, client, auth_headers):
        """Should reject invalid duration values."""
        response = client.post(
            "/api/v1/clips",
            headers=auth_headers,
            json={
                "input_type": "url",
                "input_content": "https://example.com",
                "target_duration": 7  # Invalid
            }
        )
        
        assert response.status_code == 422
    
    def test_create_clip_requires_auth(self, client):
        """Should require authentication."""
        response = client.post(
            "/api/v1/clips",
            json={
                "input_type": "url",
                "input_content": "https://example.com",
                "target_duration": 5
            }
        )
        
        assert response.status_code in [401, 403]


class TestListClips:
    """Tests for GET /api/v1/clips"""
    
    def test_list_clips_empty(self, client, auth_headers, mock_supabase):
        """Should return empty list when no clips."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .order.return_value.range.return_value.execute.return_value = MagicMock(
                data=[], count=0
            )
        
        response = client.get("/api/v1/clips", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["clips"] == []
        assert response.json()["total"] == 0
    
    def test_list_clips_with_data(self, client, auth_headers, mock_supabase, sample_clip):
        """Should return user's clips."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .order.return_value.range.return_value.execute.return_value = MagicMock(
                data=[sample_clip], count=1
            )
        
        response = client.get("/api/v1/clips", headers=auth_headers)
        
        assert response.status_code == 200
        assert len(response.json()["clips"]) == 1


class TestGetClip:
    """Tests for GET /api/v1/clips/{clip_id}"""
    
    def test_get_clip_success(self, client, auth_headers, mock_supabase, sample_clip):
        """Should return clip details."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data=sample_clip
            )
        
        response = client.get("/api/v1/clips/clip-123", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["id"] == "clip-123"
    
    def test_get_clip_not_found(self, client, auth_headers, mock_supabase):
        """Should return 404 for non-existent clip."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data=None
            )
        
        response = client.get("/api/v1/clips/nonexistent", headers=auth_headers)
        
        assert response.status_code == 404


class TestToggleFavorite:
    """Tests for PATCH /api/v1/clips/{clip_id}/favorite"""
    
    def test_toggle_favorite_on(self, client, auth_headers, mock_supabase, sample_clip):
        """Should toggle favorite from false to true."""
        # First call returns current state
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"is_favorited": False}
            )
        # Second call updates
        favorited_clip = {**sample_clip, "is_favorited": True}
        mock_supabase.table.return_value.update.return_value.eq.return_value\
            .eq.return_value.execute.return_value = MagicMock(
                data=[favorited_clip]
            )
        
        response = client.patch("/api/v1/clips/clip-123/favorite", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["is_favorited"] is True


class TestDeleteClip:
    """Tests for DELETE /api/v1/clips/{clip_id}"""
    
    def test_delete_clip_success(self, client, auth_headers, mock_supabase):
        """Should delete clip successfully."""
        mock_supabase.table.return_value.select.return_value.eq.return_value\
            .eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"audio_url": None}
            )
        mock_supabase.table.return_value.delete.return_value.eq.return_value\
            .eq.return_value.execute.return_value = MagicMock()
        
        response = client.delete("/api/v1/clips/clip-123", headers=auth_headers)
        
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()


