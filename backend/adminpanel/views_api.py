# adminpanel/views_api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUser
from registry.models import Diocese, Church, Package, ChurchSubscription, Bill, UpgradeRequest, TaxType, TaxRate
from registry.utils import send_church_credentials, generate_random_password

from django.db import transaction  # 🔥 FIX 1: was missing — transaction.atomic() raised NameError
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
import logging
import re

logger = logging.getLogger(__name__)


# ============ DASHBOARD STATS ============
class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            today = timezone.now().date()
            thirty_days_ago = today - timedelta(days=30)

            total_dioceses = Diocese.objects.count()
            total_churches = Church.objects.filter(is_deleted=False).count()
            active_churches = Church.objects.filter(is_active=True, is_deleted=False).count()

            revenue = Bill.objects.filter(
                status='PAID',
                paid_at__gte=thirty_days_ago
            ).aggregate(total=Sum('amount'))['total'] or 0

            thirty_days_later = today + timedelta(days=30)
            expiring_subscriptions = ChurchSubscription.objects.filter(
                is_active=True,
                end_date__gte=today,
                end_date__lte=thirty_days_later
            ).select_related('church', 'package')

            expiring_churches = []
            for sub in expiring_subscriptions:
                days_left = (sub.end_date - today).days
                expiring_churches.append({
                    'id': sub.church.id,
                    'name': sub.church.name,
                    'package': sub.package.name,
                    'days_remaining': days_left,
                    'diocese_name': sub.church.diocese.name if sub.church.diocese else None
                })

            recent_activities = []

            recent_bills = Bill.objects.select_related('church').order_by('-created_at')[:5]
            for bill in recent_bills:
                recent_activities.append({
                    'id': bill.id,
                    'type': 'bill',
                    'action': f'Bill {bill.amount} - {bill.church.name}',
                    # 🔥 FIX 10: keep the raw datetime for sorting, format only for display
                    '_sort_key': bill.created_at,
                    'time': bill.created_at.strftime('%Y-%m-%d %H:%M'),
                    'status': bill.status.lower(),
                    'user': bill.church.name
                })

            recent_churches = Church.objects.filter(is_deleted=False).order_by('-created_at')[:5]
            for church in recent_churches:
                recent_activities.append({
                    'id': church.id,
                    'type': 'church',
                    'action': f'New church registered: {church.name}',
                    '_sort_key': church.created_at,
                    'time': church.created_at.strftime('%Y-%m-%d %H:%M'),
                    'status': 'success',
                    'user': church.name
                })

            recent_activities.sort(key=lambda x: x['_sort_key'], reverse=True)
            recent_activities = recent_activities[:10]

            # Drop the internal sort key before returning
            for activity in recent_activities:
                activity.pop('_sort_key', None)

            response_data = {
                'total_dioceses': total_dioceses,
                'total_churches': total_churches,
                'active_churches': active_churches,
                'revenue': float(revenue),
                'expiring_churches': expiring_churches,
                'recent_activities': recent_activities
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Dashboard stats error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch dashboard statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============ DIOCESE VIEWS ============
class DioceseListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            dioceses = Diocese.objects.all().order_by('name')
            data = []
            for diocese in dioceses:
                churches = diocese.churches.filter(is_deleted=False)
                data.append({
                    'id': diocese.id,
                    'name': diocese.name,
                    'metropolitan_name': diocese.metropolitan_name,
                    'email': diocese.email,
                    'phone_number': str(diocese.phone_number) if diocese.phone_number else '',
                    'address_line1': diocese.address_line1 if hasattr(diocese, 'address_line1') else '',
                    'address_line2': diocese.address_line2 if hasattr(diocese, 'address_line2') else '',
                    'city': diocese.city,
                    'state': diocese.state,
                    'country': diocese.country.code if diocese.country else None,
                    'postal_code': diocese.postal_code if hasattr(diocese, 'postal_code') else '',
                    'website': diocese.website if hasattr(diocese, 'website') else '',
                    'is_active': diocese.is_active,
                    'church_count': churches.count(),
                    'churches': [{'id': c.id, 'name': c.name, 'city': c.city} for c in churches],
                })
            return Response({"status": "success", "count": len(data), "data": data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching dioceses: {str(e)}", exc_info=True)
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DioceseCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            if not request.data.get('name'):
                return Response({
                    "status": "error",
                    "message": "Diocese name is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not request.data.get('email'):
                return Response({
                    "status": "error",
                    "message": "Email is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            diocese = Diocese.objects.create(
                name=request.data.get('name'),
                metropolitan_name=request.data.get('metropolitan_name', ''),
                email=request.data.get('email'),
                phone_number=request.data.get('phone_number', ''),
                address_line1=request.data.get('address_line1', ''),
                address_line2=request.data.get('address_line2', ''),
                city=request.data.get('city', ''),
                state=request.data.get('state', ''),
                country=request.data.get('country', ''),
                postal_code=request.data.get('postal_code', ''),
                website=request.data.get('website', ''),
                is_active=request.data.get('is_active', True),
            )

            return Response({
                "status": "success",
                "message": "Diocese created successfully",
                "data": {
                    'id': diocese.id,
                    'name': diocese.name,
                    'metropolitan_name': diocese.metropolitan_name,
                    'email': diocese.email,
                    'phone_number': str(diocese.phone_number) if diocese.phone_number else '',
                    'address_line1': diocese.address_line1,
                    'address_line2': diocese.address_line2,
                    'city': diocese.city,
                    'state': diocese.state,
                    'country': diocese.country.code if diocese.country else None,
                    'postal_code': diocese.postal_code,
                    'website': diocese.website,
                    'is_active': diocese.is_active,
                    'full_address': diocese.get_full_address(),
                    'church_count': 0,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating diocese: {str(e)}", exc_info=True)
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DioceseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            diocese = Diocese.objects.get(pk=pk)
            churches = diocese.churches.filter(is_deleted=False)

            return Response({
                "status": "success",
                "data": {
                    'id': diocese.id,
                    'name': diocese.name,
                    'metropolitan_name': diocese.metropolitan_name,
                    'email': diocese.email,
                    'phone_number': str(diocese.phone_number) if diocese.phone_number else '',
                    'address_line1': diocese.address_line1,
                    'address_line2': diocese.address_line2,
                    'city': diocese.city,
                    'state': diocese.state,
                    'country': diocese.country.code if diocese.country else None,
                    'postal_code': diocese.postal_code,
                    'website': diocese.website,
                    'is_active': diocese.is_active,
                    'full_address': diocese.get_full_address(),
                    'church_count': churches.count(),
                    'churches': [{'id': c.id, 'name': c.name, 'city': c.city} for c in churches],
                }
            }, status=status.HTTP_200_OK)

        except Diocese.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Diocese not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching diocese {pk}: {str(e)}")
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        try:
            diocese = Diocese.objects.get(pk=pk)

            if 'name' in request.data:
                diocese.name = request.data['name']
            if 'metropolitan_name' in request.data:
                diocese.metropolitan_name = request.data['metropolitan_name']
            if 'email' in request.data:
                diocese.email = request.data['email']
            if 'phone_number' in request.data:
                diocese.phone_number = request.data['phone_number']
            if 'address_line1' in request.data:
                diocese.address_line1 = request.data['address_line1']
            if 'address_line2' in request.data:
                diocese.address_line2 = request.data['address_line2']
            if 'city' in request.data:
                diocese.city = request.data['city']
            if 'state' in request.data:
                diocese.state = request.data['state']
            if 'country' in request.data:
                diocese.country = request.data['country']
            if 'postal_code' in request.data:
                diocese.postal_code = request.data['postal_code']
            if 'website' in request.data:
                diocese.website = request.data['website']
            if 'is_active' in request.data:
                diocese.is_active = request.data['is_active']

            diocese.save()

            return Response({
                "status": "success",
                "message": "Diocese updated successfully",
                "data": {
                    'id': diocese.id,
                    'name': diocese.name,
                    'metropolitan_name': diocese.metropolitan_name,
                    'email': diocese.email,
                    'phone_number': str(diocese.phone_number) if diocese.phone_number else '',
                    'address_line1': diocese.address_line1,
                    'address_line2': diocese.address_line2,
                    'city': diocese.city,
                    'state': diocese.state,
                    'country': diocese.country.code if diocese.country else None,
                    'postal_code': diocese.postal_code,
                    'website': diocese.website,
                    'is_active': diocese.is_active,
                    'full_address': diocese.get_full_address(),
                }
            }, status=status.HTTP_200_OK)

        except Diocese.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Diocese not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating diocese {pk}: {str(e)}", exc_info=True)
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ CHURCH VIEWS ============

class ChurchListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
 
    def get(self, request):
        try:
            today = timezone.now().date()
 
            churches = Church.objects.filter(is_deleted=False).select_related(
                'diocese'
            ).order_by('name')
 
            data = []
            for church in churches:
                subscription = getattr(church, 'subscription', None)
                package_name = (
                    subscription.package.name
                    if subscription and subscription.package else None
                )
                package_id = (
                    subscription.package.id
                    if subscription and subscription.package else None
                )
                subscription_status = subscription.payment_status if subscription else None
                renewal_date = subscription.end_date if subscription else None

                # Get logo URL
                logo_url = None
                if church.logo and hasattr(church.logo, 'url'):
                    try:
                        logo_url = request.build_absolute_uri(church.logo.url)
                    except Exception:
                        logo_url = None

                # derived display status
                if not church.is_active:
                    if (
                        subscription
                        and not subscription.is_active
                        and subscription.payment_status == 'UNPAID'
                    ):
                        church_status = 'trial'
                    else:
                        church_status = 'suspended'
                elif renewal_date:
                    days_left = (renewal_date - today).days
                    if days_left < 0:
                        church_status = 'expired'
                    elif days_left <= 30:
                        church_status = 'expiring'
                    else:
                        church_status = 'active'
                else:
                    church_status = 'active'

                full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None
 
                data.append({
                    'id': church.id,
                    'name': church.name,
                    'code': church.code,
                    'address': church.address,
                    'address_line1': church.address_line1,
                    'city': church.city,
                    'state': church.state,
                    'country': church.country.code if church.country else None,
                    'postal_code': church.postal_code,
                    'diocese': church.diocese.name if church.diocese else None,
                    'diocese_id': church.diocese.id if church.diocese else None,
                    'established_year': church.established_year,
                    'registration_number': church.registration_number,
                    'currency': church.currency,
                    'email': church.email,
                    'phone_number': church.phone_number,
                    'alternate_phone': church.alternate_phone,
                    'website': church.website,
                    'is_active': church.is_active,
                    'created_at': church.created_at,
                    'full_address': full_address,
                    'logo': logo_url,  # Add logo URL
                    'logo_url': logo_url,  # Add logo URL
                    'package': package_name,
                    'package_name': package_name,
                    'package_id': package_id,
                    'subscription_status': subscription_status,
                    'renewal_date': renewal_date,
                    'status': church_status,
                })
 
            return Response({
                "status": "success",
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)
 
        except Exception as e:
            logger.error(f"Error fetching churches: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch churches"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from registry.utils import (
    send_church_credentials,
    generate_random_password,
    seed_default_relationships,
)
class ChurchCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def generate_church_code(self):
        """Generate unique auto-incrementing church code (CH-XXX)"""
        existing_codes = Church.objects.filter(
            code__isnull=False
        ).values_list('code', flat=True)

        numbers = []
        for code in existing_codes:
            # Match both CH-XXX and SMC-XXXX formats
            match = re.search(r'(?:CH|SMC)-(\d+)', code)
            if match:
                numbers.append(int(match.group(1)))

        if numbers:
            next_number = max(numbers) + 1
            return f"CH-{str(next_number).zfill(3)}"
        else:
            return "CH-001"

    def post(self, request):
        try:
            logger.info(f"Creating church with data: {request.data}")

            name = request.data.get('name', '').strip()
            email = request.data.get('email', '').strip()

            if not name:
                return Response({
                    "name": "Church name is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not email:
                return Response({
                    "email": "Email is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if Church.objects.filter(email=email, is_deleted=False).exists():
                return Response({
                    "email": f"A church with email '{email}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)

            # 🔥 FIX: User.username is globally unique and is NOT cleared by
            # church soft-delete, so an email freed up by a deleted church
            # still collides here. Without this check the Church row commits
            # and then User creation raises IntegrityError 1062.
            if User.objects.filter(username=email).exists():
                return Response({
                    "email": (
                        f"The email '{email}' is already registered to a login "
                        f"account, possibly from a previously deleted church. "
                        f"Please use a different email."
                    )
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get diocese if provided
            diocese = None
            diocese_id = request.data.get('diocese')
            if diocese_id:
                try:
                    diocese = Diocese.objects.get(id=diocese_id)
                except Diocese.DoesNotExist:
                    return Response({
                        "diocese": "Selected diocese does not exist"
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 🔥 FIX 2: duplicate-name check removed — different parishes
            # legitimately share names. Email remains the unique identifier.

            code = self.generate_church_code()

            while Church.objects.filter(code=code, is_deleted=False).exists():
                match = re.search(r'CH-(\d+)', code)
                if match:
                    current_num = int(match.group(1))
                    code = f"CH-{str(current_num + 1).zfill(3)}"
                else:
                    code = "CH-001"

            # 🔥 FIX: Church and User must succeed or fail together. Previously
            # these were two auto-committed statements, so a User failure left
            # a committed Church row behind — the cause of duplicate churches
            # appearing after a 400 error.
            with transaction.atomic():
                church = Church.objects.create(
                    name=name,
                    code=code,
                    diocese=diocese,
                    established_year=request.data.get('established_year'),
                    registration_number=request.data.get('registration_number', '').strip(),
                    currency=request.data.get('currency', '').strip(),
                    address=request.data.get('address', '').strip(),
                    address_line1=request.data.get('address_line1', '').strip(),
                    city=request.data.get('city', '').strip(),
                    state=request.data.get('state', '').strip(),
                    country=request.data.get('country', ''),
                    postal_code=request.data.get('postal_code', '').strip(),
                    email=email,
                    phone_number=request.data.get('phone_number', '').strip(),
                    alternate_phone=request.data.get('alternate_phone', '').strip(),
                    website=request.data.get('website', '').strip(),
                    is_active=False,
                )

                # 🌱 Seed default relationships for this church
                #    (idempotent — uses get_or_create, safe to call multiple times)
                seed_default_relationships(church)

                # Create user for the church (inactive until activated)
                user = User.objects.create(
                    username=email,
                    email=email,
                    church=church,
                    role='CHURCH',
                    is_active=False,
                )

                temp_password = generate_random_password()
                user.set_password(temp_password)
                user.save()

            logger.info(
                f"Church created successfully: {church.id}, "
                f"Code: {church.code}, User created: {user.id}"
            )

            full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None

            return Response({
                "status": "success",
                "message": (
                    f"Church created successfully with code {church.code}. "
                    f"User account created. Credentials will be sent upon activation."
                ),
                "data": {
                    'id': church.id,
                    'name': church.name,
                    'code': church.code,
                    'address': church.address,
                    'address_line1': church.address_line1,
                    'city': church.city,
                    'state': church.state,
                    'country': church.country.code if church.country else None,
                    'postal_code': church.postal_code,
                    'diocese': diocese.name if diocese else None,
                    'diocese_id': diocese.id if diocese else None,
                    'established_year': church.established_year,
                    'registration_number': church.registration_number,
                    'currency': church.currency,
                    'email': church.email,
                    'phone_number': church.phone_number,
                    'alternate_phone': church.alternate_phone,
                    'website': church.website,
                    'is_active': church.is_active,
                    'full_address': full_address,
                    'user_created': True,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating church: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

# adminpanel/views_api.py - Update ChurchDetailAPIView

class ChurchDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, pk):
        try:
            church = Church.objects.select_related('diocese').get(pk=pk, is_deleted=False)
            
            subscription = getattr(church, 'subscription', None)
            full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None
            
            # Get logo URL
            logo_url = None
            if church.logo and hasattr(church.logo, 'url'):
                try:
                    logo_url = request.build_absolute_uri(church.logo.url)
                except Exception:
                    logo_url = None
            
            # Build subscription data
            subscription_data = None
            if subscription:
                today = timezone.now().date()
                days_remaining = None
                progress_pct = 0
                annual_value = None
                
                if subscription.end_date:
                    days_remaining = (subscription.end_date - today).days
                    if days_remaining < 0:
                        days_remaining = 0
                    
                    total_days = (subscription.end_date - subscription.start_date).days if subscription.start_date else 1
                    used_days = (today - subscription.start_date).days if subscription.start_date else 0
                    if total_days > 0:
                        progress_pct = round((used_days / total_days) * 100, 2)
                        if progress_pct > 100:
                            progress_pct = 100
                        if progress_pct < 0:
                            progress_pct = 0
                
                try:
                    annual_value = float(subscription.get_total_price()) if subscription.get_total_price() else None
                except:
                    annual_value = None
                
                subscription_data = {
                    'id': subscription.id,
                    'package_name': subscription.package.name if subscription.package else None,
                    'locked_package_name': subscription.locked_package_name,
                    'package_id': subscription.package.id if subscription.package else None,
                    'billing_cycle': subscription.billing_cycle,
                    'payment_status': subscription.payment_status,
                    'is_active': subscription.is_active,
                    'start_date': subscription.start_date,
                    'end_date': subscription.end_date,
                    'started_on': subscription.start_date,
                    'renews_on': subscription.end_date,
                    'next_billing_date': subscription.end_date,
                    'created_at': subscription.created_at,
                    'days_remaining': days_remaining,
                    'progress_pct': progress_pct,
                    'duration_months': subscription.duration_months,
                    'custom_capacity': subscription.custom_capacity,
                    'credit_balance': float(subscription.credit_balance) if subscription.credit_balance else 0,
                    'annual_value': annual_value,
                }
            
            # Get administrators
            administrators = []
            users = User.objects.filter(church=church, role='CHURCH', is_active=True)
            for user in users:
                administrators.append({
                    'id': user.id,
                    'name': user.get_full_name() or user.email,
                    'email': user.email,
                    'role': 'Administrator',
                    'status': 'Active' if user.is_active else 'Inactive'
                })
            
            # Get member count
            member_count = church.members.filter(is_active=True, expired=False).count()
            admin_count = User.objects.filter(church=church, role='CHURCH', is_active=True).count()
            document_count = 0  # Placeholder
            
            # Get current package name
            current_package = subscription.package.name if subscription and subscription.package else None
            
            # Get bills for this church
            bills = Bill.objects.filter(church=church).order_by('-created_at')
            bills_data = []
            for bill in bills:
                bills_data.append({
                    'id': bill.id,
                    'bill_number': bill.bill_number,
                    'bill_type': bill.bill_type,
                    'amount': float(bill.amount),
                    'total_amount': float(bill.total_amount),
                    'status': bill.status,
                    'payment_method': bill.payment_method,
                    'created_at': bill.created_at,
                    'paid_at': bill.paid_at,
                })
            
            return Response({
                "status": "success",
                "data": {
                    'id': church.id,
                    'name': church.name,
                    'code': church.code,
                    'address': church.address,
                    'address_line1': church.address_line1,
                    'city': church.city,
                    'state': church.state,
                    'country': church.country.code if church.country else None,
                    'postal_code': church.postal_code,
                    'diocese': {
                        'id': church.diocese.id,
                        'name': church.diocese.name
                    } if church.diocese else None,
                    'diocese_name': church.diocese.name if church.diocese else None,
                    'established_year': church.established_year,
                    'registration_number': church.registration_number,
                    'currency': church.currency,
                    'email': church.email,
                    'phone_number': church.phone_number,
                    'alternate_phone': church.alternate_phone,
                    'website': church.website,
                    'is_active': church.is_active,
                    'is_verified': church.is_active,
                    'created_at': church.created_at,
                    'updated_at': church.updated_at,
                    'full_address': full_address,
                    'logo': logo_url,
                    'logo_url': logo_url,
                    'current_package': current_package,
                    'member_count': member_count,
                    'admin_count': admin_count,
                    'document_count': document_count,
                    'administrators': administrators,
                    'subscription': subscription_data,
                    'bills': bills_data,
                    'stats': {
                        'members_count': member_count,
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch church: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
    def _church_payload(self, church, request=None):
        """Shared response body for PUT/PATCH with logo URL"""
        full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None
        
        # Get logo URL
        logo_url = None
        if church.logo and hasattr(church.logo, 'url'):
            try:
                if request:
                    logo_url = request.build_absolute_uri(church.logo.url)
                else:
                    logo_url = church.logo.url
            except Exception:
                logo_url = None
        
        return {
            'id': church.id,
            'name': church.name,
            'code': church.code,
            'address': church.address,
            'address_line1': church.address_line1,
            'city': church.city,
            'state': church.state,
            'country': church.country.code if church.country else None,
            'postal_code': church.postal_code,
            'diocese': {
                'id': church.diocese.id,
                'name': church.diocese.name
            } if church.diocese else None,
            'established_year': church.established_year,
            'registration_number': church.registration_number,
            'currency': church.currency,
            'email': church.email,
            'phone_number': church.phone_number,
            'alternate_phone': church.alternate_phone,
            'website': church.website,
            'is_active': church.is_active,
            'full_address': full_address,
            'logo': logo_url,
            'logo_url': logo_url,
        }
 
    def put(self, request, pk):
        """Full update (PUT)"""
        try:
            church = Church.objects.get(pk=pk, is_deleted=False)
 
            name = request.data.get('name', '').strip()
            email = request.data.get('email', '').strip()
 
            if not name:
                return Response({
                    "name": "Church name is required"
                }, status=status.HTTP_400_BAD_REQUEST)
 
            if not email:
                return Response({
                    "email": "Email is required"
                }, status=status.HTTP_400_BAD_REQUEST)
 
            if Church.objects.filter(email=email, is_deleted=False).exclude(pk=pk).exists():
                return Response({
                    "email": f"A church with email '{email}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)
 
            church.name = name
            church.email = email
 
            # Handle text fields
            for field in self.TEXT_FIELDS:
                if field in request.data:
                    value = request.data.get(field)
                    if value is not None:
                        setattr(church, field, str(value).strip())
 
            if 'country' in request.data:
                church.country = request.data.get('country', '')
 
            if 'established_year' in request.data:
                try:
                    church.established_year = int(request.data.get('established_year')) if request.data.get('established_year') else None
                except (ValueError, TypeError):
                    church.established_year = None
 
            if 'diocese' in request.data:
                diocese_id = request.data.get('diocese')
                if diocese_id:
                    try:
                        church.diocese = Diocese.objects.get(id=diocese_id)
                    except Diocese.DoesNotExist:
                        return Response({
                            "diocese": "Selected diocese does not exist"
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    church.diocese = None
 
            if 'is_active' in request.data:
                church.is_active = request.data['is_active'] in [True, 'true', 'True', 1, '1']
 
            # Handle logo if provided
            if request.FILES and 'logo' in request.FILES:
                church.logo = request.FILES['logo']
            elif request.data.get('logo') == 'null' or request.data.get('logo') == '':
                church.logo = None
 
            church.save()
 
            return Response({
                "status": "success",
                "message": "Church updated successfully",
                "data": self._church_payload(church, request)
            }, status=status.HTTP_200_OK)
 
        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to update church: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
    def patch(self, request, pk):
        """Partial update (PATCH) - only updates provided fields"""
        try:
            church = Church.objects.get(pk=pk, is_deleted=False)
 
        # Handle name
            if 'name' in request.data:
                name = request.data.get('name', '').strip()
                if not name:
                    return Response({
                        "name": "Church name cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                church.name = name
 
        # Handle email
            if 'email' in request.data:
                email = request.data.get('email', '').strip()
                if not email:
                    return Response({
                        "email": "Email cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
 
                if Church.objects.filter(email=email, is_deleted=False).exclude(pk=pk).exists():
                    return Response({
                        "email": f"A church with email '{email}' already exists"
                    }, status=status.HTTP_400_BAD_REQUEST)
                church.email = email
 
        # Handle text fields
            for field in self.TEXT_FIELDS:
                if field in request.data:
                    value = request.data.get(field)
                    if value is not None and value != '':
                        setattr(church, field, str(value).strip())
                    elif value == '':
                        setattr(church, field, None)
 
        # Handle country - explicitly handle CountryField
            if 'country' in request.data:
                country_value = request.data.get('country', '').strip()
                if country_value and country_value != 'null':
                    church.country = country_value
                else:
                    church.country = None
 
        # Handle established_year
            if 'established_year' in request.data:
                try:
                    year_value = request.data.get('established_year')
                    church.established_year = int(year_value) if year_value else None
                except (ValueError, TypeError):
                    church.established_year = None
 
        # Handle diocese
            if 'diocese' in request.data:
                diocese_id = request.data.get('diocese')
                if diocese_id and str(diocese_id).strip():
                    try:
                        church.diocese = Diocese.objects.get(id=diocese_id)
                    except Diocese.DoesNotExist:
                        return Response({
                            "diocese": "Selected diocese does not exist"
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    church.diocese = None
 
        # Handle is_active
            if 'is_active' in request.data:
                is_active_value = request.data.get('is_active')
                church.is_active = is_active_value in [True, 'true', 'True', 1, '1']
 
        # Handle logo if provided in FILES
            if request.FILES and 'logo' in request.FILES:
                church.logo = request.FILES['logo']
        # Handle logo removal via form data
            elif 'logo' in request.data:
                logo_value = request.data.get('logo', '').strip()
                if logo_value in ['null', '', 'undefined', 'None']:
                    if church.logo:
                        church.logo.delete()
                    church.logo = None
 
            church.save()
 
            return Response({
                "status": "success",
                "message": "Church updated successfully",
                "data": self._church_payload(church, request)
            }, status=status.HTTP_200_OK)
 
        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to update church: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
    def delete(self, request, pk):
        """Soft delete church"""
        try:
            church = Church.objects.get(pk=pk, is_deleted=False)
 
            with transaction.atomic():
                church.is_deleted = True
                church.is_active = False
                church.deleted_at = timezone.now()
                church.save()
 
                User.objects.filter(church=church).update(is_active=False)
 
            return Response({
                "status": "success",
                "message": f"Church '{church.name}' deleted successfully"
            }, status=status.HTTP_200_OK)
 
        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to delete church: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChurchActivateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            church = Church.objects.get(pk=pk, is_deleted=False)

            # 🔥 FIX 4: previously, when the user already existed this view
            # returned "Existing credentials retained" — but that user was
            # created by ChurchCreateAPIView with a random temp password that
            # was never emailed to anyone. The church was activated with
            # credentials it did not have. Always issue and send a fresh
            # password on activation.
            with transaction.atomic():
                user = User.objects.filter(email=church.email).first()
                password = generate_random_password()

                if user:
                    user.is_active = True
                    user.role = 'CHURCH'
                    user.church = church
                    user.set_password(password)
                    user.save()
                    user_created = False
                else:
                    user = User.objects.create(
                        username=church.email,
                        email=church.email,
                        church=church,
                        role='CHURCH',
                        is_active=True,
                    )
                    user.set_password(password)
                    user.save()
                    user_created = True

                # 🌱 Ensure the church has the default relationship set.
                #    Uses get_or_create under the hood, so it's safe to
                #    call repeatedly without creating duplicates.
                seed_default_relationships(church)

                church.is_active = True
                church.save()

                email_sent = send_church_credentials(church, password, user)

            return Response({
                "status": "success",
                "message": f"Church '{church.name}' activated successfully.",
                "data": {
                    "church_id": church.id,
                    "church_name": church.name,
                    "email": church.email,
                    "credentials_sent": email_sent,
                    "username": user.username,
                    "user_created": user_created,
                }
            }, status=status.HTTP_200_OK)

        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error activating church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to activate church: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChurchSuspendAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            church = Church.objects.get(pk=pk, is_deleted=False)

            with transaction.atomic():
                church.is_active = False
                church.save()

                user = User.objects.filter(email=church.email).first()
                if user:
                    user.is_active = False
                    user.save()

            return Response({
                "status": "success",
                "message": f"Church '{church.name}' suspended successfully"
            }, status=status.HTTP_200_OK)

        except Church.DoesNotExist:
            return Response(
                {"error": "Church not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error suspending church {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to suspend church"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============ PACKAGE VIEWS ============
import re
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated




logger = logging.getLogger(__name__)


class PackageListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            packages = Package.objects.all().order_by('code')

            is_active_param = request.query_params.get('is_active')
            if is_active_param is not None:
                is_active_bool = is_active_param.lower() in ('true', '1', 'yes')
                packages = packages.filter(is_active=is_active_bool)

            data = []
            for package in packages:
                is_in_use = package.subscriptions.filter(is_active=True).exists()
                # church_count counts ALL subscriptions regardless of active
                # status; is_in_use / can_delete stay tied to active-only.
                church_count = package.subscriptions.count()

                data.append({
                    'id': package.id,
                    'code': package.code,
                    'name': package.name,
                    'member_limit': package.member_limit,
                    'rate_per_member_monthly': float(package.rate_per_member_monthly) if package.rate_per_member_monthly else None,
                    'rate_per_member_yearly': float(package.rate_per_member_yearly) if package.rate_per_member_yearly else None,
                    'is_active': package.is_active,
                    'is_in_use': is_in_use,
                    'church_count': church_count,
                    'can_edit': True,
                    'can_delete': not is_in_use,
                    'created_at': package.created_at,
                    'updated_at': package.updated_at,
                })

            return Response({
                "status": "success",
                "count": len(data),
                "results": data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching packages: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch packages"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PackageCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def _generate_package_code(self):
        """Generate unique auto-incrementing package code (PKG-XXX)"""
        existing_codes = Package.objects.filter(
            code__isnull=False
        ).values_list('code', flat=True)

        numbers = []
        for code in existing_codes:
            match = re.search(r'PKG-(\d+)', code)
            if match:
                numbers.append(int(match.group(1)))

        if numbers:
            next_number = max(numbers) + 1
            return f"PKG-{str(next_number).zfill(3)}"
        else:
            return "PKG-001"

    def post(self, request):
        try:
            name = request.data.get('name', '').strip()
            if not name:
                return Response(
                    {"error": "Package name is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate member_limit
            member_limit = request.data.get('member_limit')
            if member_limit is None or member_limit == '':
                return Response(
                    {"error": "Member limit is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                member_limit = int(member_limit)
                if member_limit < 0:
                    return Response(
                        {"error": "Member limit cannot be negative"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check for duplicate member_limit
                if Package.objects.filter(member_limit=member_limit).exists():
                    return Response(
                        {"error": f"Member limit {member_limit} is already in use. Please use a different limit."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except (ValueError, TypeError):
                return Response(
                    {"error": "Member limit must be a valid number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            rate_monthly = request.data.get('rate_per_member_monthly')
            rate_yearly = request.data.get('rate_per_member_yearly')

            if rate_monthly is None or rate_monthly == '':
                return Response(
                    {"error": "Monthly rate is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if rate_yearly is None or rate_yearly == '':
                return Response(
                    {"error": "Yearly rate is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            code = self._generate_package_code()

            package = Package.objects.create(
                code=code,
                name=name,
                member_limit=member_limit,
                rate_per_member_monthly=rate_monthly,
                rate_per_member_yearly=rate_yearly,
                is_active=request.data.get('is_active', True),
            )

            return Response({
                "status": "success",
                "message": f"Package created successfully with code {code}",
                "data": {
                    'id': package.id,
                    'code': package.code,
                    'name': package.name,
                    'member_limit': package.member_limit,
                    'rate_per_member_monthly': float(package.rate_per_member_monthly),
                    'rate_per_member_yearly': float(package.rate_per_member_yearly),
                    'is_active': package.is_active,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating package: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PackageDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)

            # Active subscriptions
            subscriptions = (
                package.subscriptions
                .select_related('church')
                .filter(is_active=True)
                .order_by('-created_at')
            )

            is_in_use = subscriptions.exists()

            # ALL subscriptions, including cancelled/expired
            church_count = package.subscriptions.count()

            churches = []

            for sub in subscriptions:
                church = sub.church

                # Try to get current member count safely
                member_count = 0

                try:
                    # Most common related_name
                    if hasattr(church, "members"):
                        member_count = church.members.filter(
                            is_deleted=False
                        ).count()
                except Exception:
                    try:
                        member_count = church.members.count()
                    except Exception:
                        member_count = 0

                churches.append({
                    "id": church.id,
                    "name": church.name,
                    "code": getattr(church, "code", None),
                    "church_code": getattr(church, "code", None),

                    "email": church.email,

                    "members": member_count,
                    "member_count": member_count,

                    "member_limit": package.member_limit,

                    "billing": (
                        "Yearly"
                        if sub.billing_cycle == "YEARLY"
                        else "Monthly"
                    ),
                    "billing_cycle": sub.billing_cycle,

                    "payment_status": sub.payment_status,

                    "status": (
                        "Active"
                        if sub.is_active
                        else "Inactive"
                    ),

                    "is_active": sub.is_active,

                    "start_date": sub.start_date,
                    "end_date": sub.end_date,

                    "created_at": sub.created_at,
                })

            # ---------------------------------------------------------
            # RECENT ACTIVITY
            # ---------------------------------------------------------
            #
            # There is currently no Activity model in the code you
            # provided, so we derive useful activity from package and
            # subscription timestamps.
            #
            # This gives the Package View page data immediately.
            # ---------------------------------------------------------

            activities = []

            # Package updated
            if package.updated_at:
                activities.append({
                    "type": "PACKAGE_UPDATED",
                    "title": "Package updated",
                    "description": "Package details were updated",
                    "actor": "Super Admin",
                    "date": package.updated_at,
                    "timestamp": package.updated_at,
                })

            # Package created
            if package.created_at:
                activities.append({
                    "type": "PACKAGE_CREATED",
                    "title": "Package created",
                    "description": f"{package.name} package was created",
                    "actor": "Super Admin",
                    "date": package.created_at,
                    "timestamp": package.created_at,
                })

            # Subscription activities
            for sub in package.subscriptions.select_related("church").order_by(
                "-created_at"
            )[:20]:

                church_name = (
                    sub.church.name
                    if sub.church
                    else "Unknown Church"
                )

                # Church subscribed
                if sub.created_at:
                    activities.append({
                        "type": "CHURCH_SUBSCRIBED",
                        "title": "Church subscribed",
                        "description": church_name,
                        "actor": church_name,
                        "date": sub.created_at,
                        "timestamp": sub.created_at,
                    })

                # Payment / activation
                if sub.payment_status == "PAID" and sub.updated_at:
                    activities.append({
                        "type": "SUBSCRIPTION_ACTIVATED",
                        "title": "Subscription activated",
                        "description": church_name,
                        "actor": "Super Admin",
                        "date": sub.updated_at,
                        "timestamp": sub.updated_at,
                    })

            # Sort newest first
            activities.sort(
                key=lambda item: item.get("timestamp") or "",
                reverse=True
            )

            # Only show latest 5
            activities = activities[:5]

            data = {
                "id": package.id,
                "code": package.code,
                "name": package.name,

                "member_limit": package.member_limit,

                "rate_per_member_monthly": (
                    float(package.rate_per_member_monthly)
                    if package.rate_per_member_monthly
                    else None
                ),

                "rate_per_member_yearly": (
                    float(package.rate_per_member_yearly)
                    if package.rate_per_member_yearly
                    else None
                ),

                "upgrade_rate_monthly": (
                    float(package.upgrade_rate_monthly)
                    if getattr(package, "upgrade_rate_monthly", None)
                    else None
                ),

                "upgrade_rate_yearly": (
                    float(package.upgrade_rate_yearly)
                    if getattr(package, "upgrade_rate_yearly", None)
                    else None
                ),

                "is_active": package.is_active,

                "is_in_use": is_in_use,
                "church_count": church_count,

                "can_edit": True,
                "can_delete": not is_in_use,

                "churches": churches,

                # Both names are supplied so the frontend can use
                # either one.
                "activity": activities,
                "recent_activity": activities,

                "created_at": package.created_at,
                "updated_at": package.updated_at,
            }

            return Response({
                "status": "success",
                "data": data
            }, status=status.HTTP_200_OK)

        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logger.error(
                f"Error fetching package {pk}: {str(e)}",
                exc_info=True
            )

            return Response(
                {
                    "error": f"Failed to fetch package: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, pk):
        """Partial update. Allowed even if in use — existing subscriptions
        preserve their original rates."""
        try:
            package = Package.objects.get(pk=pk)

            if 'name' in request.data:
                name = request.data.get('name', '').strip()
                if not name:
                    return Response(
                        {"error": "Package name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                package.name = name

            if 'member_limit' in request.data:
                member_limit = request.data['member_limit']

                # Validate member_limit
                if member_limit is None or member_limit == '':
                    return Response(
                        {"error": "Member limit cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    member_limit = int(member_limit)
                    if member_limit < 0:
                        return Response(
                            {"error": "Member limit cannot be negative"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Check for duplicate (excluding current package)
                    if Package.objects.exclude(pk=pk).filter(member_limit=member_limit).exists():
                        return Response(
                            {"error": f"Member limit {member_limit} is already in use by another package. Please use a different limit."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                except (ValueError, TypeError):
                    return Response(
                        {"error": "Member limit must be a valid number"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                package.member_limit = member_limit

            if 'rate_per_member_monthly' in request.data:
                package.rate_per_member_monthly = request.data['rate_per_member_monthly']

            if 'rate_per_member_yearly' in request.data:
                package.rate_per_member_yearly = request.data['rate_per_member_yearly']

            if 'is_active' in request.data:
                package.is_active = request.data['is_active']

            package.save()

            return Response({
                "status": "success",
                "message": "Package updated successfully",
                "data": self._package_payload(package)
            }, status=status.HTTP_200_OK)

        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating package {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request, pk):
        """Full update - ALLOWED even if in use"""
        try:
            package = Package.objects.get(pk=pk)

            name = request.data.get('name', '').strip()
            if not name:
                return Response(
                    {"error": "Package name is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            member_limit = request.data.get('member_limit')

            # Validate member_limit
            if member_limit is None or member_limit == '':
                return Response(
                    {"error": "Member limit is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                member_limit = int(member_limit)
                if member_limit < 0:
                    return Response(
                        {"error": "Member limit cannot be negative"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check for duplicate (excluding current package)
                if Package.objects.exclude(pk=pk).filter(member_limit=member_limit).exists():
                    return Response(
                        {"error": f"Member limit {member_limit} is already in use by another package. Please use a different limit."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except (ValueError, TypeError):
                return Response(
                    {"error": "Member limit must be a valid number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            package.name = name
            package.member_limit = member_limit
            package.rate_per_member_monthly = request.data.get('rate_per_member_monthly', 0)
            package.rate_per_member_yearly = request.data.get('rate_per_member_yearly', 0)
            package.is_active = request.data.get('is_active', True)
            package.save()

            return Response({
                "status": "success",
                "message": "Package updated successfully",
                "data": self._package_payload(package)
            }, status=status.HTTP_200_OK)

        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating package {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk):
        """Hard delete - ONLY if no active subscriptions"""
        try:
            package = Package.objects.get(pk=pk)

            if package.subscriptions.filter(is_active=True).exists():
                active_church_count = package.subscriptions.filter(is_active=True).count()
                return Response({
                    "error": (
                        f"Cannot delete package '{package.name}' because it is "
                        f"currently in use by {active_church_count} active church(es)."
                    ),
                    "active_subscriptions": active_church_count,
                    "suggestion": "Consider deactivating the package instead of deleting it."
                }, status=status.HTTP_400_BAD_REQUEST)

            package_name = package.name
            package.delete()

            return Response({
                "status": "success",
                "message": f"Package '{package_name}' deleted successfully"
            }, status=status.HTTP_200_OK)

        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting package {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _package_payload(self, package):
        """Shared response body for PUT/PATCH"""
        has_active_subs = package.subscriptions.filter(is_active=True).exists()
        return {
            'id': package.id,
            'code': package.code,
            'name': package.name,
            'member_limit': package.member_limit,
            'rate_per_member_monthly': float(package.rate_per_member_monthly) if package.rate_per_member_monthly else None,
            'rate_per_member_yearly': float(package.rate_per_member_yearly) if package.rate_per_member_yearly else None,
            'is_active': package.is_active,
            'is_in_use': has_active_subs,
            'can_edit': True,
            'can_delete': not has_active_subs,
            'warning': "Existing subscriptions preserve their original rates" if has_active_subs else None
        }

class PackageChurchesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)

            subscriptions = package.subscriptions.select_related('church').filter(is_active=True)
            churches = []

            for sub in subscriptions:
                churches.append({
                    'id': sub.church.id,
                    'name': sub.church.name,
                    'email': sub.church.email,
                    'billing_cycle': sub.billing_cycle,
                    'payment_status': sub.payment_status,
                    'start_date': sub.start_date,
                    'end_date': sub.end_date,
                })

            return Response({
                "status": "success",
                "package": package.name,
                "church_count": len(churches),
                "churches": churches
            }, status=status.HTTP_200_OK)

        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching package churches {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch churches"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ============ SUBSCRIPTION VIEWS ============

class SubscriptionListAPIView(APIView):
    """List all subscriptions"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            subscriptions = (
                ChurchSubscription.objects.select_related("church", "package")
                .order_by("-id")
            )

            data = []

            for sub in subscriptions:
                rate_per_member_monthly = float(sub.package.rate_per_member_monthly) if sub.package and sub.package.rate_per_member_monthly else 0
                rate_per_member_yearly = float(sub.package.rate_per_member_yearly) if sub.package and sub.package.rate_per_member_yearly else 0
                member_limit = sub.package.member_limit if sub.package else 0

                # 🔥 Single source of truth: model methods
                capacity = sub.get_capacity()
                rate_used = float(sub.get_rate()) if sub.get_rate() else 0
                amount = float(sub.get_total_price())
                cycle_display = "Yearly" if sub.billing_cycle == "YEARLY" else "Monthly"

                data.append({
                    "id": sub.id,
                    "church_id": sub.church.id if sub.church else None,
                    "church_name": sub.church.name if sub.church else "Unknown",
                    "church_code": sub.church.code if sub.church else "N/A",

                    "package_id": sub.package.id if sub.package else None,
                    "package_name": sub.package.name if sub.package else "N/A",
                    "package_code": sub.package.code if sub.package else "N/A",

                    # Package pricing details (display/reference only —
                    # NOT re-used to compute `amount`, that comes from get_total_price())
                    "rate_per_member_monthly": rate_per_member_monthly,
                    "rate_per_member_yearly": rate_per_member_yearly,
                    "member_limit": member_limit,
                    "capacity": capacity,
                    "custom_capacity": sub.custom_capacity,

                    "rate_used": rate_used,
                    "cycle_display": cycle_display,

                    "billing_cycle": sub.billing_cycle,
                    "duration_months": sub.duration_months,
                    "payment_status": sub.payment_status,
                    "is_active": sub.is_active,

                    "start_date": sub.start_date,
                    "end_date": sub.end_date,

                    "amount": amount,
                    "created_at": sub.created_at,
                })

            return Response(
                {
                    "status": "success",
                    "count": len(data),
                    "data": data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error fetching subscriptions: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubscriptionCreateAPIView(APIView):
    """Create or update a subscription for a church"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            church_id = request.data.get('church_id')
            package_id = request.data.get('package_id')
            billing_cycle = request.data.get('billing_cycle', 'YEARLY')
            duration_months = request.data.get('duration_months', 12)

            if not church_id or not package_id:
                return Response({
                    "error": "church_id and package_id are required"
                }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Check if church already has a subscription
            church = Church.objects.get(id=church_id, is_deleted=False)
            
            existing_sub = ChurchSubscription.objects.filter(
                church=church,
                is_active=True  # Only check active subscriptions
            ).exists()
            
            if existing_sub:
                return Response({
                    "error": "This church already has an active subscription"
                }, status=status.HTTP_400_BAD_REQUEST)

            package = Package.objects.get(id=package_id, is_active=True)

            subscription = ChurchSubscription.objects.create(
                church=church,
                package=package,
                billing_cycle=billing_cycle,
                duration_months=duration_months,
                start_date=timezone.now().date(),
                payment_status='UNPAID',
                is_active=False,
            )

            amount = float(subscription.get_total_price())

            return Response({
                "status": "success",
                "message": "Subscription created successfully",
                "data": {
                    "subscription_id": subscription.id,
                    "church_name": church.name,
                    "church_code": church.code,
                    "package_name": package.name,
                    "package_code": package.code,
                    "billing_cycle": subscription.billing_cycle,
                    "capacity": subscription.get_capacity(),
                    "rate_used": float(subscription.get_rate()) if subscription.get_rate() else 0,
                    "amount": amount,
                    "payment_status": subscription.payment_status,
                    "start_date": subscription.start_date,
                    "end_date": subscription.end_date,
                    "is_new": True,
                }
            }, status=status.HTTP_201_CREATED)

        except Church.DoesNotExist:
            return Response({
                "error": "Church not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Package.DoesNotExist:
            return Response({
                "error": "Package not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        

class SubscriptionDetailAPIView(APIView):
    """Get subscription details"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            subscription = ChurchSubscription.objects.select_related(
                'church', 'package'
            ).get(pk=pk)

            rate_per_member_monthly = float(subscription.package.rate_per_member_monthly) if subscription.package and subscription.package.rate_per_member_monthly else 0
            rate_per_member_yearly = float(subscription.package.rate_per_member_yearly) if subscription.package and subscription.package.rate_per_member_yearly else 0
            member_limit = subscription.package.member_limit if subscription.package else 0

            # 🔥 Single source of truth: model methods
            capacity = subscription.get_capacity()
            amount = float(subscription.get_total_price())

            data = {
                'id': subscription.id,
                'church_id': subscription.church.id if subscription.church else None,
                'church_name': subscription.church.name if subscription.church else "Unknown",
                'church_code': subscription.church.code if subscription.church else "N/A",
                'package_id': subscription.package.id if subscription.package else None,
                'package_name': subscription.package.name if subscription.package else "N/A",
                'package_code': subscription.package.code if subscription.package else "N/A",
                'billing_cycle': subscription.billing_cycle,
                'duration_months': subscription.duration_months,
                'payment_status': subscription.payment_status,
                'is_active': subscription.is_active,
                'start_date': subscription.start_date,
                'end_date': subscription.end_date,
                'custom_capacity': subscription.custom_capacity,
                'credit_balance': float(subscription.credit_balance) if subscription.credit_balance else 0,
                'pricing_origin': subscription.pricing_origin,
                'amount': amount,
                'total_price': amount,
                'created_at': subscription.created_at,

                # Package details (display/reference only — not re-used for `amount`)
                'member_limit': member_limit,
                'capacity': capacity,
                'rate_per_member_monthly': rate_per_member_monthly,
                'rate_per_member_yearly': rate_per_member_yearly,
                'currency': subscription.church.currency if subscription.church and subscription.church.currency else 'INR',

                # Upgrade tracking
                'previous_subscription': subscription.previous_subscription_id,
                'upgrade_from_package': subscription.upgrade_from_package_id,
                'upgrade_date': subscription.upgrade_date,
                'pro_rata_credit': float(subscription.pro_rata_credit) if subscription.pro_rata_credit else 0,
            }

            return Response({
                "status": "success",
                "data": data
            }, status=status.HTTP_200_OK)

        except ChurchSubscription.DoesNotExist:
            return Response(
                {"error": "Subscription not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching subscription {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch subscription: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubscriptionMarkPaidAPIView(APIView):
    """Mark subscription as paid"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = ChurchSubscription.objects.select_related('church').get(pk=pk)

            if subscription.payment_status == 'PAID':
                return Response({
                    "error": "Subscription is already paid"
                }, status=status.HTTP_400_BAD_REQUEST)

            church = subscription.church

            # 🔥 FIX 5: password reset + email must be atomic. If the email
            # fails after set_password() commits, the old password is gone
            # and the new one was never delivered — locking the church out.
            with transaction.atomic():
                subscription.payment_status = 'PAID'
                subscription.is_active = True
                subscription.save()

                church.is_active = True
                church.save()

                user = User.objects.filter(email=church.email).first()
                password = generate_random_password()

                if user:
                    user.is_active = True
                    user.role = 'CHURCH'
                    user.church = church
                    user.set_password(password)
                    user.save()
                    user_created = False
                else:
                    user = User.objects.create(
                        username=church.email,
                        email=church.email,
                        church=church,
                        role='CHURCH',
                        is_active=True,
                    )
                    user.set_password(password)
                    user.save()
                    user_created = True

                email_sent = send_church_credentials(church, password, user)

            return Response({
                "status": "success",
                "message": "Subscription marked as paid. Church activated.",
                "data": {
                    "subscription_id": subscription.id,
                    "church_id": church.id,
                    "church_name": church.name,
                    "credentials_sent": email_sent,
                    "username": user.username,
                    "user_created": user_created,
                }
            }, status=status.HTTP_200_OK)

        except ChurchSubscription.DoesNotExist:
            return Response(
                {"error": "Subscription not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error marking subscription {pk} as paid: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to mark subscription as paid: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubscriptionActivateAPIView(APIView):
    """Activate a subscription"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = ChurchSubscription.objects.select_related('church').get(pk=pk)

            if subscription.is_active:
                return Response({
                    "error": "Subscription is already active"
                }, status=status.HTTP_400_BAD_REQUEST)

            church = subscription.church

            with transaction.atomic():
                subscription.is_active = True
                subscription.payment_status = 'PAID'
                subscription.save()

                church.is_active = True
                church.save()

            return Response({
                "status": "success",
                "message": f"Subscription activated for {church.name}"
            }, status=status.HTTP_200_OK)

        except ChurchSubscription.DoesNotExist:
            return Response(
                {"error": "Subscription not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error activating subscription {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to activate subscription: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from accounts.models import User
class SubscriptionCancelAPIView(APIView):
    """Cancel a subscription"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = ChurchSubscription.objects.select_related('church').get(pk=pk)
            church = subscription.church

            with transaction.atomic():
                subscription.is_active = False
                subscription.payment_status = 'EXPIRED'
                subscription.save()

                church.is_active = False
                church.save()

                # Lock out the login as well
                User.objects.filter(church=church).update(is_active=False)

            return Response({
                "status": "success",
                "message": f"Subscription cancelled for {church.name}"
            }, status=status.HTTP_200_OK)

        except ChurchSubscription.DoesNotExist:
            return Response(
                {"error": "Subscription not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error cancelling subscription {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to cancel subscription: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============ TAX TYPE VIEWS ============

class TaxTypeListAPIView(APIView):
    """List all tax types"""
    permission_classes = [IsAuthenticated, IsAdminUser]
 
    def get(self, request):
        try:
            tax_types = TaxType.objects.all().order_by('tax_type_code')
 
            data = []
            for tax_type in tax_types:
                tax_rate_count = TaxRate.objects.filter(
                    tax_type=tax_type, is_active=True
                ).count()
 
                # 🔥 payments (bills) that use this tax type
                payment_count = Bill.objects.filter(tax_type=tax_type).count()
 
                data.append({
                    'id': tax_type.id,
                    'tax_type_code': tax_type.tax_type_code,
                    'tax_type_name': tax_type.tax_type_name,
                    'country': tax_type.country.code if tax_type.country else None,
                    'country_name': tax_type.country.name if tax_type.country else None,
                    'is_active': tax_type.is_active,
                    'description': tax_type.description,
                    'tax_rate_count': tax_rate_count,
                    'payment_count': payment_count,   # 🔥 used by "Payments Using Type"
                    'created_at': tax_type.created_at,
                    'updated_at': tax_type.updated_at,
                })
 
            return Response({
                "status": "success",
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)
 
        except Exception as e:
            logger.error(f"Error fetching tax types: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch tax types: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TaxTypeCreateAPIView(APIView):
    """Create a new tax type"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            tax_type_code = request.data.get('tax_type_code', '').strip().upper()
            tax_type_name = request.data.get('tax_type_name', '').strip()

            if not tax_type_code:
                return Response({
                    "error": "Tax type code is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not tax_type_name:
                return Response({
                    "error": "Tax type name is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if TaxType.objects.filter(tax_type_code=tax_type_code).exists():
                return Response({
                    "error": f"Tax type with code '{tax_type_code}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)

            tax_type = TaxType.objects.create(
                tax_type_code=tax_type_code,
                tax_type_name=tax_type_name,
                country=request.data.get('country'),
                is_active=request.data.get('is_active', True),
                description=request.data.get('description', ''),
            )

            return Response({
                "status": "success",
                "message": "Tax type created successfully",
                "data": {
                    'id': tax_type.id,
                    'tax_type_code': tax_type.tax_type_code,
                    'tax_type_name': tax_type.tax_type_name,
                    'country': tax_type.country.code if tax_type.country else None,
                    'country_name': tax_type.country.name if tax_type.country else None,
                    'is_active': tax_type.is_active,
                    'description': tax_type.description,
                    'created_at': tax_type.created_at,
                    'updated_at': tax_type.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating tax type: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class TaxTypeDetailAPIView(APIView):
    """Get, update, delete tax type"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            tax_type = TaxType.objects.get(pk=pk)

            return Response({
                "status": "success",
                "data": {
                    'id': tax_type.id,
                    'tax_type_code': tax_type.tax_type_code,
                    'tax_type_name': tax_type.tax_type_name,
                    'country': tax_type.country.code if tax_type.country else None,
                    'country_name': tax_type.country.name if tax_type.country else None,
                    'is_active': tax_type.is_active,
                    'description': tax_type.description,
                    'created_at': tax_type.created_at,
                    'updated_at': tax_type.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except TaxType.DoesNotExist:
            return Response({
                "error": "Tax type not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching tax type {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, pk):
        """Partial update tax type"""
        try:
            tax_type = TaxType.objects.get(pk=pk)

            if 'tax_type_code' in request.data:
                tax_type_code = request.data.get('tax_type_code', '').strip().upper()
                if not tax_type_code:
                    return Response({
                        "error": "Tax type code cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                if TaxType.objects.filter(tax_type_code=tax_type_code).exclude(pk=pk).exists():
                    return Response({
                        "error": f"Tax type with code '{tax_type_code}' already exists"
                    }, status=status.HTTP_400_BAD_REQUEST)
                tax_type.tax_type_code = tax_type_code

            if 'tax_type_name' in request.data:
                tax_type_name = request.data.get('tax_type_name', '').strip()
                if not tax_type_name:
                    return Response({
                        "error": "Tax type name cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                tax_type.tax_type_name = tax_type_name

            if 'country' in request.data:
                tax_type.country = request.data.get('country')

            if 'is_active' in request.data:
                tax_type.is_active = request.data['is_active']

            if 'description' in request.data:
                tax_type.description = request.data.get('description', '')

            tax_type.save()

            return Response({
                "status": "success",
                "message": "Tax type updated successfully",
                "data": {
                    'id': tax_type.id,
                    'tax_type_code': tax_type.tax_type_code,
                    'tax_type_name': tax_type.tax_type_name,
                    'country': tax_type.country.code if tax_type.country else None,
                    'country_name': tax_type.country.name if tax_type.country else None,
                    'is_active': tax_type.is_active,
                    'description': tax_type.description,
                    'created_at': tax_type.created_at,
                    'updated_at': tax_type.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except TaxType.DoesNotExist:
            return Response({
                "error": "Tax type not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating tax type {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete tax type"""
        try:
            tax_type = TaxType.objects.get(pk=pk)

            if tax_type.tax_rates.exists():
                return Response({
                    "error": (
                        f"Cannot delete tax type '{tax_type.tax_type_code}' "
                        f"because it has associated tax rates"
                    )
                }, status=status.HTTP_400_BAD_REQUEST)

            tax_type_code = tax_type.tax_type_code
            tax_type.delete()

            return Response({
                "status": "success",
                "message": f"Tax type '{tax_type_code}' deleted successfully"
            }, status=status.HTTP_200_OK)

        except TaxType.DoesNotExist:
            return Response({
                "error": "Tax type not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting tax type {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ============ TAX RATE VIEWS ============

class TaxRateListAPIView(APIView):
    """List all tax rates"""
    permission_classes = [IsAuthenticated, IsAdminUser]
 
    def get(self, request):
        try:
            tax_rates = TaxRate.objects.select_related('tax_type').all().order_by('-created_at')
 
            data = []
            for rate in tax_rates:
                try:
                    is_effective = rate.is_effective()
                except Exception:
                    is_effective = False
 
                # 🔥 payments (bills) that use this tax rate
                payment_count = Bill.objects.filter(tax_rate=rate).count()
 
                data.append({
                    'id': rate.id,
                    'tax_rate_code': rate.tax_rate_code,
                    'tax_rate_name': rate.tax_rate_name,
                    'tax_type_id': rate.tax_type.id,
                    'tax_type_name': rate.tax_type.tax_type_name,
                    'tax_type_code': rate.tax_type.tax_type_code,
                    'rate_percentage': float(rate.rate_percentage),
                    'effective_from': rate.effective_from,
                    'effective_until': rate.effective_until,
                    'is_active': rate.is_active,
                    'is_effective': is_effective,
                    'description': rate.description,
                    'payment_count': payment_count,   # 🔥 used by "Payments Using Rate"
                    'created_at': rate.created_at,
                    'updated_at': rate.updated_at,
                })
 
            return Response({
                "status": "success",
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)
 
        except Exception as e:
            logger.error(f"Error fetching tax rates: {str(e)}", exc_info=True)
            return Response({
                "error": f"Failed to fetch tax rates: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaxRateCreateAPIView(APIView):
    """Create a new tax rate"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            tax_rate_code = request.data.get('tax_rate_code', '').strip().upper()
            tax_rate_name = request.data.get('tax_rate_name', '').strip()

            tax_type_id = request.data.get('tax_type_id')
            if tax_type_id:
                try:
                    tax_type_id = int(tax_type_id)
                except (ValueError, TypeError):
                    return Response({
                        "error": "Invalid tax type ID"
                    }, status=status.HTTP_400_BAD_REQUEST)

            rate_percentage = request.data.get('rate_percentage')
            effective_from = request.data.get('effective_from')
            effective_until = request.data.get('effective_until')
            is_active = request.data.get('is_active', True)
            description = request.data.get('description', '')

            logger.info(f"Creating tax rate with data: {request.data}")

            if not tax_rate_code:
                return Response({
                    "error": "Tax rate code is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not tax_rate_name:
                return Response({
                    "error": "Tax rate name is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not tax_type_id:
                return Response({
                    "error": "Tax type is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if rate_percentage is None or rate_percentage == '':
                return Response({
                    "error": "Rate percentage is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                rate_percentage = float(rate_percentage)
                if rate_percentage < 0:
                    return Response({
                        "error": "Rate percentage cannot be negative"
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({
                    "error": "Invalid rate percentage"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not effective_from:
                return Response({
                    "error": "Effective from date is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                tax_type = TaxType.objects.get(id=tax_type_id)
            except TaxType.DoesNotExist:
                return Response({
                    "error": f"Tax type with ID {tax_type_id} not found"
                }, status=status.HTTP_404_NOT_FOUND)

            if TaxRate.objects.filter(tax_rate_code=tax_rate_code).exists():
                return Response({
                    "error": f"Tax rate with code '{tax_rate_code}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)

            tax_rate = TaxRate.objects.create(
                tax_rate_code=tax_rate_code,
                tax_rate_name=tax_rate_name,
                tax_type=tax_type,
                rate_percentage=rate_percentage,
                effective_from=effective_from,
                effective_until=effective_until if effective_until else None,
                is_active=is_active,
                description=description,
            )

            return Response({
                "status": "success",
                "message": "Tax rate created successfully",
                "data": {
                    'id': tax_rate.id,
                    'tax_rate_code': tax_rate.tax_rate_code,
                    'tax_rate_name': tax_rate.tax_rate_name,
                    'tax_type_id': tax_type.id,
                    'tax_type_name': tax_type.tax_type_name,
                    'rate_percentage': float(tax_rate.rate_percentage),
                    'effective_from': tax_rate.effective_from,
                    'effective_until': tax_rate.effective_until,
                    'is_active': tax_rate.is_active,
                    'is_effective': tax_rate.is_effective(),
                    'description': tax_rate.description,
                    'created_at': tax_rate.created_at,
                    'updated_at': tax_rate.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating tax rate: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class TaxRateDetailAPIView(APIView):
    """Get, update, delete tax rate"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            tax_rate = TaxRate.objects.select_related('tax_type').get(pk=pk)

            return Response({
                "status": "success",
                "data": {
                    'id': tax_rate.id,
                    'tax_rate_code': tax_rate.tax_rate_code,
                    'tax_rate_name': tax_rate.tax_rate_name,
                    'tax_type_id': tax_rate.tax_type.id,
                    'tax_type_name': tax_rate.tax_type.tax_type_name,
                    'tax_type_code': tax_rate.tax_type.tax_type_code,
                    'rate_percentage': float(tax_rate.rate_percentage),
                    'effective_from': tax_rate.effective_from,
                    'effective_until': tax_rate.effective_until,
                    'is_active': tax_rate.is_active,
                    'is_effective': tax_rate.is_effective(),
                    'description': tax_rate.description,
                    'created_at': tax_rate.created_at,
                    'updated_at': tax_rate.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except TaxRate.DoesNotExist:
            return Response({
                "error": "Tax rate not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching tax rate {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, pk):
        """Partial update tax rate"""
        try:
            tax_rate = TaxRate.objects.select_related('tax_type').get(pk=pk)

            if 'tax_rate_code' in request.data:
                tax_rate_code = request.data.get('tax_rate_code', '').strip().upper()
                if not tax_rate_code:
                    return Response({
                        "error": "Tax rate code cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                if TaxRate.objects.filter(tax_rate_code=tax_rate_code).exclude(pk=pk).exists():
                    return Response({
                        "error": f"Tax rate with code '{tax_rate_code}' already exists"
                    }, status=status.HTTP_400_BAD_REQUEST)
                tax_rate.tax_rate_code = tax_rate_code

            if 'tax_rate_name' in request.data:
                tax_rate_name = request.data.get('tax_rate_name', '').strip()
                if not tax_rate_name:
                    return Response({
                        "error": "Tax rate name cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                tax_rate.tax_rate_name = tax_rate_name

            if 'tax_type_id' in request.data:
                try:
                    tax_type = TaxType.objects.get(id=request.data['tax_type_id'])
                    tax_rate.tax_type = tax_type
                except TaxType.DoesNotExist:
                    return Response({
                        "error": "Tax type not found"
                    }, status=status.HTTP_404_NOT_FOUND)

            if 'rate_percentage' in request.data:
                try:
                    rate_percentage = float(request.data['rate_percentage'])
                    if rate_percentage < 0:
                        return Response({
                            "error": "Rate percentage cannot be negative"
                        }, status=status.HTTP_400_BAD_REQUEST)
                    tax_rate.rate_percentage = rate_percentage
                except (ValueError, TypeError):
                    return Response({
                        "error": "Invalid rate percentage"
                    }, status=status.HTTP_400_BAD_REQUEST)

            if 'effective_from' in request.data:
                tax_rate.effective_from = request.data['effective_from']

            if 'effective_until' in request.data:
                tax_rate.effective_until = request.data['effective_until']

            if 'is_active' in request.data:
                tax_rate.is_active = request.data['is_active']

            if 'description' in request.data:
                tax_rate.description = request.data.get('description', '')

            tax_rate.save()

            return Response({
                "status": "success",
                "message": "Tax rate updated successfully",
                "data": {
                    'id': tax_rate.id,
                    'tax_rate_code': tax_rate.tax_rate_code,
                    'tax_rate_name': tax_rate.tax_rate_name,
                    'tax_type_id': tax_rate.tax_type.id,
                    'tax_type_name': tax_rate.tax_type.tax_type_name,
                    'rate_percentage': float(tax_rate.rate_percentage),
                    'effective_from': tax_rate.effective_from,
                    'effective_until': tax_rate.effective_until,
                    'is_active': tax_rate.is_active,
                    'is_effective': tax_rate.is_effective(),
                    'description': tax_rate.description,
                    'created_at': tax_rate.created_at,
                    'updated_at': tax_rate.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except TaxRate.DoesNotExist:
            return Response({
                "error": "Tax rate not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating tax rate {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete tax rate"""
        try:
            tax_rate = TaxRate.objects.get(pk=pk)
            tax_rate_code = tax_rate.tax_rate_code
            tax_rate.delete()

            return Response({
                "status": "success",
                "message": f"Tax rate '{tax_rate_code}' deleted successfully"
            }, status=status.HTTP_200_OK)

        except TaxRate.DoesNotExist:
            return Response({
                "error": "Tax rate not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting tax rate {pk}: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ============ BILL (PAYMENT) VIEWS ============

# adminpanel/views_api.py - Update BillListAPIView to support church filtering

class BillListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            bills = Bill.objects.select_related(
                'church', 'subscription__package'
            ).order_by('-created_at')
            
            # Add church filtering
            church_id = request.query_params.get('church')
            if church_id:
                try:
                    bills = bills.filter(church_id=church_id)
                except ValueError:
                    return Response(
                        {"error": "Invalid church ID"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            data = []
            for bill in bills:
                package_name = None
                if bill.subscription and bill.subscription.package:
                    package_name = bill.subscription.package.name
                elif bill.breakdown and bill.breakdown.get('package_name'):
                    package_name = bill.breakdown.get('package_name')

                data.append({
                    'id': bill.id,
                    'bill_number': bill.bill_number,
                    'invoice_number': bill.invoice_number,
                    'church_id': bill.church.id if bill.church else None,
                    'church_name': bill.church.name if bill.church else None,
                    'package_name': package_name,
                    'subscription_id': bill.subscription.id if bill.subscription else None,
                    'bill_type': bill.bill_type,
                    'amount': float(bill.amount),
                    'billing_cycle': bill.billing_cycle,
                    'duration_months': bill.duration_months,
                    'payment_method': bill.payment_method,
                    'transaction_id': bill.transaction_id,
                    'note': bill.note,
                    'tax_percentage': float(bill.tax_percentage),
                    'tax_amount': float(bill.tax_amount),
                    'total_amount': float(bill.total_amount),
                    'status': bill.status,
                    'created_at': bill.created_at,
                    'paid_at': bill.paid_at,
                    'breakdown': bill.breakdown,
                })

            return Response({
                "status": "success",
                "count": len(data),
                "data": data  # For admin panel, use 'data' key
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching bills: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch bills: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from decimal import Decimal, InvalidOperation

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# Keep your existing imports for:
# Church
# ChurchSubscription
# Bill
# TaxType
# TaxRate
# IsAdminUser
# logger


class BillCreateAPIView(APIView):
    """
    Create a new bill.

    Supports:
    - JSON requests
    - multipart/form-data requests
    - payment_receipt image upload

    IMPORTANT:
    - ChurchSubscription calculates the PRE-TAX subscription amount.
    - Bill selects the tax.
    - Bill.save() calculates tax_amount and total_amount.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def post(self, request):

        try:
            # ============================================================
            # REQUEST DATA
            # ============================================================

            church_id = request.data.get(
                'church_id'
            )

            subscription_id = request.data.get(
                'subscription_id'
            )

            bill_type = request.data.get(
                'bill_type',
                'NEW'
            )

            billing_cycle = request.data.get(
                'billing_cycle'
            )

            duration_months = request.data.get(
                'duration_months'
            )

            # Amount can be supplied by frontend for verification,
            # but the backend calculates the real amount.
            requested_amount = request.data.get(
                'amount'
            )

            payment_method = request.data.get(
                'payment_method',
                'CASH'
            )

            transaction_id = request.data.get(
                'transaction_id'
            )

            note = request.data.get(
                'note'
            )

            # ============================================================
            # PAYMENT RECEIPT
            # ============================================================

            # Existing Bill.payment_receipt ImageField.
            #
            # For multipart/form-data this comes from request.FILES.
            # For normal JSON requests this will simply be None.
            payment_receipt = request.FILES.get(
                'payment_receipt'
            )

            tax_type_id = request.data.get(
                'tax_type_id'
            )

            tax_rate_id = request.data.get(
                'tax_rate_id'
            )

            # ============================================================
            # BASIC VALIDATION
            # ============================================================

            if not church_id:
                return Response(
                    {
                        "error": "church_id is required"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not subscription_id:
                return Response(
                    {
                        "error": "subscription_id is required"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if bill_type not in [
                'NEW',
                'UPGRADE',
                'EXTENSION',
                'RENEW'
            ]:
                return Response(
                    {
                        "error": "Invalid bill_type"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ============================================================
            # GET CHURCH
            # ============================================================

            try:
                church = Church.objects.get(
                    id=church_id,
                    is_deleted=False
                )

            except Church.DoesNotExist:
                return Response(
                    {
                        "error": "Church not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # ============================================================
            # GET SUBSCRIPTION
            # ============================================================

            try:
                subscription = (
                    ChurchSubscription.objects
                    .select_related('package')
                    .get(id=subscription_id)
                )

            except ChurchSubscription.DoesNotExist:
                return Response(
                    {
                        "error": "Subscription not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # ============================================================
            # VERIFY SUBSCRIPTION BELONGS TO CHURCH
            # ============================================================

            if subscription.church_id != church.id:
                return Response(
                    {
                        "error": (
                            "Subscription does not belong "
                            "to the selected church"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ============================================================
            # BILLING DETAILS
            # ============================================================

            # If billing_cycle was not supplied,
            # use subscription billing cycle.
            if not billing_cycle:
                billing_cycle = subscription.billing_cycle

            if billing_cycle not in [
                'MONTHLY',
                'YEARLY'
            ]:
                return Response(
                    {
                        "error": "Invalid billing_cycle"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # If duration was not supplied,
            # use subscription duration.
            if duration_months is None:
                duration_months = subscription.duration_months

            # ============================================================
            # CALCULATE PRE-TAX AMOUNT
            # ============================================================

            amount = Decimal('0')

            # ------------------------------------------------------------
            # NEW SUBSCRIPTION
            # ------------------------------------------------------------

            if bill_type == 'NEW':

                amount = Decimal(
                    subscription.get_total_price()
                )

            # ------------------------------------------------------------
            # RENEWAL
            # ------------------------------------------------------------

            elif bill_type == 'RENEW':

                amount = Decimal(
                    subscription.get_total_price()
                )

            # ------------------------------------------------------------
            # EXTENSION
            # ------------------------------------------------------------

            elif bill_type == 'EXTENSION':

                # Currently uses subscription price.
                amount = Decimal(
                    subscription.get_total_price()
                )

            # ------------------------------------------------------------
            # UPGRADE
            # ------------------------------------------------------------

            elif bill_type == 'UPGRADE':

                # For an upgrade, frontend must send
                # the new package ID.
                new_package_id = request.data.get(
                    'new_package_id'
                )

                if not new_package_id:
                    return Response(
                        {
                            "error": (
                                "new_package_id is required "
                                "for upgrade"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    new_package = Package.objects.get(
                        id=new_package_id
                    )

                except Package.DoesNotExist:
                    return Response(
                        {
                            "error": "New package not found"
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Calculate upgrade price.
                upgrade_data = (
                    subscription.calculate_upgrade_cost(
                        new_package=new_package,
                        new_billing_cycle=billing_cycle
                    )
                )

                amount = Decimal(
                    str(
                        upgrade_data['final_amount']
                    )
                )

            # ============================================================
            # AMOUNT VALIDATION
            # ============================================================

            if amount < 0:
                amount = Decimal('0')

            # Frontend amount is only verified.
            # Backend calculated amount remains authoritative.
            if requested_amount is not None:

                try:
                    requested_amount_decimal = Decimal(
                        str(requested_amount)
                    )

                    if requested_amount_decimal != amount:

                        return Response(
                            {
                                "error": "Amount mismatch",
                                "message": (
                                    "The submitted amount does not "
                                    "match the calculated subscription amount."
                                ),
                                "calculated_amount": float(
                                    amount
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                except (
                    InvalidOperation,
                    ValueError
                ):
                    return Response(
                        {
                            "error": "Invalid amount"
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ============================================================
            # TAX
            # ============================================================

            tax_type = None
            tax_rate = None

            # ------------------------------------------------------------
            # TAX TYPE
            # ------------------------------------------------------------

            if tax_type_id:

                try:
                    tax_type = TaxType.objects.get(
                        id=tax_type_id
                    )

                except TaxType.DoesNotExist:
                    return Response(
                        {
                            "error": "Tax type not found"
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

            # ------------------------------------------------------------
            # TAX RATE
            # ------------------------------------------------------------

            if tax_rate_id:

                try:
                    tax_rate = TaxRate.objects.get(
                        id=tax_rate_id
                    )

                except TaxRate.DoesNotExist:
                    return Response(
                        {
                            "error": "Tax rate not found"
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

            # ------------------------------------------------------------
            # REQUIRE TAX TYPE AND RATE TOGETHER
            # ------------------------------------------------------------

            if tax_type and not tax_rate:
                return Response(
                    {
                        "error": (
                            "tax_rate_id is required when "
                            "tax_type_id is supplied"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if tax_rate and not tax_type:
                return Response(
                    {
                        "error": (
                            "tax_type_id is required when "
                            "tax_rate_id is supplied"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ------------------------------------------------------------
            # VERIFY TAX RATE BELONGS TO TAX TYPE
            # ------------------------------------------------------------

            if tax_rate and tax_type:

                if tax_rate.tax_type_id != tax_type.id:

                    return Response(
                        {
                            "error": (
                                "Selected tax rate does not belong "
                                "to the selected tax type"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ============================================================
            # PAYMENT RECEIPT VALIDATION
            # ============================================================

            if payment_receipt:

                # Allow only image files.
                content_type = getattr(
                    payment_receipt,
                    'content_type',
                    ''
                )

                allowed_types = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp',
                ]

                if content_type not in allowed_types:
                    return Response(
                        {
                            "error": (
                                "Invalid payment receipt. "
                                "Only JPG, JPEG, PNG and WEBP "
                                "images are allowed."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Maximum 5 MB.
                max_size = 5 * 1024 * 1024

                if payment_receipt.size > max_size:
                    return Response(
                        {
                            "error": (
                                "Payment receipt image must "
                                "be 5 MB or smaller."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ============================================================
            # BREAKDOWN
            # ============================================================

            breakdown = {
                'church_name': church.name,

                'package_name': (
                    subscription.package.name
                    if subscription.package
                    else None
                ),

                'billing_cycle': billing_cycle,

                'duration_months': duration_months,

                # PRE-TAX AMOUNT
                'amount': float(amount),

                'payment_method': payment_method,

                'transaction_id': transaction_id,

                'bill_type': bill_type,

                # Tax snapshot information
                'tax_type_id': (
                    tax_type.id
                    if tax_type
                    else None
                ),

                'tax_type_name': (
                    str(tax_type)
                    if tax_type
                    else None
                ),

                'tax_rate_id': (
                    tax_rate.id
                    if tax_rate
                    else None
                ),

                'tax_percentage': (
                    float(
                        tax_rate.rate_percentage
                    )
                    if tax_rate
                    else 0
                ),
            }

            # ============================================================
            # CREATE BILL
            # ============================================================

            bill = Bill.objects.create(
                church=church,

                subscription=subscription,

                bill_type=bill_type,

                billing_cycle=billing_cycle,

                duration_months=duration_months,

                # IMPORTANT:
                # This is BEFORE TAX.
                amount=amount,

                payment_method=payment_method,

                transaction_id=transaction_id,

                note=note,

                # EXISTING IMAGE FIELD
                payment_receipt=payment_receipt,

                tax_type=tax_type,

                tax_rate=tax_rate,

                status='UNPAID',

                breakdown=breakdown
            )

            # ============================================================
            # PAYMENT RECEIPT URL
            # ============================================================

            payment_receipt_url = None

            if bill.payment_receipt:

                try:
                    payment_receipt_url = (
                        request.build_absolute_uri(
                            bill.payment_receipt.url
                        )
                    )

                except Exception:
                    payment_receipt_url = None

            # ============================================================
            # RESPONSE
            # ============================================================

            return Response(
                {
                    "status": "success",

                    "message": (
                        "Bill created successfully"
                    ),

                    "data": {
                        'id': bill.id,

                        'bill_number': bill.bill_number,

                        'invoice_number': bill.invoice_number,

                        'church_id': (
                            church.id
                        ),

                        'church_name': (
                            church.name
                        ),

                        'subscription_id': (
                            subscription.id
                        ),

                        'package_name': (
                            subscription.package.name
                            if subscription.package
                            else None
                        ),

                        'bill_type': (
                            bill.bill_type
                        ),

                        'billing_cycle': (
                            bill.billing_cycle
                        ),

                        'duration_months': (
                            bill.duration_months
                        ),

                        # BEFORE TAX
                        'amount': float(
                            bill.amount
                        ),

                        # SELECTED TAX
                        'tax_type': (
                            str(bill.tax_type)
                            if bill.tax_type
                            else None
                        ),

                        'tax_rate': (
                            str(bill.tax_rate)
                            if bill.tax_rate
                            else None
                        ),

                        'tax_percentage': float(
                            bill.tax_percentage
                        ),

                        'tax_amount': float(
                            bill.tax_amount
                        ),

                        # FINAL AMOUNT INCLUDING TAX
                        'total_amount': float(
                            bill.total_amount
                        ),

                        'status': (
                            bill.status
                        ),

                        'payment_method': (
                            bill.payment_method
                        ),

                        'transaction_id': (
                            bill.transaction_id
                        ),

                        # PAYMENT RECEIPT
                        'payment_receipt': (
                            payment_receipt_url
                        ),

                        'created_at': (
                            bill.created_at
                        ),
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            logger.error(
                f"Error creating bill: {str(e)}",
                exc_info=True
            )

            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

class BillDetailAPIView(APIView):
    """Get bill details"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            bill = (
                Bill.objects
                .select_related(
                    'church',
                    'subscription',
                    'subscription__package',
                    'tax_type',
                    'tax_rate',
                )
                .get(pk=pk)
            )

            church = bill.church
            sub = bill.subscription
            package = sub.package if sub else None

            # ---------------------------------------------------------
            # PAYMENT RECEIPT (screenshot) — may or may not exist
            # ---------------------------------------------------------
            receipt_url = None
            if bill.payment_receipt:
                try:
                    receipt_url = request.build_absolute_uri(
                        bill.payment_receipt.url
                    )
                except Exception:
                    receipt_url = None

            receipt_name = None
            receipt_size = None
            if bill.payment_receipt:
                try:
                    receipt_name = bill.payment_receipt.name.split('/')[-1]
                except Exception:
                    receipt_name = None
                try:
                    receipt_size = f"{bill.payment_receipt.size / 1024:.1f} KB"
                except Exception:
                    receipt_size = None

            # ---------------------------------------------------------
            # BILLING PERIOD (from subscription)
            # ---------------------------------------------------------
            billing_start = sub.start_date if sub else None
            billing_end = sub.end_date if sub else None

            # ---------------------------------------------------------
            # BILLING CYCLE DISPLAY
            # ---------------------------------------------------------
            if bill.billing_cycle == 'YEARLY':
                cycle_display = 'Yearly'
            elif bill.billing_cycle == 'MONTHLY':
                cycle_display = 'Monthly'
            else:
                cycle_display = bill.billing_cycle

            # ---------------------------------------------------------
            # CAPACITY & RATE
            # get_capacity() prefers custom_capacity → locked_capacity
            # → live package.member_limit
            # get_rate()    prefers locked_rate → live package rate
            # ---------------------------------------------------------
            capacity = None
            rate_used = 0
            rate_monthly = 0
            rate_yearly = 0

            if sub:
                try:
                    capacity = sub.get_capacity()
                except Exception:
                    capacity = None

                try:
                    rate_used = float(sub.get_rate()) if sub.get_rate() else 0
                except Exception:
                    rate_used = 0

            if package:
                rate_monthly = (
                    float(package.rate_per_member_monthly)
                    if package.rate_per_member_monthly else 0
                )
                rate_yearly = (
                    float(package.rate_per_member_yearly)
                    if package.rate_per_member_yearly else 0
                )

            # ---------------------------------------------------------
            # PAYLOAD
            # ---------------------------------------------------------
            data = {
                'id': bill.id,
                'bill_number': bill.bill_number,
                'invoice_number': bill.invoice_number,

                # ---------- Church ----------
                'church_id': church.id if church else None,
                'church_name': church.name if church else None,
                'church_code': church.code if church else None,
                'church_email': church.email if church else None,

                # ---------- Subscription / Package ----------
                'subscription_id': sub.id if sub else None,
                'subscription_code': (
                    f"SUB-{str(sub.id).zfill(4)}" if sub else None
                ),
                'package_id': package.id if package else None,
                'package_name': package.name if package else None,
                'package_code': package.code if package else None,

                # ---------- Billing ----------
                'bill_type': bill.bill_type,
                'billing_cycle': bill.billing_cycle,
                'billing_cycle_display': cycle_display,
                'duration_months': bill.duration_months,
                'billing_start': billing_start,
                'billing_end': billing_end,

                # ---------- Capacity & Rate ----------
                'member_limit': capacity,
                'capacity': capacity,
                'rate_used': rate_used,
                'rate_per_member_monthly': rate_monthly,
                'rate_per_member_yearly': rate_yearly,

                # ---------- Amounts ----------
                'amount': float(bill.amount),
                'taxable_amount': float(bill.amount),   # alias (pre-tax)
                'tax_percentage': float(bill.tax_percentage),
                'tax_amount': float(bill.tax_amount),
                'total_amount': float(bill.total_amount),

                # ---------- Tax objects ----------
                'tax_type': {
                    'id': bill.tax_type.id,
                    'tax_type_code': bill.tax_type.tax_type_code,
                    'tax_type_name': bill.tax_type.tax_type_name,
                } if bill.tax_type else None,

                'tax_rate': {
                    'id': bill.tax_rate.id,
                    'tax_rate_code': bill.tax_rate.tax_rate_code,
                    'tax_rate_name': bill.tax_rate.tax_rate_name,
                    'rate_percentage': float(bill.tax_rate.rate_percentage),
                } if bill.tax_rate else None,

                # ---------- Payment ----------
                'payment_method': bill.payment_method,
                'transaction_id': bill.transaction_id,
                'note': bill.note,
                'status': bill.status,

                # ---------- Payment Receipt (screenshot) ----------
                'payment_receipt': receipt_url,
                'payment_receipt_url': receipt_url,
                'payment_receipt_name': receipt_name,
                'payment_receipt_size': receipt_size,
                'has_payment_receipt': bool(receipt_url),

                # ---------- Timestamps ----------
                'created_at': bill.created_at,
                'paid_at': bill.paid_at,

                # ---------- Breakdown ----------
                'breakdown': bill.breakdown,
            }

            return Response({
                "status": "success",
                "data": data
            }, status=status.HTTP_200_OK)

        except Bill.DoesNotExist:
            return Response(
                {"error": "Bill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching bill {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch bill: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BillMarkPaidAPIView(APIView):
    """Mark bill as paid"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            bill = Bill.objects.select_related('church', 'subscription').get(pk=pk)

            if bill.status == 'PAID':
                return Response({
                    "error": "Bill is already paid"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Non-activating bill types: just mark paid and return
            if not (bill.bill_type == 'NEW' and bill.subscription):
                bill.status = 'PAID'
                bill.paid_at = timezone.now()
                bill.save()

                return Response({
                    "status": "success",
                    "message": f"Bill #{bill.bill_number} marked as paid.",
                    "data": {
                        "bill_id": bill.id,
                        "bill_number": bill.bill_number,
                        "paid_at": bill.paid_at,
                    }
                }, status=status.HTTP_200_OK)

            church = bill.church
            subscription = bill.subscription

            # 🔥 FIX 5: the whole activation — bill, subscription, church, user
            # password reset and credential email — must be atomic. Previously
            # a failure partway through left the password rotated but never
            # delivered, locking the church out of its own account.
            with transaction.atomic():
                bill.status = 'PAID'
                bill.paid_at = timezone.now()
                bill.save()

                subscription.payment_status = 'PAID'
                subscription.is_active = True
                subscription.save()

                # 🌱 Ensure the church has the default relationship set.
                #    Uses get_or_create under the hood, so it's safe to
                #    call repeatedly without creating duplicates.
                seed_default_relationships(church)

                church.is_active = True
                church.save()

                user = User.objects.filter(email=church.email).first()
                password = generate_random_password()

                if user:
                    user.is_active = True
                    user.role = 'CHURCH'
                    user.church = church
                    user.set_password(password)
                    user.save()
                    user_created = False
                else:
                    user = User.objects.create(
                        username=church.email,
                        email=church.email,
                        church=church,
                        role='CHURCH',
                        is_active=True,
                    )
                    user.set_password(password)
                    user.save()
                    user_created = True

                email_sent = send_church_credentials(church, password, user)

            return Response({
                "status": "success",
                "message": f"Bill #{bill.bill_number} marked as paid. Church activated.",
                "data": {
                    "bill_id": bill.id,
                    "bill_number": bill.bill_number,
                    "church_id": church.id,
                    "church_name": church.name,
                    "church_email": church.email,
                    "paid_at": bill.paid_at,
                    "credentials_sent": email_sent,
                    "username": user.username,
                    "user_created": user_created,
                }
            }, status=status.HTTP_200_OK)

        except Bill.DoesNotExist:
            return Response(
                {"error": "Bill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error marking bill {pk} as paid: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to mark bill as paid: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm


class BillReceiptPDFAPIView(APIView):
    """
    Generate a PDF receipt / tax invoice for a Bill.
    Streams as attachment.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related(
                'church',
                'subscription',
                'subscription__package',
                'tax_type',
                'tax_rate',
            ).get(pk=pk)
        except Bill.DoesNotExist:
            return Response(
                {"error": "Bill not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        church = bill.church
        sub = bill.subscription
        package = sub.package if sub else None

        # -------------------------------------------------------
        # RESPONSE
        # -------------------------------------------------------
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="receipt-{bill.bill_number or bill.id}.pdf"'
        )

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        maroon = colors.HexColor("#ae2050")
        dark = colors.HexColor("#1a1a2e")
        grey = colors.HexColor("#666666")
        border = colors.HexColor("#1a1a2e")

        left = 20 * mm
        right = width - 20 * mm
        y = height - 20 * mm

        # -------------------------------------------------------
        # TITLE
        # -------------------------------------------------------
        p.setFillColor(maroon)
        p.setFont("Helvetica-Bold", 18)
        p.drawString(left, y, "Eglise")
        p.setFillColor(dark)
        p.setFont("Helvetica-Bold", 12)
        p.drawRightString(right, y, "TAX INVOICE")

        y -= 6 * mm

        p.setFont("Helvetica", 9)
        p.setFillColor(grey)
        p.drawString(left, y, "Eglise Church Management — Appzia Tec Solutions")
        p.drawRightString(right, y, "Original for Recipient")

        y -= 10 * mm

        # -------------------------------------------------------
        # META GRID (Invoice / Bill no / Dates)
        # -------------------------------------------------------
        p.setFillColor(dark)
        p.setFont("Helvetica", 9)
        p.drawString(left, y, f"Invoice No: {bill.invoice_number or '—'}")
        p.drawString(left + 80 * mm, y, f"Bill No: {bill.bill_number or '—'}")

        y -= 5 * mm
        p.drawString(
            left, y,
            f"Date: {bill.created_at.strftime('%d %b %Y') if bill.created_at else '—'}"
        )
        p.drawString(
            left + 80 * mm, y,
            f"Status: {bill.status}"
        )

        y -= 5 * mm
        p.drawString(
            left, y,
            f"Mode of Payment: {bill.payment_method or '—'}"
        )
        p.drawString(
            left + 80 * mm, y,
            f"Reference: {bill.transaction_id or '—'}"
        )

        y -= 5 * mm
        p.drawString(
            left, y,
            f"Billing Cycle: {bill.billing_cycle or '—'}"
        )
        if sub:
            p.drawString(
                left + 80 * mm, y,
                f"Period: {sub.start_date or '—'} to {sub.end_date or '—'}"
            )

        y -= 10 * mm

        # -------------------------------------------------------
        # BUYER BLOCK
        # -------------------------------------------------------
        p.setFont("Helvetica-Bold", 10)
        p.setFillColor(dark)
        p.drawString(left, y, "Bill To")
        y -= 5 * mm

        p.setFont("Helvetica-Bold", 11)
        p.drawString(left, y, church.name if church else "—")
        y -= 5 * mm

        p.setFont("Helvetica", 9)
        p.setFillColor(grey)
        if church:
            p.drawString(left, y, f"Church Code: {church.code or '—'}")
            y -= 4 * mm
            if church.email:
                p.drawString(left, y, f"Email: {church.email}")
                y -= 4 * mm
            if church.city or church.state:
                addr = ", ".join(
                    filter(None, [church.city, church.state])
                )
                p.drawString(left, y, addr)
                y -= 4 * mm

        y -= 6 * mm

        # -------------------------------------------------------
        # LINE ITEMS TABLE
        # -------------------------------------------------------
        p.setFillColor(dark)
        p.setFont("Helvetica-Bold", 9)

        col_x = [left, left + 90 * mm, left + 130 * mm, right]
        p.line(col_x[0], y + 3 * mm, col_x[-1], y + 3 * mm)
        p.line(col_x[0], y - 4 * mm, col_x[-1], y - 4 * mm)

        p.drawString(col_x[0] + 1 * mm, y, "Particulars")
        p.drawRightString(col_x[1], y, "Rate")
        p.drawRightString(col_x[2], y, "Qty")
        p.drawRightString(col_x[3], y, "Amount")

        y -= 9 * mm
        p.setFont("Helvetica", 9)

        package_name = (
            package.name if package else "Subscription"
        )
        capacity = sub.get_capacity() if sub else 0
        rate = float(sub.get_rate()) if sub and sub.get_rate() else 0

        p.drawString(
            col_x[0] + 1 * mm, y,
            f"{package_name} — {bill.billing_cycle or ''} Subscription"
        )
        p.drawRightString(col_x[1], y, f"Rs. {rate:,.2f}")
        p.drawRightString(col_x[2], y, str(capacity))
        p.drawRightString(col_x[3], y, f"Rs. {float(bill.amount):,.2f}")

        y -= 5 * mm
        p.drawString(
            col_x[0] + 1 * mm, y,
            f"Tax — {bill.tax_type.tax_type_name if bill.tax_type else 'No Tax'} "
            f"@ {bill.tax_percentage}%"
        )
        p.drawRightString(col_x[3], y, f"Rs. {float(bill.tax_amount):,.2f}")

        y -= 8 * mm
        p.line(col_x[0], y + 3 * mm, col_x[-1], y + 3 * mm)

        p.setFont("Helvetica-Bold", 11)
        p.drawString(col_x[0] + 1 * mm, y - 2 * mm, "TOTAL")
        p.drawRightString(
            col_x[3], y - 2 * mm,
            f"Rs. {float(bill.total_amount):,.2f}"
        )

        y -= 15 * mm

        # -------------------------------------------------------
        # NOTES
        # -------------------------------------------------------
        if bill.note:
            p.setFont("Helvetica-Bold", 9)
            p.setFillColor(dark)
            p.drawString(left, y, "Notes")
            y -= 4 * mm
            p.setFont("Helvetica", 9)
            p.setFillColor(grey)
            # crude wrap
            words = bill.note.split()
            line = ""
            for w in words:
                if len(line + " " + w) > 90:
                    p.drawString(left, y, line)
                    y -= 4 * mm
                    line = w
                else:
                    line = (line + " " + w).strip()
            if line:
                p.drawString(left, y, line)
                y -= 4 * mm

        # -------------------------------------------------------
        # FOOTER
        # -------------------------------------------------------
        p.setFillColor(grey)
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(
            left, 15 * mm,
            "This is a computer-generated invoice. E. & O.E."
        )
        p.drawRightString(right, 15 * mm, "Page 1 of 1")

        p.showPage()
        p.save()
        return response

# ============ UPGRADE REQUEST VIEWS ============

class UpgradeRequestListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            requests = UpgradeRequest.objects.select_related(
                'church', 'current_package', 'requested_package'
            ).order_by('-created_at')

            data = []
            for req in requests:
                data.append({
                    'id': req.id,
                    'church': req.church.id,
                    'church_name': req.church.name,
                    'current_package_name': req.current_package.name,
                    'requested_package_name': req.requested_package.name,
                    'requested_capacity': req.requested_capacity,
                    'status': req.status,
                    'reason': req.reason,
                    'created_at': req.created_at.strftime('%Y-%m-%d %H:%M'),
                    'reviewed_at': req.reviewed_at.strftime('%Y-%m-%d %H:%M') if req.reviewed_at else None,
                })

            return Response({
                "status": "success",
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching upgrade requests: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch upgrade requests"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpgradeRequestApproveAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            upgrade_request = UpgradeRequest.objects.get(pk=pk, status='PENDING')

            upgrade_request.status = 'APPROVED'
            # 🔥 FIX 6: the model field is `reviewed_at`. The old code set
            # `reviewed_date` and `reviewed_by`, neither of which exists —
            # Python allowed the assignment, so it silently never saved and
            # approvals recorded no timestamp at all.
            upgrade_request.reviewed_at = timezone.now()
            upgrade_request.save(update_fields=['status', 'reviewed_at'])

            return Response({
                "status": "success",
                "message": f"Upgrade request #{upgrade_request.id} approved successfully"
            }, status=status.HTTP_200_OK)

        except UpgradeRequest.DoesNotExist:
            return Response(
                {"error": "Upgrade request not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error approving upgrade request {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to approve upgrade request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpgradeRequestRejectAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            upgrade_request = UpgradeRequest.objects.get(pk=pk, status='PENDING')

            upgrade_request.status = 'REJECTED'
            # 🔥 FIX 6: `reviewed_at` is the real field name. The rejection
            # note also has nowhere to live — the model has no `notes` field,
            # only `reason` (which holds the church's original request text).
            # Appending keeps both without a schema change.
            upgrade_request.reviewed_at = timezone.now()

            rejection_reason = request.data.get('reason')
            update_fields = ['status', 'reviewed_at']

            if rejection_reason:
                existing = upgrade_request.reason or ''
                upgrade_request.reason = (
                    f"{existing}\n\n[Admin rejection note] {rejection_reason}".strip()
                )
                update_fields.append('reason')

            upgrade_request.save(update_fields=update_fields)

            return Response({
                "status": "success",
                "message": f"Upgrade request #{upgrade_request.id} rejected successfully"
            }, status=status.HTTP_200_OK)

        except UpgradeRequest.DoesNotExist:
            return Response(
                {"error": "Upgrade request not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error rejecting upgrade request {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to reject upgrade request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PackageUpdateAPIView(PackageDetailAPIView):
    """Alias — same put/patch as PackageDetailAPIView."""
    pass


class PackageDeleteAPIView(PackageDetailAPIView):
    """Alias — same delete as PackageDetailAPIView."""
    pass