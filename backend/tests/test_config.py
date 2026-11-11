import pytest

from app.config.settings import Settings


def make_settings(**overrides) -> Settings:
    return Settings(_env_file=None, **overrides)


def test_cors_accepts_comma_separated_list():
    settings = make_settings(CORS_ORIGINS="http://a.test, http://b.test")
    assert settings.cors_origins == ["http://a.test", "http://b.test"]


def test_cors_accepts_json_array():
    settings = make_settings(CORS_ORIGINS='["https://app.test", "https://api.test"]')
    assert settings.cors_origins == ["https://app.test", "https://api.test"]


def test_cors_accepts_wildcard():
    settings = make_settings(CORS_ORIGINS="*")
    assert settings.cors_origins == ["*"]


def test_production_rejects_default_secret_and_wildcard_cors():
    settings = make_settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="change-this-to-a-secure-random-secret-key",
        GEMINI_API_KEY="test-key",
        CORS_ORIGINS="*",
    )
    with pytest.raises(RuntimeError) as excinfo:
        settings.validate_runtime()
    message = str(excinfo.value)
    assert "JWT_SECRET_KEY" in message
    assert "CORS_ORIGINS" in message


def test_production_rejects_missing_api_key():
    settings = make_settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="s" * 48,
        GEMINI_API_KEY=None,
        CORS_ORIGINS="https://app.test",
    )
    with pytest.raises(RuntimeError) as excinfo:
        settings.validate_runtime()
    assert "GEMINI_API_KEY" in str(excinfo.value)


def test_strong_production_config_passes():
    settings = make_settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="s" * 48,
        GEMINI_API_KEY="test-key",
        CORS_ORIGINS="https://app.test",
    )
    settings.validate_runtime()


def test_development_does_not_require_production_settings():
    settings = make_settings(ENVIRONMENT="development", JWT_SECRET_KEY="short")
    settings.validate_runtime()
