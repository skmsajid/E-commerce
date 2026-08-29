from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def fashion(request):
	return render(request, 'categories/fashion.html')


@login_required
def electronics(request):
	return render(request, 'categories/electronics.html')


@login_required
def groceries(request):
	return render(request, 'categories/groceries.html')


@login_required
def health_beauty(request):
	return render(request, 'categories/health_beauty.html')


@login_required
def kids(request):
	return render(request, 'categories/kids.html')

@login_required
def offers(request):
	return render(request, 'categories/offers.html')