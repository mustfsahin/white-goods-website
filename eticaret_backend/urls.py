from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from store.admin_dashboard import custom_admin_dashboard
from store.views import (
    ProductListAPI, CategoryListAPI, CheckoutAPI, UserOrdersAPI, 
    ContactAPI, ReviewAPI, ProfileAPI, AddressAPI, 
    register_api, login_api
)

urlpatterns = [
    path('admin/', custom_admin_dashboard, name='admin_dashboard'),
    path('admin/', admin.site.urls),
    path('api/products/', ProductListAPI.as_view()),
    path('api/categories/', CategoryListAPI.as_view()),
    path('api/checkout/', CheckoutAPI.as_view()),
    path('api/my-orders/', UserOrdersAPI.as_view()),
    path('api/contact/', ContactAPI.as_view()),
    path('api/reviews/', ReviewAPI.as_view()),
    path('api/profile/', ProfileAPI.as_view()),
    path('api/addresses/', AddressAPI.as_view()),
    path('api/register/', register_api),
    path('api/login/', login_api),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)