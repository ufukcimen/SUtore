from passlib.context import CryptContext

# `bcrypt` is currently unstable with the installed package combination on Python 3.13.
# `pbkdf2_sha256` is a supported password hashing scheme in passlib and avoids that runtime issue.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
