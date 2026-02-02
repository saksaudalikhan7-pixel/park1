"""
Management command to update pricing page content with new pricing structure and opening hours.
"""
from django.core.management.base import BaseCommand
from apps.cms.models import PageSection


class Command(BaseCommand):
    help = 'Update pricing page hero section with new pricing structure and opening hours'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Updating pricing page content...'))

        # Pricing content with proper formatting
        pricing_content = """**Participants:**

**1 to under 3 Years FREE Entry**
(Must be accompanied by a paid adult participant if want to use Ninja activity)

**3 year to 7 years - Rs 500 + GST**
(Must be accompanied by a paid adult participant)

**7 years and over - Rs 900 + GST**

**Rs 100 + GST Each Spectators**
(Non participants - Entry to venue only and can not use Ninja activity)

**New Sock Rs 100**

All participants must always wear Ninja branded grippy jumping socks while using the inflatable.

**The session is for 90 Minutes.**

Additional sessions can be upgraded at additional Rs 500 for 1hr.

---

## 🕒 Opening Hours

| Day | Hours |
|-----|-------|
| Monday | 1:00 PM – 10:00 PM |
| Tuesday to Sunday | 1:00 PM – 10:00 PM |
"""

        # Update or create the pricing hero section
        section, created = PageSection.objects.update_or_create(
            page='pricing',
            section_key='hero',
            defaults={
                'title': 'Our Prices',
                'subtitle': 'What you pay to be a Ninja!',
                'content': pricing_content,
                'active': True,
                'order': 0
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created pricing hero section'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✓ Updated pricing hero section'))

        self.stdout.write(self.style.SUCCESS('\nPricing page content updated successfully!'))
        self.stdout.write(self.style.WARNING('\nContent preview:'))
        self.stdout.write(f'Title: {section.title}')
        self.stdout.write(f'Subtitle: {section.subtitle}')
        self.stdout.write(f'Content length: {len(section.content)} characters')
