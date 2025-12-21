from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone # Zaman kontrolü için gerekli

from .models import Product, Category, Order, OrderItem, ContactMessage, Review, Coupon, Address
from .serializers import (
    ProductSerializer, CategorySerializer, OrderSerializer, 
    UserSerializer, ContactSerializer, ReviewSerializer, AddressSerializer
)

# =======================================================
# 1. LİSTELEMELER
# =======================================================
class ProductListAPI(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class CategoryListAPI(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

# =======================================================
# 2. CHECKOUT (Sipariş Ver) - GÜVENLİ VERSİYON 🔒
# =======================================================
class CheckoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        coupon_code = data.get('coupon_code')
        
        # Frontend'den gelen ürün listesi
        items_data = data.get('items', [])
        
        if not items_data:
            return Response({"error": "Your cart is empty!"}, status=400)

        try:
            with transaction.atomic():
                # --- A. GÜVENLİ FİYAT HESAPLAMA ---
                # Frontend fiyatına güvenme! Veritabanından çek.
                total_price = 0
                products_to_buy = [] # Ürünleri burada toplayalım ki tekrar tekrar DB'ye gitmeyelim

                for item in items_data:
                    try:
                        # Ürünü isminden bul (veya ID de olabilir)
                        product = Product.objects.select_for_update().get(name=item['name'])
                        
                        # Stok Kontrolü
                        if product.stock < 1:
                            raise Exception(f"Sorry, '{product.name}' not available at stock!")
                        
                        # Adet (Şimdilik 1 varsayıyoruz, ilerde quantity eklersen burayı güncelle)
                        qty = 1 
                        
                        # Gerçek fiyatı topla
                        total_price += float(product.price) * qty
                        
                        # Listeye ekle (Sipariş oluştururken kullanacağız)
                        products_to_buy.append({
                            'product': product,
                            'price': float(product.price), # O anki güncel fiyat
                            'qty': qty
                        })
                        
                    except Product.DoesNotExist:
                        continue # Ürün bulunamazsa atla

                # --- B. KUPON İNDİRİMİ ---
                discount_amount = 0
                if coupon_code:
                    try:
                        # Aktif, süresi geçmemiş ve kodu doğru olan kuponu bul
                        coupon = Coupon.objects.get(
                            code=coupon_code, 
                            active=True,
                            valid_from__lte=timezone.now(),
                            valid_to__gte=timezone.now()
                        )
                        # Yüzdelik indirim uygula
                        discount_amount = (total_price * coupon.discount_percentage) / 100
                        total_price -= discount_amount
                        
                        # Eksiye düşerse 0 yap
                        if total_price < 0: total_price = 0
                        
                    except Coupon.DoesNotExist:
                        pass # Kupon geçersizse hata verme, indirimsiz devam et

                # --- C. SİPARİŞİ OLUŞTUR ---
                new_order = Order.objects.create(
                    user=request.user,
                    full_name=data.get('full_name'),
                    address=data.get('address'),
                    phone=data.get('phone'),
                    total_price=total_price,
                    status="Pending"
                )

                # --- D. ÜRÜNLERİ KAYDET VE STOK DÜŞ ---
                for p_data in products_to_buy:
                    product = p_data['product']
                    
                    # Stok düş
                    product.stock -= p_data['qty']
                    product.save()

                    # OrderItem oluştur
                    OrderItem.objects.create(
                        order=new_order,
                        product=product,
                        product_name=product.name,
                        product_price=p_data['price'],
                        quantity=p_data['qty']
                    )

            return Response({
                "message": "Order Received Successfully! ", 
                "order_id": new_order.id, 
                "final_price": total_price,
                "discount_applied": discount_amount > 0
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

# =======================================================
# 3. KULLANICI İŞLEMLERİ
# =======================================================
class UserOrdersAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

@api_view(['POST'])
def register_api(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "username": user.username, "full_name": f"{user.first_name} {user.last_name}"}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def login_api(request):
    user = authenticate(username=request.data.get('username'), password=request.data.get('password'))
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username, "full_name": f"{user.first_name} {user.last_name}"})
    return Response({"error": "Username or password is incorrect!"}, status=400)

# =======================================================
# 4. ADRES DEFTERİ
# =======================================================
class AddressAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        addrs = Address.objects.filter(user=request.user)
        return Response(AddressSerializer(addrs, many=True).data)
    
    def post(self, request):
        ser = AddressSerializer(data=request.data)
        if ser.is_valid():
            ser.save(user=request.user)
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)
    
    def delete(self, request):
        addr_id = request.query_params.get('id')
        Address.objects.filter(id=addr_id, user=request.user).delete()
        return Response({'msg': 'Adress deleted'})

# =======================================================
# 5. DİĞERLERİ (Yorum, İletişim, Profil)
# =======================================================
class ReviewAPI(APIView):
    def get(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response([])
        reviews = Review.objects.filter(product_id=product_id)
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        if not request.user.is_authenticated: 
            return Response({"error": "Please login first."}, status=401)
        
        product_id = request.data.get('product_id')
        
        # Zaten yorum yapmış mı kontrolü
        if Review.objects.filter(user=request.user, product_id=product_id).exists():
            return Response({"error": "You have already left a review for this product.!"}, status=400)

        try:
            Review.objects.create(
                user=request.user,
                username=request.user.username,
                product_id=product_id,
                rating=request.data['rating'],
                comment=request.data['comment']
            )
            return Response({"msg": "Comment added successfully"}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

# ContactAPI sınıfını bul ve bununla değiştir
class ContactAPI(APIView):
    # Bu satır, "Sadece giriş yapanlar erişebilir" demek:
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        # Önce kullanıcı gerçekten giriş yapmış mı ekstra kontrol (Garanti olsun)
        if not request.user.is_authenticated:
            return Response({"error": "You must login to send a message.!"}, status=401)

        # Gelen veriyi al
        serializer = ContactSerializer(data=request.data)
        
        if serializer.is_valid():
            # 🔥 Kaydederken 'user' bilgisini otomatik ekle
            serializer.save(user=request.user) 
            return Response({"msg": "Mesajınız alındı, teşekkürler! 📩"}, status=201)
        
        return Response(serializer.errors, status=400)

class ProfileAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        u = request.user
        return Response({
            "first_name": u.first_name, 
            "last_name": u.last_name, 
            "email": u.email, 
            "username": u.username
        })
    
    def put(self, request):
        u = request.user
        u.first_name = request.data.get('first_name', u.first_name)
        u.last_name = request.data.get('last_name', u.last_name)
        u.email = request.data.get('email', u.email)
        u.save()
        return Response({"msg": "Profil updated", "full_name": f"{u.first_name} {u.last_name}"})