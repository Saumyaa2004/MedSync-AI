import bcrypt

def hash_password(password: str) -> str:
    password_bytes = password[:72].encode("utf-8")  # bcrypt limit is 72 bytes
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password[:72].encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))