from django.db import models

# Create your models here.
class Company(models.Model):
    name = models.CharField(max_length=255)
    website = models.CharField(blank=True, null=True) # URL in format http://www.example.com
    domain = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    address = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        permissions = [
            ("access_companies", "Can access Companies module"),
        ]

    def __str__(self):
        return self.name