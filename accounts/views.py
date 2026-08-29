import json

from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.shortcuts import render, redirect

from .forms import SignupForm
from .models import User


def user_login(request):

    if request.user.is_authenticated:
        return redirect("dashboard")

    form = AuthenticationForm(
        request,
        data=request.POST or None
    )

    if request.method == "POST" and form.is_valid():

        login(request, form.get_user())

        return redirect("dashboard")

    return render(
        request,
        "accounts/login.html",
        {"form": form}
    )


def user_register(request):

    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == "POST":

        form = SignupForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("login")

    else:
        form = SignupForm()

    return render(
        request,
        "accounts/register.html",
        {"form": form}
    )


def user_logout(request):

    logout(request)

    return redirect("login")

def update_profile(request):

    if request.method != "POST":
        return JsonResponse({
            "success": False,
            "message": "Invalid request."
        }, status=400)

    data = json.loads(request.body)

    full_name = data.get("fullName")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")

    if not full_name or not email or not phone or not address:
        return JsonResponse({
            "success": False,
            "message": "All profile fields are required."
        }, status=400)

    if User.objects.filter(email=email).exclude(
        id=request.user.id
    ).exists():

        return JsonResponse({
            "success": False,
            "message": "Email already exists."
        }, status=400)

    user = request.user

    user.username = full_name
    user.email = email
    user.phone_number = phone
    user.address = address

    user.save()

    return JsonResponse({
        "success": True,
        "message": "Profile updated successfully."
    })