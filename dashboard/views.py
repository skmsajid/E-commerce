from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required

from .forms import ContactForm, FeedbackForm
from accounts.models import User
from .models import Feedback


@login_required
def dashboard(request):

    user = request.user

    return render(request, 'dashboard/dashboard.html', {
        'fullName': user.username,
        'email': user.email,
        'phone': user.phone_number,
        'address': user.address,
        'form': FeedbackForm(),
        'contact_form': ContactForm(),
    })


@login_required
def feedback(request):

    if request.method == 'GET':

        feedbacks = Feedback.objects.select_related('user').order_by('-created_at')

        total = feedbacks.count()

        average = sum(
            item.rating for item in feedbacks
        ) / total if total else 0

        positive = feedbacks.filter(
            rating__gte=4
        ).count()

        return render(request, 'dashboard/feedbacks.html', {
            'feedbacks': feedbacks,
            'total_feedbacks': total,
            'average_rating': average,
            'positive_feedbacks': positive,
        })

    if request.method == 'POST':

        form = FeedbackForm(request.POST)

        if form.is_valid():

            feedback_item = form.save(commit=False)
            feedback_item.user = request.user
            feedback_item.save()

            return redirect('feedback')

        user = request.user

        return render(request, 'dashboard/dashboard.html', {
            'fullName': user.username,
            'email': user.email,
            'phone': user.phone_number,
            'address': user.address,
            'form': form,
            'contact_form': ContactForm(),
        })

    return redirect('feedback')


@login_required
def submit_contact(request):

    if request.method == 'POST':

        form = ContactForm(request.POST)

        if form.is_valid():

            contact = form.save(commit=False)
            contact.user = request.user
            contact.save()

            return redirect('dashboard')

        user = request.user

        return render(request, 'dashboard/dashboard.html', {
            'fullName': user.username,
            'email': user.email,
            'phone': user.phone_number,
            'address': user.address,
            'form': FeedbackForm(),
            'contact_form': form,
        })

    return redirect('dashboard')


@login_required
def update_feedback(request, feedback_id):

    if request.method == 'POST':

        feedback_item = get_object_or_404(
            Feedback,
            id=feedback_id,
            user=request.user
        )

        form = FeedbackForm(
            request.POST,
            instance=feedback_item
        )

        if form.is_valid():

            form.save()

            return redirect('feedback')

        feedbacks = Feedback.objects.select_related(
            'user'
        ).order_by('-created_at')

        total = feedbacks.count()

        average = sum(
            item.rating for item in feedbacks
        ) / total if total else 0

        positive = feedbacks.filter(
            rating__gte=4
        ).count()

        return render(request, 'dashboard/feedbacks.html', {
            'feedbacks': feedbacks,
            'total_feedbacks': total,
            'average_rating': average,
            'positive_feedbacks': positive,
            'form': form,
        })

    return redirect('feedback')


@login_required
def delete_feedback(request, feedback_id):

    if request.method == 'POST':

        feedback_item = get_object_or_404(
            Feedback,
            id=feedback_id,
            user=request.user
        )

        feedback_item.delete()

        return redirect('feedback')

    return redirect('feedback')