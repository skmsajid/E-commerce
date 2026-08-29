from django.conf import settings
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class Feedback(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	rating = models.PositiveSmallIntegerField(
		validators=[MinValueValidator(1), MaxValueValidator(5)]
	)
	description = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'{self.user.username} - {self.rating}/5'

class Contact(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	inquiry_type = models.CharField(max_length=50)
	message = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'{self.user.username} - {self.inquiry_type}'
