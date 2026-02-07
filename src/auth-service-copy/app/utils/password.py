"""パスワードハッシュ化・検証"""
from passlib.hash import bcrypt


def hash_password(password: str) -> str:
    """パスワードハッシュ化"""
    return bcrypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """パスワード検証"""
    return bcrypt.verify(plain_password, hashed_password)
