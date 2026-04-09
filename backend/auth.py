# auth.py

from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

SECRET_KEY = os.environ.get("SECRET_KEY", "fallback_dev_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000



# ===============================
# CREATE TOKEN
# ===============================
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# ===============================
# DECODE TOKEN
# ===============================
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username is None:
            return None

        return username

    except JWTError:
        return None