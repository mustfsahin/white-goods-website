import csv
from django.http import HttpResponse
from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Category, Product, Order, OrderItem, Coupon, Review, Address, ContactMessage

# --- PDF KÜTÜPHANESİ ---
# Eğer yüklü değilse terminale: pip install reportlab
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# =======================================================
# 1. EXCEL (CSV) ÇIKTISI ALMA
# =======================================================
def export_to_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="orders_report.csv"'
    
    # Excel'in Türkçe karakterleri tanıması için BOM ekliyoruz
    response.write(u'\ufeff'.encode('utf8'))
    
    writer = csv.writer(response)
    writer.writerow(['Order ID', 'Customer', 'Phone', 'Total', 'Date', 'Status'])
    
    for order in queryset:
        writer.writerow([
            order.id, 
            order.full_name, 
            order.phone, 
            order.total_price, 
            order.created_at.strftime("%d-%m-%Y %H:%M"), 
            order.status
        ])
    
    return response

export_to_csv.short_description = '📄 Export to Excel (CSV)'

# =======================================================
# 2. PDF FATURA ALMA
# =======================================================
def download_pdf_invoice(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="invoices.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    for order in queryset:
        # --- BAŞLIK ---
        # Not: Türkçe karakter sorunu yaşamamak için Standart Font yerine
        # Harici bir .ttf fontu yüklenmesi gerekir. Şimdilik standart Helvetica kullanıldı.
        p.setFont("Helvetica-Bold", 20)
        p.drawString(50, height - 50, f"INVOICE #{order.id}")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 80, f"Customer: {order.full_name}")
        p.drawString(50, height - 100, f"Date: {order.created_at.strftime('%d-%m-%Y %H:%M')}")
        
        # Adres çok uzunsa PDF dışına taşmasın diye ilk 50 karakteri alıyoruz
        short_address = order.address[:50] + "..." if len(order.address) > 50 else order.address
        p.drawString(50, height - 120, f"Address: {short_address}")
        
        p.drawString(50, height - 140, f"Status: {order.status}")

        p.line(50, height - 160, 550, height - 160)

        # --- ÜRÜNLER ---
        y = height - 190
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Product Name")
        p.drawString(350, y, "Qty")
        p.drawString(450, y, "Price")
        
        y -= 20
        p.setFont("Helvetica", 12)

        items = order.items.all()
        for item in items:
            # Ürün adı çok uzunsa keselim
            prod_name = item.product_name[:35] if item.product_name else "Unknown Product"
            
            p.drawString(50, y, f"{prod_name}") 
            p.drawString(350, y, f"{item.quantity}")
            p.drawString(450, y, f"${item.product_price}")
            y -= 20
            
            # Sayfa sonuna gelirse yeni sayfa aç (Basit kontrol)
            if y < 100:
                p.showPage()
                y = height - 50
        
        # --- TOPLAM ---
        p.line(50, y - 10, 550, y - 10)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(350, y - 40, "TOTAL:")
        p.drawString(450, y - 40, f"${order.total_price}")

        p.showPage() # Her sipariş yeni sayfada başlasın

    p.save()
    return response

download_pdf_invoice.short_description = '🖨️ Download PDF Invoice'

# =======================================================
# 3. ADMIN SINIFLARI
# =======================================================

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    fields = ['product', 'product_name', 'quantity', 'product_price'] 
    readonly_fields = ['product_name', 'product_price']
    extra = 0

class OrderAdmin(SimpleHistoryAdmin):
    list_display = ['id', 'full_name', 'phone', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['full_name', 'phone', 'id']
    inlines = [OrderItemInline]
    actions = [export_to_csv, download_pdf_invoice]
    list_per_page = 20

class ProductAdmin(SimpleHistoryAdmin):
    list_display = ['name', 'price', 'stock', 'category'] 
    list_filter = ['category'] 
    search_fields = ['name', 'description']
    list_editable = ['price', 'stock'] 
    list_per_page = 20

class AddressAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'city', 'phone']
    list_filter = ['city']

class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'created_at']
    readonly_fields = ['name', 'email', 'subject', 'message', 'created_at']
    list_filter = ['created_at']

# =======================================================
# 4. KAYITLAR
# =======================================================
admin.site.register(Category)
admin.site.register(Product, ProductAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Coupon)
admin.site.register(Review)
admin.site.register(Address, AddressAdmin)
admin.site.register(ContactMessage, ContactMessageAdmin)