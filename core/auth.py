# ==============================================================================
# DATEI: core/auth.py
# ZIEL: Optionale JWT Authentifizierung für den Markdown Viewer
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.config import cfg

# Passwort-Kontext und OAuth2-Schema (auto_error=False erlaubt optionales Auth)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifiziert ein Plaintext-Passwort gegen das Hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generiert einen Argon2-Hash für ein Passwort."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Erstellt ein neues JWT-Access-Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, cfg.JWT_SECRET_KEY, algorithm=cfg.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    """
    Abhängigkeit zum Ermitteln des aktuellen Benutzers.
    Wenn AUTH_ENABLED=false, wird ein lokaler Mock-User zurückgegeben.
    """
    if not cfg.AUTH_ENABLED:
        return {"username": "local_admin", "role": "ADMIN"}

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Konnte Anmeldedaten nicht validieren",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, cfg.JWT_SECRET_KEY, algorithms=[cfg.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Da wir eine Standalone-Version haben, nutzen wir hier einen statischen Admin-User
    # für einfache Multi-User oder Token-basierte Setups.
    if username == "admin":
        return {"username": "admin", "role": "ADMIN"}
    
    raise credentials_exception
