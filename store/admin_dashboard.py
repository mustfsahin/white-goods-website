from django.contrib import admin  # 🔥 Bu import önemli, menüyü bu getirecek
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Sum, F, Value, DecimalField
from django.db.models.functions import Coalesce
from django.contrib.auth.models import User
from .models import Order, Product
import json

@staff_member_required
def custom_admin_dashboard(request):
    # --- 1. MENÜLERİ GERİ GETİRME OPERASYONU (Eksik Olan Kısım) ---
    # Django'nun standart admin verilerini (menü, başlıklar vb.) alıyoruz
    context = admin.site.each_context(request)
    
    # Sol menüdeki uygulama listesini çekiyoruz
    app_list = admin.site.get_app_list(request)
    context['available_apps'] = app_list  # Jazzmin menüsü bunu kullanır!

    # -----------------------------------------------------------
    # --- 2. BİZİM DASHBOARD HESAPLAMALARI ---
    # -----------------------------------------------------------

    # 1. KARTLAR
    total_earnings = Order.objects.aggregate(
        total=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField()))
    )['total']
    
    total_orders = Order.objects.count()
    total_customers = User.objects.filter(is_staff=False).count()
    pending_orders = Order.objects.filter(status='Pending').count()

    # 2. GRAFİK VERİSİ
    orders_graph = Order.objects.order_by('-created_at')[:10]
    orders_graph = reversed(orders_graph)
    
    graph_labels = []
    graph_data = []
    
    for order in orders_graph:
        graph_labels.append(order.created_at.strftime("%d/%m %H:%M"))
        graph_data.append(float(order.total_price) if order.total_price else 0.0)

    # 3. TABLOLAR
    recent_orders = Order.objects.order_by('-created_at')[:5]
    low_stock_products = Product.objects.filter(stock__lte=5).order_by('stock')[:5]

    # 4. EN ÇOK SATANLAR
    top_selling_products = Product.objects.annotate(
        total_sold_qty=Coalesce(Sum('orderitem__quantity'), 0),
        total_revenue=Coalesce(Sum(F('orderitem__quantity') * F('orderitem__product_price')), Value(0, output_field=DecimalField()))
    ).order_by('-total_sold_qty')[:5]

    # --- 3. VERİLERİ BİRLEŞTİR ---
    # Mevcut admin context'ine bizim verileri ekliyoruz
    context.update({
        'total_earnings': total_earnings,
        'total_orders': total_orders,
        'total_customers': total_customers,
        'pending_orders': pending_orders,
        'recent_orders': recent_orders,
        'low_stock_products': low_stock_products,
        'top_selling_products': top_selling_products,
        'graph_labels': json.dumps(graph_labels),
        'graph_data': json.dumps(graph_data),
    })
    
    return render(request, 'admin/index.html', context)