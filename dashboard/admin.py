from django.contrib import admin
from .models import Contact, Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
	list_display = ('user', 'rating', 'description', 'created_at')
	list_filter = ('rating', 'created_at')
	search_fields = ('user__username', 'user__email', 'description')
	readonly_fields = ('created_at',)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
	list_display = ('user', 'inquiry_type', 'message', 'created_at')
	list_filter = ('inquiry_type', 'created_at')
	search_fields = ('user__username', 'user__email', 'inquiry_type', 'message')
	readonly_fields = ('created_at',)
