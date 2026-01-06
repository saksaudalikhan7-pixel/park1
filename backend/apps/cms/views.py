from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from apps.bookings.permissions import IsStaffUser
from apps.core.permissions import IsContentManagerOrAdmin
from .models import (
    Banner, Activity, Faq, SocialLink, GalleryItem,
    StatCard, InstagramReel, MenuSection, GroupPackage, GuidelineCategory, LegalDocument,
    PageSection, PricingPlan, ContactInfo, PartyPackage, TimelineItem, ValueItem, FacilityItem,
    Page, ContactMessage, FreeEntry, SessionBookingConfig, PartyBookingConfig, PricingCarouselImage
)
from .serializers import (
    BannerSerializer, ActivitySerializer, FaqSerializer, 
    SocialLinkSerializer, GalleryItemSerializer,
    StatCardSerializer, InstagramReelSerializer, MenuSectionSerializer, GroupPackageSerializer,
    GuidelineCategorySerializer, LegalDocumentSerializer,
    PageSectionSerializer, PricingPlanSerializer, ContactInfoSerializer, PartyPackageSerializer,
    TimelineItemSerializer, ValueItemSerializer, FacilityItemSerializer,
    PageSerializer, ContactMessageSerializer, FreeEntrySerializer, SessionBookingConfigSerializer, PartyBookingConfigSerializer,
    PricingCarouselImageSerializer
)

class BaseCmsViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        # Allow public read access, require CONTENT_MANAGER or ADMIN for write operations
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsContentManagerOrAdmin()]  # Allow CONTENT_MANAGER and ADMIN to manage CMS content

