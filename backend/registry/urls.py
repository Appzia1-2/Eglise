from django.urls import path
from .views import (
    BaptismAPIView,
    BaptismCertificateAPIView,
    BaptismDetailAPIView,
    ChurchBaptismCertificateAPIView,
    ChurchBillDetailAPIView,
    ChurchBillListAPIView,
    ChurchDashboardAPIView,
    ChurchMembersAPIView,
    DeathRegisterFinalizeView,
    DeathRegisterListAPIView,
    DeathRegisterUpdateAPIView,
    DeathRegisterCreateAPIView,
    DesignationDetailView,
    DesignationListCreateView,
    DheshaKuriAPIView,
    DioceseDetailView,
    DioceseListCreateView,
    EventDetailAPIView,
    EventListCreateAPIView,
    FamilyBaptismsMobileAPIView,
    FamilyDetailMobileAPIView,
    FamilyHeadCreateAPIView,
    FamilyHeadListAPIView,
    FamilyHeadUpdateAPIView,
    FamilyMarriagesMobileAPIView,
    FamilyMembersAPIView,
    InactiveMembersAPIView,
    MarkMemberDeadAPIView,
    MarriageCertificateAPIView,
    MarriageCertificateMobileAPIView,
    MarriageDetailAPIView,
    MarriageListCreateAPIView,
    MemberProfileAPIView,
    MembersUnderHeadAPIView,
    MyChurchAPIView,
    PackageListAPIView,
   
    PriestDetailView,
    PriestDropdownAPIView,
    PriestListCreateView,
    PromoteFamilyHeadAPIView,
    RegisterSettingCreateAPIView,
    RegisterSettingListAPIView,
    RegisterSettingUpdateAPIView,
    RelationshipListCreateAPIView,
    SubscribeAPIView,
    SubscriptionExpiryAPIView,
    TombFeeDetailView,
    TombFeeListCreateView,
    TombTypeDetailView,
    TombTypeListCreateView,
    UpgradeAPIView,
    UpgradeRequestAPIView,
    UserDheshaKuriAPIView,
   
    WardListCreateAPIView,
    WardDetailAPIView,
    FamilyListCreateAPIView,
    FamilyDetailAPIView,
    MemberListCreateAPIView,
    MemberDetailAPIView,
    ChurchList,
    ChangeFamilyHeadAPIView,ChangeMemberHeadAPIView,
    OfferingListCreateView,   PriestMasterAPIView,
    OfferingDetailView,HeadlessHousesGroupedAPIView,MembersByHouseAPIView,
    RelationshipDetailView,GradeListCreateview,GradeDetailview,WardListWithFamilyCountAPIView,WardFamiliesMobileAPIView, VisitorMasterListCreateView,
    VisitorMasterDetailView,SubscriptionListCreateView,AccountGroupMasterListCreateView, AccountGroupMasterDetailView,TransferAndPromoteHeadAPIView,
    SubscriptionDetailView,AccountLedgerMasterListCreateView,PaymentMasterListCreateView,QurbanaReceiptsListCreateView,
    QurbanaReceiptsDetailView, CommitteeMasterListCreateView, CommitteeMasterDetailView, HeadlessHouseMembersAPIView,
     PaymentMasterDetailView, AccountLedgerMasterDetailView, MemberDirectoryAPIView,
    MemberAgeWiseListAPIView, MemberPhoneDirectoryAPIView,DioceseListCreateAPIView, DioceseDetailAPIView, MemberDetailView, LegacyBaptismListCreateAPIView,
    LegacyBaptismDetailAPIView,
    LegacyMarriageListCreateAPIView,BankAccountListCreateView,BankAccountDetailView,PaymentCancelAPIView,
    LegacyMarriageDetailAPIView,
    LegacyDeathListCreateAPIView,
    LegacyDeathDetailAPIView,LedgerEntryListAPIView,ReceiptListCreateAPIView,
    ReceiptDetailAPIView,
    ReceiptCancelAPIView,
    LedgerBalanceAPIView,MemberLedgerReportAPIView,
    IncomeExpenditureReportAPIView,
    DonationRegisterReportAPIView,SubscriptionDueListAPIView,
    SubscriptionPaidListAPIView,ChurchDashboardMetricsAPIView,ReceiptPaymentCombinedAPIView,ContraMasterListCreateView, ContraMasterDetailView,ContraCancelAPIView 
)

