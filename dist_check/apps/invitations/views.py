from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InvitationTemplate, BookingInvitation
from .serializers import InvitationTemplateSerializer, BookingInvitationSerializer, PublicInvitationSerializer
from apps.bookings.models import PartyBooking

class InvitationTemplateViewSet(viewsets.ModelViewSet):
    queryset = InvitationTemplate.objects.all()
    serializer_class = InvitationTemplateSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        # logger.info("------- INVITATION TEMPLATE CREATE STARTED -------") # optional
        if 'background_image' in request.FILES:
            file = request.FILES['background_image']
            # logger.info(f"File received: {file.name}, Size: {file.size} bytes")
        
        try:
            response = super().create(request, *args, **kwargs)
            return response
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Invitation template create failed: {e}")
            raise

class BookingInvitationViewSet(viewsets.ModelViewSet):
    queryset = BookingInvitation.objects.all()
    serializer_class = BookingInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]  # Default to authenticated only

    @action(detail=False, methods=['get'], url_path='public/(?P<uuid>[^/.]+)', permission_classes=[permissions.AllowAny])
    def public_view(self, request, uuid=None):
        try:
            invitation = BookingInvitation.objects.get(uuid=uuid)
            serializer = PublicInvitationSerializer(invitation)
            return Response(serializer.data)
        except BookingInvitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='create-or-update')
    def create_or_update(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({"error": "Booking ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = PartyBooking.objects.get(id=booking_id)
            
            invitation, created = BookingInvitation.objects.get_or_create(booking=booking)
            
            serializer = BookingInvitationSerializer(invitation, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                logger.warning(f"Booking invitation serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except PartyBooking.DoesNotExist:
            logger.warning(f"PartyBooking with id={booking_id} not found during invitation update")
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Create/Update invitation failed: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

