from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    phone_number = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )

    address = models.TextField(
        blank=True
    )