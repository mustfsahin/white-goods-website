from django.contrib import admin
from django.urls import path
from store.views import ProductListAPI, CategoryListAPI # <--- CategoryListAPI'yi de çağırdık
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', ProductListAPI.as_view()),
    path('api/categories/', CategoryListAPI.as_view()), # <--- YENİ LİNKİMİZ
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)