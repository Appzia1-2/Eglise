# adminpanel/views_api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUser
from registry.models import Diocese, Church, Package, ChurchSubscription, Bill, UpgradeRequest, TaxType, TaxRate
from registry.utils import send_church_credentials, generate_random_password
from accounts.models import User
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
                # 🔥 related_name is 'subscription' (see FIX 3)
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
 
                # ---- derived display status -------------------------------
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
                # -----------------------------------------------------------
 
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
 
                    # 🔥 data the Churches table / stat cards need
                    'package': package_name,          # kept for backward compatibility
                    'package_name': package_name,     # used by the table
                    'package_id': package_id,         # used by the Package filter
                    'subscription_status': subscription_status,
                    'renewal_date': renewal_date,     # subscription end date
                    'status': church_status,          # active / trial / expiring / expired / suspended
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


class ChurchDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    # 🔥 FIX 7: fields that must only be overwritten when the client actually
    # sends them. Previously PUT used request.data.get(field, '') for all of
    # these, so any form omitting a key silently blanked the stored value.
    TEXT_FIELDS = [
        'address', 'address_line1', 'city', 'state', 'postal_code',
        'phone_number', 'alternate_phone', 'registration_number',
        'currency', 'website',
    ]

    def get(self, request, pk):
        try:
            church = Church.objects.select_related('diocese').get(pk=pk, is_deleted=False)

            # 🔥 FIX 3: related_name is 'subscription', not 'churchsubscription'
            subscription = getattr(church, 'subscription', None)
            full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None

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
                    'subscription': {
                        'id': subscription.id,
                        'package': subscription.package.name if subscription.package else None,
                        'package_id': subscription.package.id if subscription.package else None,
                        'billing_cycle': subscription.billing_cycle,
                        'payment_status': subscription.payment_status,
                        'is_active': subscription.is_active,
                        'start_date': subscription.start_date,
                        'end_date': subscription.end_date,
                    } if subscription else None
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
                {"error": "Failed to fetch church"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

            # 🔥 FIX 7: only overwrite fields the client actually sent
            for field in self.TEXT_FIELDS:
                if field in request.data:
                    value = request.data.get(field)
                    setattr(church, field, (value or '').strip())

            if 'country' in request.data:
                church.country = request.data.get('country', '')

            if 'established_year' in request.data:
                church.established_year = request.data.get('established_year')

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
                church.is_active = request.data['is_active']

            church.save()

            return Response({
                "status": "success",
                "message": "Church updated successfully",
                "data": self._church_payload(church)
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

            if 'name' in request.data:
                name = request.data.get('name', '').strip()
                if not name:
                    return Response({
                        "name": "Church name cannot be empty"
                    }, status=status.HTTP_400_BAD_REQUEST)
                church.name = name

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

            for field in self.TEXT_FIELDS:
                if field in request.data:
                    value = request.data.get(field)
                    setattr(church, field, (value or '').strip())

            if 'country' in request.data:
                church.country = request.data.get('country', '')

            if 'established_year' in request.data:
                church.established_year = request.data.get('established_year')

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
                church.is_active = request.data['is_active']

            church.save()

            return Response({
                "status": "success",
                "message": "Church updated successfully",
                "data": self._church_payload(church)
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

            # 🔥 Deactivate the linked login too, otherwise the account stays
            # usable after the church is "deleted".
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

    def _church_payload(self, church):
        """Shared response body for PUT/PATCH"""
        full_address = church.get_full_address() if hasattr(church, 'get_full_address') else None
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
        }


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
                member_limit=request.data.get('member_limit'),
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

            is_in_use = package.subscriptions.filter(is_active=True).exists()
            church_count = package.subscriptions.count()

            churches = []
            for sub in package.subscriptions.select_related('church').filter(is_active=True):
                churches.append({
                    'id': sub.church.id,
                    'name': sub.church.name,
                    'email': sub.church.email,
                    'billing_cycle': sub.billing_cycle,
                    'payment_status': sub.payment_status,
                    'start_date': sub.start_date,
                    'end_date': sub.end_date,
                })

            data = {
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
                'churches': churches,
                'created_at': package.created_at,
                'updated_at': package.updated_at,
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
            logger.error(f"Error fetching package {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch package"},
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
                package.member_limit = request.data['member_limit']

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

            package.name = name
            package.member_limit = request.data.get('member_limit')
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


# 🔥 FIX 8: PackageUpdateAPIView and PackageDeleteAPIView were byte-for-byte
# duplicates of PackageDetailAPIView's put/patch/delete. They are removed here.
# Check urls.py — if any route points at them, repoint it at
# PackageDetailAPIView instead.


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

            church = Church.objects.get(id=church_id, is_deleted=False)
            package = Package.objects.get(id=package_id, is_active=True)

            existing_sub = ChurchSubscription.objects.filter(church=church).first()

            if existing_sub:
                subscription = existing_sub
                subscription.package = package
                subscription.billing_cycle = billing_cycle
                subscription.duration_months = duration_months
                subscription.start_date = timezone.now().date()
                subscription.payment_status = 'UNPAID'
                subscription.is_active = False
                # 🔥 Switching package or billing cycle is a NEW purchase, so
                # the old pricing snapshot must be discarded. Clearing these
                # makes ChurchSubscription.save() re-capture the current
                # package's rate, capacity and name.
                subscription.locked_rate = None
                subscription.locked_capacity = None
                subscription.save()
                message = "Subscription updated successfully"
                created = False
            else:
                subscription = ChurchSubscription.objects.create(
                    church=church,
                    package=package,
                    billing_cycle=billing_cycle,
                    duration_months=duration_months,
                    start_date=timezone.now().date(),
                    payment_status='UNPAID',
                    is_active=False,
                )
                message = "Subscription created successfully"
                created = True

            # 🔥 Single source of truth: model method.
            # duration_months is NEVER involved here — it only drives end_date
            # inside ChurchSubscription.save(), already applied above.
            # get_total_price() now reads the locked snapshot, not the live package.
            amount = float(subscription.get_total_price())

            return Response({
                "status": "success",
                "message": message,
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
                    "is_new": created,
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

class BillListAPIView(APIView):
    """List all bills (payments)"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            bills = Bill.objects.select_related(
                'church', 'subscription__package'
            ).order_by('-created_at')

            data = []
            for bill in bills:
                package_name = None
                if bill.subscription and bill.subscription.package:
                    package_name = bill.subscription.package.name

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
                "data": data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching bills: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to fetch bills: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BillCreateAPIView(APIView):
    """Create a new bill (payment)"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            church_id = request.data.get('church_id')
            subscription_id = request.data.get('subscription_id')
            bill_type = request.data.get('bill_type', 'NEW')
            billing_cycle = request.data.get('billing_cycle')
            duration_months = request.data.get('duration_months')
            amount = request.data.get('amount')
            payment_method = request.data.get('payment_method', 'CASH')
            transaction_id = request.data.get('transaction_id')
            note = request.data.get('note')
            tax_type_id = request.data.get('tax_type_id')
            tax_rate_id = request.data.get('tax_rate_id')

            if not church_id:
                return Response({
                    "error": "church_id is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not subscription_id:
                return Response({
                    "error": "subscription_id is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            if not amount:
                return Response({
                    "error": "amount is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                church = Church.objects.get(id=church_id, is_deleted=False)
            except Church.DoesNotExist:
                return Response({
                    "error": "Church not found"
                }, status=status.HTTP_404_NOT_FOUND)

            try:
                subscription = ChurchSubscription.objects.select_related(
                    'package'
                ).get(id=subscription_id)
            except ChurchSubscription.DoesNotExist:
                return Response({
                    "error": "Subscription not found"
                }, status=status.HTTP_404_NOT_FOUND)

            # 🔥 Guard against billing a subscription belonging to another church
            if subscription.church_id != church.id:
                return Response({
                    "error": "Subscription does not belong to the selected church"
                }, status=status.HTTP_400_BAD_REQUEST)

            tax_type = None
            tax_rate = None
            if tax_type_id:
                try:
                    tax_type = TaxType.objects.get(id=tax_type_id)
                except TaxType.DoesNotExist:
                    return Response({
                        "error": "Tax type not found"
                    }, status=status.HTTP_404_NOT_FOUND)

            if tax_rate_id:
                try:
                    tax_rate = TaxRate.objects.get(id=tax_rate_id)
                except TaxRate.DoesNotExist:
                    return Response({
                        "error": "Tax rate not found"
                    }, status=status.HTTP_404_NOT_FOUND)

            # 🔥 A tax rate without its parent type means Bill.save() skips the
            # tax calculation entirely and silently bills without tax.
            if tax_rate and not tax_type:
                return Response({
                    "error": "tax_type_id is required when a tax_rate_id is supplied"
                }, status=status.HTTP_400_BAD_REQUEST)

            if tax_rate and tax_type and tax_rate.tax_type_id != tax_type.id:
                return Response({
                    "error": "Selected tax rate does not belong to the selected tax type"
                }, status=status.HTTP_400_BAD_REQUEST)

            bill = Bill.objects.create(
                church=church,
                subscription=subscription,
                bill_type=bill_type,
                billing_cycle=billing_cycle,
                duration_months=duration_months,
                amount=amount,
                payment_method=payment_method,
                transaction_id=transaction_id,
                note=note,
                tax_type=tax_type,
                tax_rate=tax_rate,
                status='UNPAID',
                breakdown={
                    'church_name': church.name,
                    'package_name': subscription.package.name if subscription.package else None,
                    'billing_cycle': billing_cycle,
                    'duration_months': duration_months,
                    'amount': float(amount),
                    'payment_method': payment_method,
                    'transaction_id': transaction_id,
                }
            )

            return Response({
                "status": "success",
                "message": "Bill created successfully",
                "data": {
                    'id': bill.id,
                    'bill_number': bill.bill_number,
                    'invoice_number': bill.invoice_number,
                    'church_name': church.name,
                    'package_name': subscription.package.name if subscription.package else None,
                    'amount': float(bill.amount),
                    'tax_percentage': float(bill.tax_percentage),
                    'tax_amount': float(bill.tax_amount),
                    'total_amount': float(bill.total_amount),
                    'status': bill.status,
                    'payment_method': bill.payment_method,
                    'transaction_id': bill.transaction_id,
                    'created_at': bill.created_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating bill: {str(e)}", exc_info=True)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class BillDetailAPIView(APIView):
    """Get bill details"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related('church', 'subscription__package').get(pk=pk)

            package_name = None
            if bill.subscription and bill.subscription.package:
                package_name = bill.subscription.package.name

            data = {
                'id': bill.id,
                'bill_number': bill.bill_number,
                'invoice_number': bill.invoice_number,
                'church_id': bill.church.id if bill.church else None,
                'church_name': bill.church.name if bill.church else None,
                'subscription_id': bill.subscription.id if bill.subscription else None,
                'package_name': package_name,
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

    def patch(self, request, pk):
        """Partial update bill"""
        try:
            bill = Bill.objects.get(pk=pk)

            if 'status' in request.data:
                bill.status = request.data['status']
                if bill.status == 'PAID' and not bill.paid_at:
                    bill.paid_at = timezone.now()

            if 'payment_method' in request.data:
                bill.payment_method = request.data['payment_method']

            if 'transaction_id' in request.data:
                bill.transaction_id = request.data['transaction_id']

            if 'note' in request.data:
                bill.note = request.data['note']

            bill.save()

            return Response({
                "status": "success",
                "message": "Bill updated successfully",
                "data": {
                    'id': bill.id,
                    'bill_number': bill.bill_number,
                    'status': bill.status,
                    'payment_method': bill.payment_method,
                    'transaction_id': bill.transaction_id,
                    'paid_at': bill.paid_at,
                }
            }, status=status.HTTP_200_OK)

        except Bill.DoesNotExist:
            return Response(
                {"error": "Bill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating bill {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to update bill: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        """Delete bill"""
        try:
            bill = Bill.objects.get(pk=pk)
            bill_number = bill.bill_number
            bill.delete()

            return Response({
                "status": "success",
                "message": f"Bill #{bill_number} deleted successfully"
            }, status=status.HTTP_200_OK)

        except Bill.DoesNotExist:
            return Response(
                {"error": "Bill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting bill {pk}: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to delete bill: {str(e)}"},
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