from django.urls import path
from .views import (
    ChangePasswordAPIView, 
    CheckEmailAPIView, 
    LoginAPIView, 
    AdminLoginAPIView,
    ChurchProfileAPIView, 
    LogoutAPIView, 
    reset_password,
    forgot_password
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("auth/check-email/", CheckEmailAPIView.as_view(), name="check-email"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("admin/login/", AdminLoginAPIView.as_view(), name="admin-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("change-password/", ChangePasswordAPIView.as_view(), name="change-password"),
    path("church/profile/", ChurchProfileAPIView.as_view(), name="church-profile"),
    path("auth/forgot-password/", forgot_password, name="forgot-password"),
    path("auth/reset-password/", reset_password, name="reset-password"),
]