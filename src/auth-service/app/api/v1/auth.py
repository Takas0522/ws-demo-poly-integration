"""認証エンドポイント"""
from fastapi import APIRouter, HTTPException, status
from ...schemas.auth import LoginRequest, TokenResponse, TokenVerifyRequest, TokenVerifyResponse
from ...services.auth_service import AuthService
from ...utils.jwt import verify_jwt_token

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """ログイン"""
    auth_service = AuthService()
    result = await auth_service.login(request.user_id, request.password)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or user is inactive"
        )
    
    return TokenResponse(**result)


@router.post("/verify", response_model=TokenVerifyResponse)
async def verify_token(request: TokenVerifyRequest):
    """トークン検証"""
    payload = verify_jwt_token(request.token)
    
    if payload is None:
        return TokenVerifyResponse(valid=False)
    
    return TokenVerifyResponse(valid=True, payload=payload)
