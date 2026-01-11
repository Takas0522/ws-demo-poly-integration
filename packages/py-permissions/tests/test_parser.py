"""
Tests for permission parser
"""

import pytest
from permissions.parser import (
    validate_permission_format,
    parse_permission,
    matches_wildcard,
    is_more_specific,
    normalize_permission,
    expand_wildcard,
)


class TestValidatePermissionFormat:
    """Tests for permission format validation."""
    
    def test_valid_two_segment_permission(self):
        """Test valid 2-segment permission."""
        result = validate_permission_format("users.create")
        assert result.valid is True
        assert result.error is None
    
    def test_valid_three_segment_permission(self):
        """Test valid 3-segment permission."""
        result = validate_permission_format("app.users.create")
        assert result.valid is True
    
    def test_valid_wildcard_permission(self):
        """Test valid wildcard permission."""
        result = validate_permission_format("users.*")
        assert result.valid is True
    
    def test_invalid_single_segment(self):
        """Test invalid single segment permission."""
        result = validate_permission_format("users")
        assert result.valid is False
        assert "at least 2 segments" in result.error
    
    def test_invalid_consecutive_dots(self):
        """Test invalid consecutive dots."""
        result = validate_permission_format("users..create")
        assert result.valid is False
        assert "consecutive dots" in result.error
    
    def test_invalid_wildcard_position(self):
        """Test invalid wildcard position."""
        result = validate_permission_format("users*.create")
        assert result.valid is False
    
    def test_invalid_wildcard_without_dot(self):
        """Test wildcard without dot prefix."""
        result = validate_permission_format("users*")
        assert result.valid is False
    
    def test_empty_permission(self):
        """Test empty permission string."""
        result = validate_permission_format("")
        assert result.valid is False
    
    def test_none_permission(self):
        """Test None permission."""
        result = validate_permission_format(None)
        assert result.valid is False


class TestParsePermission:
    """Tests for permission parsing."""
    
    def test_parse_two_segment_permission(self):
        """Test parsing 2-segment permission."""
        parsed = parse_permission("users.create")
        assert parsed.full == "users.create"
        assert parsed.module == "users"
        assert parsed.action == "create"
        assert parsed.app is None
        assert parsed.is_wildcard is False
    
    def test_parse_three_segment_permission(self):
        """Test parsing 3-segment permission."""
        parsed = parse_permission("app.users.create")
        assert parsed.full == "app.users.create"
        assert parsed.app == "app"
        assert parsed.module == "users"
        assert parsed.action == "create"
    
    def test_parse_wildcard_permission(self):
        """Test parsing wildcard permission."""
        parsed = parse_permission("users.*")
        assert parsed.is_wildcard is True
        assert parsed.wildcard_prefix == "users"
    
    def test_parse_complex_wildcard(self):
        """Test parsing complex wildcard."""
        parsed = parse_permission("app.users.*")
        assert parsed.is_wildcard is True
        assert parsed.wildcard_prefix == "app.users"
        assert parsed.app == "app"
        assert parsed.module == "users"
    
    def test_parse_invalid_permission_raises_error(self):
        """Test that invalid permission raises ValueError."""
        with pytest.raises(ValueError):
            parse_permission("invalid")


class TestMatchesWildcard:
    """Tests for wildcard matching."""
    
    def test_wildcard_matches_exact_prefix(self):
        """Test wildcard matches exact prefix."""
        assert matches_wildcard("users.create", "users.*") is True
        assert matches_wildcard("users.read", "users.*") is True
    
    def test_wildcard_matches_nested(self):
        """Test wildcard matches nested permissions."""
        assert matches_wildcard("app.users.create", "app.users.*") is True
    
    def test_wildcard_does_not_match_different_prefix(self):
        """Test wildcard doesn't match different prefix."""
        assert matches_wildcard("roles.create", "users.*") is False
    
    def test_wildcard_matches_app_level(self):
        """Test app-level wildcard."""
        assert matches_wildcard("app.users.create", "app.*") is True
        assert matches_wildcard("app.roles.delete", "app.*") is True
    
    def test_non_wildcard_returns_false(self):
        """Test non-wildcard pattern returns False."""
        assert matches_wildcard("users.create", "users.create") is False


class TestIsMoreSpecific:
    """Tests for permission specificity comparison."""
    
    def test_concrete_more_specific_than_wildcard(self):
        """Test concrete permission is more specific than wildcard."""
        assert is_more_specific("users.create", "users.*") is True
    
    def test_wildcard_less_specific_than_concrete(self):
        """Test wildcard is less specific than concrete."""
        assert is_more_specific("users.*", "users.create") is False
    
    def test_more_segments_more_specific(self):
        """Test more segments means more specific."""
        assert is_more_specific("app.users.create", "users.create") is True


class TestNormalizePermission:
    """Tests for permission normalization."""
    
    def test_normalize_lowercase(self):
        """Test normalization converts to lowercase."""
        assert normalize_permission("USERS.CREATE") == "users.create"
    
    def test_normalize_strips_whitespace(self):
        """Test normalization strips whitespace."""
        assert normalize_permission("  users.create  ") == "users.create"
    
    def test_normalize_mixed_case(self):
        """Test normalization handles mixed case."""
        assert normalize_permission("Users.Create") == "users.create"


class TestExpandWildcard:
    """Tests for wildcard expansion."""
    
    def test_expand_wildcard_permission(self):
        """Test expanding wildcard permission."""
        actions = ["create", "read", "update", "delete"]
        expanded = expand_wildcard("users.*", actions)
        assert len(expanded) == 4
        assert "users.create" in expanded
        assert "users.read" in expanded
        assert "users.update" in expanded
        assert "users.delete" in expanded
    
    def test_expand_concrete_permission_returns_itself(self):
        """Test expanding concrete permission returns itself."""
        actions = ["create", "read", "update", "delete"]
        expanded = expand_wildcard("users.create", actions)
        assert expanded == ["users.create"]
    
    def test_expand_complex_wildcard(self):
        """Test expanding complex wildcard."""
        actions = ["create", "delete"]
        expanded = expand_wildcard("app.users.*", actions)
        assert "app.users.create" in expanded
        assert "app.users.delete" in expanded
