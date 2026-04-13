from fastapi import APIRouter

from app.api.v1.endpoints import auth, categories, health, manager, orders, products, reviews, wishlist

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(manager.router, prefix="/manager", tags=["manager"])
