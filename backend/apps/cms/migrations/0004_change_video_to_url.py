# Generated migration for changing video FileField to video_url URLField

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0003_attractionvideosection_thumbnail'),  # Update this to your latest migration
    ]

    operations = [
        # Step 1: Add the new video_url field (nullable first)
        migrations.AddField(
            model_name='attractionvideosection',
            name='video_url',
            field=models.URLField(blank=True, max_length=500, help_text="YouTube, Vimeo, or other video URL (e.g., https://youtube.com/shorts/TKflY2nTraQ)"),
        ),
        # Step 2: Remove the old video FileField
        migrations.RemoveField(
            model_name='attractionvideosection',
            name='video',
        ),
        # Step 3: Make video_url non-nullable (if desired)
        migrations.AlterField(
            model_name='attractionvideosection',
            name='video_url',
            field=models.URLField(max_length=500, help_text="YouTube, Vimeo, or other video URL (e.g., https://youtube.com/shorts/TKflY2nTraQ)"),
        ),
    ]
