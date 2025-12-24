from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from apps.bookings.permissions import IsStaffUser
from .models import (
    Banner, Activity, Faq, SocialLink, GalleryItem,
    StatCard, InstagramReel, MenuSection, GroupPackage, GuidelineCategory, LegalDocument,
    PageSection, PricingPlan, ContactInfo, PartyPackage, TimelineItem, ValueItem, FacilityItem,
    Page, ContactMessage, FreeEntry, SessionBookingConfig, PartyBookingConfig
)
from .serializers import (
    BannerSerializer, ActivitySerializer, FaqSerializer, 
    SocialLinkSerializer, GalleryItemSerializer,
    StatCardSerializer, InstagramReelSerializer, MenuSectionSerializer, GroupPackageSerializer,
    GuidelineCategorySerializer, LegalDocumentSerializer,
    PageSectionSerializer, PricingPlanSerializer, ContactInfoSerializer, PartyPackageSerializer,
    TimelineItemSerializer, ValueItemSerializer, FacilityItemSerializer,
    PageSerializer, ContactMessageSerializer, FreeEntrySerializer, SessionBookingConfigSerializer, PartyBookingConfigSerializer
)

class BaseCmsViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        # Allow public read access, require staff authentication for write operations
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]  # Allow managers to manage CMS content

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
    permission_classes = [permissions.IsAdminUser]  # Require admin authentication
    parser_classes = (MultiPartParser, FormParser)
    
    # Configuration
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}

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
            return Response(
                {'error': f'File too large. Maximum size is 5MB. Uploaded file is {size_mb:.2f}MB'},
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
            return Response(
                {'error': f'Upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReorderView(APIView):
    permission_classes = [permissions.IsAdminUser]

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