urlpatterns = [

    path("church/dashboard-metrics/", ChurchDashboardMetricsAPIView.as_view(), name="church-dashboard-metrics"),

    # Wards
    path("wards/", WardListCreateAPIView.as_view()),
    path("wards/<int:pk>/", WardDetailAPIView.as_view()),
    path("mobile/wards/", WardListWithFamilyCountAPIView.as_view()),
    path("mobile/<ward_id>/families/", WardFamiliesMobileAPIView.as_view()),
    path("mobile/families/<int:family_id>/<str:house_name>/",FamilyDetailMobileAPIView.as_view(),name="mobile-family-detail"),

    #Grade
    path("grade/",GradeListCreateview.as_view(),name='grade_create'),
    path("grade/<int:pk>/",GradeDetailview.as_view(),name='grade-update-delete'),

    # Relationship
    path("relationships/",RelationshipListCreateAPIView.as_view(),name="relationship-list-create"),
    path("relationships/<int:pk>/",RelationshipDetailView.as_view(),name="relationship-detail"),
    # Families
    path("families/", FamilyListCreateAPIView.as_view()),
    path("families/<int:pk>/", FamilyDetailAPIView.as_view()),

    # Members
    path("members/create-head/",FamilyHeadCreateAPIView.as_view(),name="create-family-head"),
    path("members/", MemberListCreateAPIView.as_view()),
    path("members/<int:pk>/", MemberDetailAPIView.as_view()),
    path("member/profile/", MemberProfileAPIView.as_view()),
    #member list by families
    path("families/<int:family_id>/<str:house_name>/members/",FamilyMembersAPIView.as_view(),name="family-members"),

    #Packages
    path("packages/", PackageListAPIView.as_view()),
    path("church/subscribe/", SubscribeAPIView.as_view()),
    path("church/upgrade/", UpgradeAPIView.as_view()),
    path("church/dashboard/", ChurchDashboardAPIView.as_view()),
    path("my-church/",MyChurchAPIView.as_view(),name="my-church"),



    path("dioceses/", DioceseListCreateAPIView.as_view(), name="diocese-list-create"),
    path("dioceses/<int:pk>/", DioceseDetailAPIView.as_view(), name="diocese-detail"),

    path('churches/',ChurchList.as_view()),
    path("bills/",ChurchBillListAPIView.as_view(),name="church-bill-list"),
    path("bills/<int:pk>/",ChurchBillDetailAPIView.as_view(),name="church-bill-detail"),

    path("subscription/expiry/",SubscriptionExpiryAPIView.as_view(),name="subscription-expiry"),
    path("families/change-head/",ChangeFamilyHeadAPIView.as_view(),name="change-family-head"),
    path("subscriptions/upgrade-request/",UpgradeRequestAPIView.as_view(),name="upgrade-request"),

    #baptism
    path("baptisms/",BaptismAPIView.as_view(),name="baptism-list-create"),
    path("baptisms/<int:pk>/",BaptismDetailAPIView.as_view(),name="baptism-detail"),
    path("mobile/families/baptisms/",FamilyBaptismsMobileAPIView.as_view(),name="mobile-family-baptisms"),
    path("baptisms/<int:pk>/certificate/",BaptismCertificateAPIView.as_view(),name="baptism-certificate"),
    path("church/baptism-certificate/<int:pk>/",ChurchBaptismCertificateAPIView.as_view(),name="church-baptism-certificate"),

    #marriage
    path("marriages/", MarriageListCreateAPIView.as_view(), name="marriage-list-create"),
path("marriages/<int:pk>/", MarriageDetailAPIView.as_view(), name="marriage-detail"),
path("marriages/<int:pk>/certificate/", MarriageCertificateAPIView.as_view()),
path("marriages/<int:pk>/dhesha-kuri/", DheshaKuriAPIView.as_view()),

# Mobile URLs
path("mobile/families/marriages/", FamilyMarriagesMobileAPIView.as_view(), name="mobile-family-marriages"),
path("mobile/marriages/<int:pk>/certificate/", MarriageCertificateMobileAPIView.as_view(), name="mobile-marriage-certificate"),
path("mobile/marriage/dhesha-kuri/", UserDheshaKuriAPIView.as_view()),
path('api/registry/family-heads/all/', FamilyHeadListAPIView.as_view(), name='family-heads-all'),

# Inactive Members & Death
path("members/inactive/", InactiveMembersAPIView.as_view(), name="inactive-members"),
path("finalize/death/", DeathRegisterFinalizeView.as_view(), name="death-register-finalize"),
path("members/mark-dead/<int:pk>/", MarkMemberDeadAPIView.as_view(), name="mark-member-dead"),
path("death-registers/<int:pk>/", DeathRegisterUpdateAPIView.as_view(), name="death-register-update"),
    path("members/promote-head/<int:pk>/",PromoteFamilyHeadAPIView.as_view(),name="promote-family-head"),
    path("death-register/",DeathRegisterListAPIView.as_view(),name="list-all-death"),
    path("death-register/create/",DeathRegisterCreateAPIView.as_view(),name="death-register-create"),
    path('members/<int:pk>/detail/', MemberDetailView.as_view(), name='member-detail'),
    

    path("family-head/<int:pk>/",FamilyHeadUpdateAPIView.as_view(),name="family-head-edit"),
    path("church-members/",ChurchMembersAPIView.as_view(),name="church-members"),

    path("members/headless-houses/", HeadlessHousesGroupedAPIView.as_view(), name="headless-houses"),
    path("members/by-house/", MembersByHouseAPIView.as_view(), name="members-by-house"),

    #tomb
    path("tomb-types/",TombTypeListCreateView.as_view(),name="tombtype-list-create"),
    path("tomb-types/<int:pk>/",TombTypeDetailView.as_view(),name="tombtype-detail"),
    path("tomb-fees/",TombFeeListCreateView.as_view(),name="tombfee-list-create"),
    path("tomb-fees/<int:pk>/",TombFeeDetailView.as_view(),name="tombfee-detail"),
    #designation
    path("designations/",DesignationListCreateView.as_view(),name="designation-list-create"),
    path("designations/<int:pk>/",DesignationDetailView.as_view(),name="designation-detail"),
    #dioces
    path("dioceses/", DioceseListCreateView.as_view(), name="diocese-list-create"),
    path("dioceses/<int:pk>/", DioceseDetailView.as_view(), name="diocese-detail"),

    #priest master
    path("priests/",PriestListCreateView.as_view(),name="priest-list-create"),
    path("priests/<int:pk>/",PriestDetailView.as_view(),name="priest-detail"),    
    path(
        "priests/master/",
        PriestMasterAPIView.as_view(),
        name="priest-master"
    ),

    #settingsregister
    path("register-settings/",RegisterSettingListAPIView.as_view(),name="register-settings-list"),
    path("register-settings/create/",RegisterSettingCreateAPIView.as_view(),name="register-settings-create"),
    path("register-settings/<str:register_type>/",RegisterSettingUpdateAPIView.as_view(),name="register-settings-update"),
    path("priests/dropdown/",PriestDropdownAPIView.as_view(),name="priests-dropdown"),
    path("members/family-heads/",FamilyHeadListAPIView.as_view(),name="family-head-list"),
    path("events/", EventListCreateAPIView.as_view(), name="event-list-create"),
    path("events/<int:pk>/", EventDetailAPIView.as_view(), name="event-detail"),
    path("members/by-head/<int:pk>/",MembersUnderHeadAPIView.as_view(),name="members-under-head"),
    path("members/waiting-list/", HeadlessHouseMembersAPIView.as_view(), name="member-waiting-list"),
    path("members/transfer-promote/<int:pk>/", TransferAndPromoteHeadAPIView.as_view(), name="transfer-promote-head"),
    path('members/change-head/<int:pk>/', ChangeMemberHeadAPIView.as_view(), name='change-member-head'),


    path("offerings/", OfferingListCreateView.as_view(), name="offering-list-create"),
    path("offerings/<int:pk>/", OfferingDetailView.as_view(), name="offering-detail"),

    path("visitors/", VisitorMasterListCreateView.as_view(), name="visitor-list-create"),
    path("visitors/<int:pk>/", VisitorMasterDetailView.as_view(), name="visitor-detail"),

    path("subscriptions/", SubscriptionListCreateView.as_view(), name="subscription-list-create"),
    path("subscriptions/<int:pk>/", SubscriptionDetailView.as_view(), name="subscription-detail"),

    path("account-groups/", AccountGroupMasterListCreateView.as_view(), name="account-group-list-create"),
    path("account-groups/<int:pk>/", AccountGroupMasterDetailView.as_view(), name="account-group-detail"),

    path("account-ledgers/", AccountLedgerMasterListCreateView.as_view(), name="account-ledger-list-create"),
    path("account-ledgers/<int:pk>/", AccountLedgerMasterDetailView.as_view(), name="account-ledger-detail"),

    # Bank Accounts
    path("bank-accounts/", BankAccountListCreateView.as_view(), name="bank-account-list"),
    path("bank-accounts/<int:pk>/", BankAccountDetailView.as_view(), name="bank-account-detail"),

# Payments (replace existing routes)
    path("payments/", PaymentMasterListCreateView.as_view(), name="payment-list"),
    path("payments/<int:pk>/", PaymentMasterDetailView.as_view(), name="payment-detail"),
    path("payments/<int:pk>/cancel/", PaymentCancelAPIView.as_view(), name="payment-cancel"),   

    path("qurbana-receipts/", QurbanaReceiptsListCreateView.as_view(), name="qurbana-list-create"),
    path("qurbana-receipts/<int:pk>/", QurbanaReceiptsDetailView.as_view(), name="qurbana-detail"),

    path("committees/", CommitteeMasterListCreateView.as_view(), name="committee-list-create"),
    path("committees/<int:pk>/", CommitteeMasterDetailView.as_view(), name="committee-detail"),

  

    path("members/directory/", MemberDirectoryAPIView.as_view(), name="member-directory"),
    path("members/age-wise/", MemberAgeWiseListAPIView.as_view(), name="member-age-wise"),
    path("members/phone-directory/", MemberPhoneDirectoryAPIView.as_view(), name="member-phone-directory"),


    path(
        "legacy/baptisms/",
        LegacyBaptismListCreateAPIView.as_view(),
        name="legacy-baptism-list-create"
    ),
    path(
        "legacy/baptisms/<int:pk>/",
        LegacyBaptismDetailAPIView.as_view(),
        name="legacy-baptism-detail"
    ),

    # Legacy Marriage
    path(
        "legacy/marriages/",
        LegacyMarriageListCreateAPIView.as_view(),
        name="legacy-marriage-list-create"
    ),
    path(
        "legacy/marriages/<int:pk>/",
        LegacyMarriageDetailAPIView.as_view(),
        name="legacy-marriage-detail"
    ),

    # Legacy Death
    path(
        "legacy/deaths/",
        LegacyDeathListCreateAPIView.as_view(),
        name="legacy-death-list-create"
    ),
    path(
        "legacy/deaths/<int:pk>/",
        LegacyDeathDetailAPIView.as_view(),
        name="legacy-death-detail"
    ),
    path("ledger-entries/", LedgerEntryListAPIView.as_view(), name="ledger-entry-list"),
    path("account-ledgers/<int:pk>/balance/", LedgerBalanceAPIView.as_view(), name="account-ledger-balance"),

    path(
        "receipts/",
        ReceiptListCreateAPIView.as_view(),
        name="receipt-list-create"
    ),
    path(
        "receipts/<int:pk>/",
        ReceiptDetailAPIView.as_view(),
        name="receipt-detail"
    ),
    path(
        "receipts/<int:pk>/cancel/",
        ReceiptCancelAPIView.as_view(),
        name="receipt-cancel"
    ),

    # Reports
path(
    "reports/member-ledger/",
    MemberLedgerReportAPIView.as_view(),
    name="report-member-ledger",
),
path(
    "reports/income-expenditure/",
    IncomeExpenditureReportAPIView.as_view(),
    name="report-income-expenditure",
),
path(
    "reports/donation-register/",
    DonationRegisterReportAPIView.as_view(),
    name="report-donation-register",
),
path(
    "reports/subscription-due/",
    SubscriptionDueListAPIView.as_view(),
    name="report-subscription-due",
),
path(
    "reports/subscription-paid/",
    SubscriptionPaidListAPIView.as_view(),
    name="report-subscription-paid",
),

# registry/urls.py
path("reports/receipt-payment/", ReceiptPaymentCombinedAPIView.as_view(), name="report-receipt-payment"),




path("contra/", ContraMasterListCreateView.as_view(), name="contra-list"),
path("contra/<int:pk>/", ContraMasterDetailView.as_view(), name="contra-detail"),
path("contra/<int:pk>/cancel/", ContraCancelAPIView.as_view(), name="contra-cancel"),

]