class BannerViewSet(BaseCmsViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class ActivityViewSet(BaseCmsViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class FaqViewSet(BaseCmsViewSet):
    queryset = Faq.objects.all()
    serializer_class = FaqSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order']
    ordering = ['order']

class SocialLinkViewSet(BaseCmsViewSet):
    queryset = SocialLink.objects.all()
    serializer_class = SocialLinkSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class GalleryItemViewSet(BaseCmsViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class StatCardViewSet(BaseCmsViewSet):
    queryset = StatCard.objects.all()
    serializer_class = StatCardSerializer
    filterset_fields = ['active', 'page']
    ordering_fields = ['order']
    ordering = ['page', 'order']

class InstagramReelViewSet(BaseCmsViewSet):
    queryset = InstagramReel.objects.all()
    serializer_class = InstagramReelSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class MenuSectionViewSet(BaseCmsViewSet):
    queryset = MenuSection.objects.all()
    serializer_class = MenuSectionSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class GroupPackageViewSet(BaseCmsViewSet):
    queryset = GroupPackage.objects.all()
    serializer_class = GroupPackageSerializer
    filterset_fields = ['active', 'popular']
    ordering_fields = ['order']
    ordering = ['order']

class GuidelineCategoryViewSet(BaseCmsViewSet):
    queryset = GuidelineCategory.objects.all()
    serializer_class = GuidelineCategorySerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class LegalDocumentViewSet(BaseCmsViewSet):
    queryset = LegalDocument.objects.all()
    serializer_class = LegalDocumentSerializer
    filterset_fields = ['active', 'document_type']
    # Removed lookup_field to use default 'id' for proper edit page routing

class PageSectionViewSet(BaseCmsViewSet):
    queryset = PageSection.objects.all()
    serializer_class = PageSectionSerializer
    # filterset_fields = ['active', 'page', 'section_key']  <-- Replacing this with explicit get_queryset
    ordering_fields = ['order']
    ordering = ['page', 'order']

    def get_queryset(self):
        """
        Explicitly filter queryset to ensure strict isolation.
        Relies on frontend passing ?page=...
        """
        queryset = PageSection.objects.all()
        page = self.request.query_params.get('page')
        section_key = self.request.query_params.get('section_key')
        
        if page:
            queryset = queryset.filter(page=page)
        
        if section_key:
            queryset = queryset.filter(section_key=section_key)
            
        return queryset

class PricingPlanViewSet(BaseCmsViewSet):
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    filterset_fields = ['active', 'type', 'popular']
    ordering_fields = ['order']
    ordering = ['type', 'order']

class ContactInfoViewSet(BaseCmsViewSet):
    queryset = ContactInfo.objects.all()
    serializer_class = ContactInfoSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order']
    ordering = ['category', 'order']

class PartyPackageViewSet(BaseCmsViewSet):
    queryset = PartyPackage.objects.all()
    serializer_class = PartyPackageSerializer
    filterset_fields = ['active', 'popular']
    ordering_fields = ['order']
    ordering = ['order']

class TimelineItemViewSet(BaseCmsViewSet):
    queryset = TimelineItem.objects.all()
    serializer_class = TimelineItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class ValueItemViewSet(BaseCmsViewSet):
    queryset = ValueItem.objects.all()
    serializer_class = ValueItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class FacilityItemViewSet(BaseCmsViewSet):
    queryset = FacilityItem.objects.all()
    serializer_class = FacilityItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsStaffUser]  # Allow managers to view contact messages
    ordering = ['-created_at']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]  # Allow managers to manage activities
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a contact message as read"""
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read', 'is_read': True})
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark a contact message as unread"""
        message = self.get_object()
        message.is_read = False
        message.save()
        return Response({'status': 'marked as unread', 'is_read': False})

    def perform_create(self, serializer):
        """
        Save the contact message and trigger email notification.
        """
        instance = serializer.save()
        
        # Trigger email notification
        try:
            from apps.emails.services import email_service
            email_service.send_contact_message_confirmation(instance)
        except Exception as e:
            # IMPORTANT: Log error but DO NOT break the contact form flow
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger contact message email: {str(e)}")

class PageViewSet(BaseCmsViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    filterset_fields = ['active', 'slug']
    lookup_field = 'slug'

class FreeEntryViewSet(viewsets.ModelViewSet):
    queryset = FreeEntry.objects.all()
    serializer_class = FreeEntrySerializer
    permission_classes = [IsStaffUser]  # Only staff can view/manage free entries
    filterset_fields = ['status']
    ordering = ['-created_at']
    ordering_fields = ['created_at', 'status']

class SessionBookingConfigViewSet(BaseCmsViewSet):
    """Singleton viewset for session booking configuration"""
    queryset = SessionBookingConfig.objects.all()
    serializer_class = SessionBookingConfigSerializer
    
    def list(self, request, *args, **kwargs):
        """Return the singleton config"""
        config = SessionBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Always return the singleton config regardless of ID"""
        config = SessionBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class PartyBookingConfigViewSet(BaseCmsViewSet):
    """Singleton viewset for party booking configuration"""
    queryset = PartyBookingConfig.objects.all()
    serializer_class = PartyBookingConfigSerializer
    
    def list(self, request, *args, **kwargs):
        """Return the singleton config"""
        config = PartyBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Always return the singleton config regardless of ID"""
        config = PartyBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class UploadView(APIView):
    """
    Handle file uploads for CMS images.
    Validates file type, size, and saves to media storage.
    """
    permission_classes = [IsContentManagerOrAdmin]  # Require CONTENT_MANAGER or ADMIN
    parser_classes = (MultiPartParser, FormParser)
    
    # Configuration
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    # Trigger deployment for consistency check
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'}
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm'
    }

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size
        if file_obj.size > self.MAX_FILE_SIZE:
            size_mb = file_obj.size / 1024 / 1024
            max_mb = self.MAX_FILE_SIZE / 1024 / 1024
            return Response(
                {'error': f'File too large. Maximum size is {max_mb:.0f}MB. Uploaded file is {size_mb:.2f}MB'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        
        # Validate file extension
        file_ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else ''
        if file_ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(self.ALLOWED_EXTENSIONS).upper()}. Got: {file_ext}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate MIME type
        content_type = file_obj.content_type
        if content_type not in self.ALLOWED_MIME_TYPES:
            return Response(
                {'error': f'Invalid content type. Expected image, got: {content_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Save file using Django's default storage
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import uuid
            from datetime import datetime
            
            # Generate unique filename to prevent overwrites
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            safe_filename = f"{timestamp}_{unique_id}_{file_obj.name}"
            
            # Save to uploads directory
            path = default_storage.save(
                f"uploads/{safe_filename}", 
                ContentFile(file_obj.read())
            )
            
            # Generate absolute URL
            relative_url = default_storage.url(path)
            full_url = request.build_absolute_uri(relative_url)
            
            return Response({
                'url': full_url,
                'filename': file_obj.name,
                'size': file_obj.size,
                'path': path
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # DEBUG: Return 400 with actual error for debugging
            return Response(
                {'error': f'Upload failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ReorderView(APIView):
    permission_classes = [IsContentManagerOrAdmin]

    def post(self, request, *args, **kwargs):
        """
        Expects payload: { "model": "banner", "items": [{ "id": 1, "order": 0 }, { "id": 2, "order": 1 }] }
        """
        model_name = request.data.get('model')
        items = request.data.get('items', [])

        if not model_name or not items:
            return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        # Map model name to actual model class
        model_map = {
            'banner': Banner,
            'activity': Activity,
            'faq': Faq,
            'social-link': SocialLink,
            'gallery-item': GalleryItem,
            'stat-card': StatCard,
            'instagram-reel': InstagramReel,
            'menu-section': MenuSection,
            'group-package': GroupPackage,
            'guideline-category': GuidelineCategory,
            'page-section': PageSection,
            'pricing-plan': PricingPlan,
            'contact-info': ContactInfo,
            'party-package': PartyPackage,
            'timeline-item': TimelineItem,
            'value-item': ValueItem,
            'facility-item': FacilityItem,
        }

        ModelClass = model_map.get(model_name)
        if not ModelClass:
            return Response({'error': f'Invalid model: {model_name}'}, status=status.HTTP_400_BAD_REQUEST)

        # Update orders
        for item in items:
            item_id = item.get('id')
            order = item.get('order')
            if item_id is not None and order is not None:
                ModelClass.objects.filter(id=item_id).update(order=order)

        return Response({'success': True})


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from .models import AttractionVideoSection

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def attraction_video_view(request):
    """
    GET: Returns the latest attraction video.
         - If authenticated (Admin): Returns latest created (active or inactive).
         - If anonymous (Public): Returns latest active only.
    POST: Updates or creates the attraction video section (Admin only).
    """
    if request.method == 'GET':
        # Determine if user is admin/manager
        is_admin = request.user.is_authenticated and (
            getattr(request.user, 'role', '') in ['admin', 'manager', 'content_manager'] or 
            request.user.is_staff or 
            request.user.is_superuser
        )

        if is_admin:
            # Admin grabs the absolute latest record regardless of status
            video_section = AttractionVideoSection.objects.first()
        else:
            # Public only sees active
            video_section = AttractionVideoSection.objects.filter(is_active=True).first()
        
        if not video_section:
            return Response(None, status=200)
        
        video_url = request.build_absolute_uri(video_section.video.url) if video_section.video else None
        thumb_url = request.build_absolute_uri(video_section.thumbnail.url) if video_section.thumbnail else None
        
        return Response({
            'title': video_section.title,
            'video': video_url,
            'thumbnail': thumb_url,
            'is_active': video_section.is_active
        })

    elif request.method == 'POST':
        # Check permissions manually since we used AllowAny for GET
        if not (request.user.is_authenticated and (
            getattr(request.user, 'role', '') in ['admin', 'manager', 'content_manager'] or 
            request.user.is_staff or 
            request.user.is_superuser
        )):
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        
        # Get latest or create
        video_section = AttractionVideoSection.objects.first()
        if not video_section:
            video_section = AttractionVideoSection()
        
        # Update fields
        if 'title' in data:
            video_section.title = data['title']
        if 'is_active' in data:
            video_section.is_active = data['is_active']
            
        # Handle video URL update
        if 'video_url' in data and data['video_url']:
            video_url = data['video_url']
            if settings.MEDIA_URL in video_url:
                try:
                    relative_path = video_url.split(settings.MEDIA_URL)[-1]
                    video_section.video = relative_path
                except:
                    pass
            else:
                video_section.video = video_url

        # Handle thumbnail URL update
        if 'thumbnail_url' in data and data['thumbnail_url']:
            thumb_url = data['thumbnail_url']
            if settings.MEDIA_URL in thumb_url:
                try:
                    relative_path = thumb_url.split(settings.MEDIA_URL)[-1]
                    video_section.thumbnail = relative_path
                except:
                    pass
            else:
                video_section.thumbnail = thumb_url
                
        video_section.save()
        
        # Return updated data
        new_video_url = request.build_absolute_uri(video_section.video.url) if video_section.video else None
        new_thumb_url = request.build_absolute_uri(video_section.thumbnail.url) if video_section.thumbnail else None
        
        return Response({
            'title': video_section.title,
            'video': new_video_url,
            'thumbnail': new_thumb_url,
            'is_active': video_section.is_active
        })

class PricingCarouselImageViewSet(BaseCmsViewSet):
    queryset = PricingCarouselImage.objects.all()
    serializer_class = PricingCarouselImageSerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']
