from django import forms
from .models import Contact, Feedback

class FeedbackForm(forms.ModelForm):
    class Meta:
        model = Feedback
        fields = ['rating', 'description']

class ContactForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ['inquiry_type', 'message']
