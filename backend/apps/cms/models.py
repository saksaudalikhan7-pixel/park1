from django.db import models

class Page(models.Model):
    slug = models.CharField(max_length=100, unique=True, help_text="Unique page identifier (e.g., 'home', 'about')")
    title = models.CharField(max_length=255, help_text="SEO Title")
    description = models.TextField(null=True, blank=True, help_text="SEO Description")
    keywords = models.TextField(null=True, blank=True, help_text="SEO Keywords")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.slug})"

class Banner(models.Model):
    title = models.CharField(max_length=255)
    image_url = models.URLField()
    link = models.URLField(null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Activity(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True, help_text="URL-friendly name")
    short_description = models.TextField(null=True, blank=True, help_text="Brief summary for list views")
    description = models.TextField(help_text="Full detailed description")
    image_url = models.URLField(help_text="Main cover image")
    gallery = models.JSONField(default=list, help_text="List of additional image URLs")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Faq(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question[:50]

class Testimonial(models.Model):
    TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('VIDEO', 'Video'),
    ]
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField()
    rating = models.IntegerField(default=5)
    image_url = models.URLField(null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='TEXT')
    video_url = models.URLField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class SocialLink(models.Model):
    platform = models.CharField(max_length=50)
    url = models.URLField()
    icon = models.CharField(max_length=50, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.platform

class GalleryItem(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    image_url = models.CharField(max_length=700, help_text="Image URL (local path or external link)")
    category = models.CharField(max_length=100, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or "Gallery Item"

class StatCard(models.Model):
    """Statistics cards for homepage and about page"""
    label = models.CharField(max_length=100, help_text="e.g., 'Happy Jumpers'")
    value = models.CharField(max_length=50, help_text="e.g., '5,000+'")
    unit = models.CharField(max_length=100, help_text="e.g., 'Happy Jumpers'")
    icon = models.CharField(max_length=50, help_text="Icon name (e.g., 'Users')")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    page = models.CharField(max_length=50, help_text="Page identifier: 'home' or 'about'")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order']

    def __str__(self):
        return f"{self.value} {self.unit} ({self.page})"

class InstagramReel(models.Model):
    """Instagram reels to display on homepage"""
    title = models.CharField(max_length=255, help_text="Reel title/description")
    thumbnail_url = models.CharField(max_length=700, help_text="Thumbnail image URL (local path or external link)")
    reel_url = models.CharField(max_length=700, help_text="Instagram reel URL")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text="Display order (lower numbers first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Instagram Reel"
        verbose_name_plural = "Instagram Reels"

    def __str__(self):
        return self.title

class MenuSection(models.Model):
    """Menu sections for party feast"""
    category = models.CharField(max_length=100, help_text="e.g., 'Pre-Plated', 'Buffet'")
    items = models.JSONField(default=list, help_text="List of menu items")
    icon = models.CharField(max_length=50, null=True, blank=True, help_text="Icon name")
    color = models.CharField(max_length=20, default="secondary", help_text="Color variant")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.category

class GroupPackage(models.Model):
    """Group booking packages for schools, corporates, etc."""
    name = models.CharField(max_length=255)
    subtitle = models.TextField()
    min_size = models.CharField(max_length=100, help_text="e.g., '15+ Students'")
    icon = models.CharField(max_length=50, help_text="Icon name")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_note = models.CharField(max_length=50, help_text="e.g., 'per student'")
    features = models.JSONField(default=list, help_text="List of features")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant")
    popular = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class GuidelineCategory(models.Model):
    """Safety guideline categories"""
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, help_text="Icon name")
    items = models.JSONField(default=list, help_text="List of guideline items")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Guideline Categories"

    def __str__(self):
        return self.title

class LegalDocument(models.Model):
    """Legal documents: terms, privacy, waiver"""
    DOCUMENT_TYPES = [
        ('TERMS', 'Terms & Conditions'),
        ('DETAILED_RULES', 'Detailed Rules'),
        ('WAIVER', 'Participant Waiver'),
        ('PRIVACY', 'Privacy Policy'),
        ('WAIVER_TERMS', 'Waiver Terms'),
    ]
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, unique=True)
    title = models.CharField(max_length=255)
    intro = models.TextField(null=True, blank=True, help_text="Optional introduction text")
    sections = models.JSONField(default=list, help_text="List of sections with title and content")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Legal Documents"

    def __str__(self):
        return self.get_document_type_display()

class PageSection(models.Model):
    """Generic reusable section for any page"""
    page = models.CharField(max_length=100, help_text="Page identifier (e.g., 'about', 'contact')")
    section_key = models.CharField(max_length=100, help_text="Section identifier (e.g., 'hero', 'features')")
    title = models.CharField(max_length=255, null=True, blank=True)
    subtitle = models.TextField(null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    cta_text = models.CharField(max_length=100, null=True, blank=True, help_text="Call-to-action button text")
    cta_link = models.URLField(null=True, blank=True, help_text="Call-to-action button link")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order']
        unique_together = ['page', 'section_key']

    def __str__(self):
        return f"{self.page} - {self.section_key}"

class PricingPlan(models.Model):
    """Pricing plans for sessions and parties"""
    TYPE_CHOICES = [
        ('SESSION', 'Session'),
        ('PARTY', 'Party'),
    ]
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    age_group = models.CharField(max_length=100, null=True, blank=True, help_text="e.g., 'Ages 1-7 Years'")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(help_text="Duration in minutes")
    period_text = models.CharField(max_length=50, default="/ 60 Mins", help_text="e.g., '/ 60 Mins', '/ Person'")
    description = models.TextField(null=True, blank=True)
    features = models.JSONField(default=list, help_text="List of features/inclusions")
    popular = models.BooleanField(default=False)
    variant = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['type', 'order']

    def __str__(self):
        return f"{self.name} ({self.type})"

class ContactInfo(models.Model):
    """Site-wide contact information"""
    CATEGORY_CHOICES = [
        ('PHONE', 'Phone'),
        ('EMAIL', 'Email'),
        ('ADDRESS', 'Address'),
        ('HOURS', 'Operating Hours'),
        ('SOCIAL', 'Social Media'),
        ('OTHER', 'Other'),
    ]
    key = models.CharField(max_length=100, unique=True, help_text="Unique identifier (e.g., 'main_phone')")
    label = models.CharField(max_length=255, help_text="Display label (e.g., 'Call Us')")
    value = models.TextField(help_text="Contact value (phone, email, address, etc.)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50, null=True, blank=True, help_text="Icon name (e.g., 'Phone', 'Mail')")
    link = models.URLField(null=True, blank=True, help_text="Optional link (tel:, mailto:, maps link)")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'order']
        verbose_name_plural = "Contact Information"

    def __str__(self):
        return f"{self.label} ({self.category})"

class PartyPackage(models.Model):
    """Party packages for birthday and events"""
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_participants = models.IntegerField()
    max_participants = models.IntegerField(null=True, blank=True)
    duration = models.IntegerField(help_text="Duration in minutes")
    includes = models.JSONField(default=list, help_text="List of included items")
    addons = models.JSONField(default=list, help_text="List of available add-ons")
    image_url = models.URLField(null=True, blank=True)
    popular = models.BooleanField(default=False)
    variant = models.CharField(max_length=20, default="accent", help_text="Color variant")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class TimelineItem(models.Model):
    """Timeline items for About page journey"""
    year = models.CharField(max_length=10)
    title = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.year} - {self.title}"

class ValueItem(models.Model):
    """Company values for About page"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Icon name (e.g., 'Users', 'Shield')")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class FacilityItem(models.Model):
    """Facilities available at the park"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Icon name")
    image_url = models.URLField(null=True, blank=True)
    items = models.JSONField(default=list, help_text="List of specific items/features")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class GroupBenefit(models.Model):
    """Benefits for group bookings page"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Lucide icon name")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    """Messages from the contact form"""
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.email}"


class FreeEntry(models.Model):
    """Free entry requests from customers"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    reason = models.TextField(help_text="Reason for free entry request")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(null=True, blank=True, help_text="Admin notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Free Entry"
        verbose_name_plural = "Free Entries"

    def __str__(self):
        return f"{self.name} - {self.status}"



class SessionBookingConfig(models.Model):
    """Configuration for session booking wizard - makes all pricing and labels editable from CMS"""
    
    # Adult Pricing & Labels
    adult_price = models.DecimalField(max_digits=10, decimal_places=2, default=899, help_text="Price per adult")
    adult_label = models.CharField(max_length=100, default="Ninja Warrior (7+ Years)", help_text="Display label for adults")
    adult_description = models.CharField(max_length=200, default="₹ 899 + GST per person", help_text="Price description for adults")
    
    # Kid Pricing & Labels
    kid_price = models.DecimalField(max_digits=10, decimal_places=2, default=500, help_text="Price per kid")
    kid_label = models.CharField(max_length=100, default="Little Ninjas (1-7 Years)", help_text="Display label for kids")
    kid_description = models.CharField(max_length=200, default="₹ 500 + GST per person", help_text="Price description for kids")
    
    # Spectator Pricing & Labels
    spectator_price = models.DecimalField(max_digits=10, decimal_places=2, default=150, help_text="Price per spectator")
    spectator_label = models.CharField(max_length=100, default="Spectators", help_text="Display label for spectators")
    spectator_description = models.CharField(max_length=200, default="₹ 150 + GST per person", help_text="Price description for spectators")
    
    # Tax Configuration
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST percentage (e.g., 18 for 18%)")
    
    # Duration Configuration
    duration_minutes = models.IntegerField(default=60, help_text="Session duration in minutes")
    duration_label = models.CharField(max_length=100, default="60 Minutes", help_text="Display label for duration")
    duration_description = models.CharField(max_length=200, default="Standard Session", help_text="Duration description")
    
    # Meta
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Session Booking Configuration"
        verbose_name_plural = "Session Booking Configuration"
    
    def __str__(self):
        return f"Session Booking Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def get_config(cls):
        """Get or create singleton config"""
        config, created = cls.objects.get_or_create(id=1)
        if created:
            config.save()  # Ensure defaults are saved
        return config


class PartyBookingConfig(models.Model):
    """Singleton model for party booking wizard configuration"""
    
    # Pricing
    participant_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1500.00,
        help_text="Price per participant"
    )
    participant_label = models.CharField(
        max_length=200, 
        default="Participants",
        help_text="Label for participants"
    )
    participant_description = models.CharField(
        max_length=500, 
        default="₹ 1500 per person",
        help_text="Description shown for participants"
    )
    
    spectator_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=100.00,
        help_text="Price per extra spectator (after free count)"
    )
    free_spectators = models.IntegerField(
        default=10,
        help_text="Number of free spectators included"
    )
    spectator_label = models.CharField(
        max_length=200, 
        default="Spectators",
        help_text="Label for spectators"
    )
    spectator_description = models.CharField(
        max_length=500, 
        default="First 10 free, ₹100 each after",
        help_text="Description shown for spectators"
    )
    
    # Minimums & Limits
    min_participants = models.IntegerField(
        default=10,
        help_text="Minimum number of participants required"
    )
    
    # Tax & Deposit
    gst_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=18.00,
        help_text="GST rate in percentage"
    )
    deposit_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=50.00,
        help_text="Deposit percentage required"
    )
    
    # Package Inclusions (JSON field for flexibility)
    package_inclusions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of package inclusions (e.g., ['75 mins play + 1hr party room', 'Party feast included'])"
    )
    
    # Time Slots
    available_time_slots = models.JSONField(
        default=list,
        blank=True,
        help_text="List of available time slots (e.g., ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'])"
    )
    
    # Duration & Labels
    duration_label = models.CharField(
        max_length=200, 
        default="75 mins play + 1hr party room",
        help_text="Duration/package label"
    )
    
    # Status
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Party Booking Configuration"
        verbose_name_plural = "Party Booking Configuration"
    
    def __str__(self):
        return f"Party Booking Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    def save(self, *args, **kwargs):
        # Ensure default values for JSON fields
        if not self.package_inclusions:
            self.package_inclusions = [
                "75 mins play + 1hr party room",
                "Party feast included",
                "Drinks & mini slush",
                "10 free spectators"
            ]
        if not self.available_time_slots:
            self.available_time_slots = ["12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"]
        super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Get or create singleton config"""
        config, created = cls.objects.get_or_create(id=1)
        if created:
            config.save()  # Ensure defaults are saved
        return config

