# adminpanel/urls_api.py
from django.urls import path
from .views_api import (
    DashboardStatsAPIView,
    DioceseListAPIView,
    DioceseCreateAPIView,
    DioceseDetailAPIView,
    ChurchListAPIView,
    ChurchCreateAPIView,
    ChurchDetailAPIView,
    ChurchActivateAPIView,
    ChurchSuspendAPIView,
    PackageListAPIView,
    PackageCreateAPIView,
    PackageDetailAPIView,
    PackageDeleteAPIView,
    PackageChurchesAPIView,
    # Bill views renamed to Subscription
    SubscriptionListAPIView,
    SubscriptionDetailAPIView,
    SubscriptionCreateAPIView,
    SubscriptionMarkPaidAPIView,
    SubscriptionActivateAPIView,
    SubscriptionCancelAPIView,
    UpgradeRequestListAPIView,
    UpgradeRequestApproveAPIView,
    UpgradeRequestRejectAPIView,
    TaxTypeListAPIView,TaxRateListAPIView,TaxTypeCreateAPIView,
    TaxTypeDetailAPIView,TaxRateCreateAPIView,TaxRateDetailAPIView,
    BillListAPIView,
    BillCreateAPIView,
    BillDetailAPIView,
    BillMarkPaidAPIView,
)

urlpatterns = [
    # Dashboard
    path('dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    
    # Diocese
    path('dioceses/', DioceseListAPIView.as_view(), name='diocese-list'),
    path('dioceses/create/', DioceseCreateAPIView.as_view(), name='diocese-create'),
    path('dioceses/<int:pk>/', DioceseDetailAPIView.as_view(), name='diocese-detail'),
    
    # Churches
    path('churches/', ChurchListAPIView.as_view(), name='church-list'),
    path('churches/create/', ChurchCreateAPIView.as_view(), name='church-create'),
    path('churches/<int:pk>/', ChurchDetailAPIView.as_view(), name='church-detail'),
    path('churches/<int:pk>/activate/', ChurchActivateAPIView.as_view(), name='church-activate'),
    path('churches/<int:pk>/suspend/', ChurchSuspendAPIView.as_view(), name='church-suspend'),
    
    # Packages
    path('packages/', PackageListAPIView.as_view(), name='package-list'),
    path('packages/create/', PackageCreateAPIView.as_view(), name='package-create'),
    path('packages/<int:pk>/', PackageDetailAPIView.as_view(), name='package-detail'),
    path('packages/<int:pk>/delete/', PackageDeleteAPIView.as_view(), name='package-delete'),
    path('packages/<int:pk>/churches/', PackageChurchesAPIView.as_view(), name='package-churches'),
    
    # Subscriptions (renamed from Bills)
    path('subscriptions/', SubscriptionListAPIView.as_view(), name='subscription-list'),
    path('subscriptions/<int:pk>/', SubscriptionDetailAPIView.as_view(), name='subscription-detail'),
    path('subscriptions/create/', SubscriptionCreateAPIView.as_view(), name='subscription-create'),
    path('subscriptions/<int:pk>/mark-paid/', SubscriptionMarkPaidAPIView.as_view(), name='subscription-mark-paid'),
    path('subscriptions/<int:pk>/activate/', SubscriptionActivateAPIView.as_view(), name='subscription-activate'),
    path('subscriptions/<int:pk>/cancel/', SubscriptionCancelAPIView.as_view(), name='subscription-cancel'),


     # Tax Types
    path('tax-types/', TaxTypeListAPIView.as_view(), name='tax-type-list'),
    path('tax-types/create/', TaxTypeCreateAPIView.as_view(), name='tax-type-create'),
    path('tax-types/<int:pk>/', TaxTypeDetailAPIView.as_view(), name='tax-type-detail'),
    
    # Tax Rates
    path('tax-rates/', TaxRateListAPIView.as_view(), name='tax-rate-list'),
    path('tax-rates/create/', TaxRateCreateAPIView.as_view(), name='tax-rate-create'),
    path('tax-rates/<int:pk>/', TaxRateDetailAPIView.as_view(), name='tax-rate-detail'),


    # Bills (Payments)
    path('bills/', BillListAPIView.as_view(), name='bill-list'),
    path('bills/create/', BillCreateAPIView.as_view(), name='bill-create'),
    path('bills/<int:pk>/', BillDetailAPIView.as_view(), name='bill-detail'),
    path('bills/<int:pk>/mark-paid/', BillMarkPaidAPIView.as_view(), name='bill-mark-paid'),
    
    # Upgrade Requests
    path('upgrade-requests/', UpgradeRequestListAPIView.as_view(), name='upgrade-request-list'),
    path('upgrade-requests/<int:pk>/approve/', UpgradeRequestApproveAPIView.as_view(), name='upgrade-request-approve'),
    path('upgrade-requests/<int:pk>/reject/', UpgradeRequestRejectAPIView.as_view(), name='upgrade-request-reject'),
]