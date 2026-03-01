import uuid

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        has_letter = any(char.isalpha() for char in password)
        has_digit = any(char.isdigit() for char in password)
        if not (has_letter and has_digit):
            raise ValueError(
                "Password must include at least one letter and one number."
            )
        return password

    @field_validator("name")
    @classmethod
    def validate_name(cls, name: str) -> str:
        value = name.strip()
        if not value:
            raise ValueError("Name cannot be empty.")
        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, username: str) -> str:
        value = username.strip().lower()
        if not value.replace("_", "").isalnum():
            raise ValueError(
                "Username can only contain letters, numbers, and underscores."
            )
        if value.startswith("_") or value.endswith("_"):
            raise ValueError("Username cannot start or end with underscore.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str | None = None
    username: str | None = None
    role: UserRole


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    username: str | None = Field(default=None, min_length=3, max_length=30)

    @field_validator("name")
    @classmethod
    def validate_name(cls, name: str | None) -> str | None:
        if name is None:
            return None
        value = name.strip()
        if not value:
            raise ValueError("Name cannot be empty.")
        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, username: str | None) -> str | None:
        if username is None:
            return None
        value = username.strip().lower()
        if not value.replace("_", "").isalnum():
            raise ValueError(
                "Username can only contain letters, numbers, and underscores."
            )
        if value.startswith("_") or value.endswith("_"):
            raise ValueError("Username cannot start or end with underscore.")
        return value

    @model_validator(mode="after")
    def validate_any_field_present(self) -> "UpdateProfileRequest":
        if self.name is None and self.username is None:
            raise ValueError("Provide at least one field to update.")
        return self


class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=72)
    role: UserRole = UserRole.USER

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        has_letter = any(char.isalpha() for char in password)
        has_digit = any(char.isdigit() for char in password)
        if not (has_letter and has_digit):
            raise ValueError(
                "Password must include at least one letter and one number."
            )
        return password

    @field_validator("name")
    @classmethod
    def validate_name(cls, name: str) -> str:
        value = name.strip()
        if not value:
            raise ValueError("Name cannot be empty.")
        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, username: str) -> str:
        value = username.strip().lower()
        if not value.replace("_", "").isalnum():
            raise ValueError(
                "Username can only contain letters, numbers, and underscores."
            )
        if value.startswith("_") or value.endswith("_"):
            raise ValueError("Username cannot start or end with underscore.")
        return value


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
