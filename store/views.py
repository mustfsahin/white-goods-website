from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction

from .models import Product, Category, Order, OrderItem, ContactMessage, Review, Coupon, Address
from .serializers import (
    ProductSerializer, CategorySerializer, OrderSerializer, 
    UserSerializer, ContactSerializer, ReviewSerializer, AddressSerializer
)

# 1. LİSTELEMELER
class ProductListAPI(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class CategoryListAPI(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

# 2. CHECKOUT (Sipariş Ver) - STOK VE KUPON SİSTEMİ
class CheckoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        coupon_code = data.get('coupon_code')

        try:
            with transaction.atomic():
                # A. Toplam Tutar Hesapla
                total_price = sum(float(item['price']) for item in data['items'])

                # B. Kupon Varsa İndirim Yap
                if coupon_code:
                    try:
                        coupon = Coupon.objects.get(code=coupon_code, active=True)
                        discount = (total_price * coupon.discount_amount) / 100 # Modelde discount_amount demiştik
                        total_price -= discount
                    except Coupon.DoesNotExist:
                        pass

                # C. Siparişi Oluştur (Veritabanına Kaydet)
                new_order = Order.objects.create(
                    user=request.user,
                    full_name=data['full_name'],
                    address=data['address'],
                    phone=data['phone'],
                    total_price=total_price,
                    status="Pending"
                )

                # D. Ürünleri Stoktan Düş ve Kaydet
                for item in data['items']:
                    product = Product.objects.get(name=item['name'])
                    if product.stock < 1:
                        raise Exception(f"Üzgünüz, {product.name} tükendi!")
                    
                    product.stock -= 1
                    product.save()

                    OrderItem.objects.create(
                        order=new_order,
                        product=product,
                        product_name=product.name,
                        product_price=item['price'],
                        quantity=1
                    )

            return Response({"message": "Sipariş Alındı!", "order_id": new_order.id, "final_price": total_price}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

# 3. KULLANICI İŞLEMLERİ
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
    return Response({"error": "Hatalı giriş!"}, status=400)

# 4. ADRES DEFTERİ
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
        Address.objects.filter(id=request.query_params.get('id'), user=request.user).delete()
        return Response({'msg': 'Deleted'})

# 5. DİĞERLERİ (Yorum, İletişim, Profil)

# 🔥 GÜNCELLENEN KISIM BURASI (ReviewAPI) 🔥
class ReviewAPI(APIView):
    def get(self, request):
        # Bir ürünün yorumlarını getir
        reviews = Review.objects.filter(product_id=request.query_params.get('product_id'))
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        # 1. Kullanıcı giriş yapmış mı?
        if not request.user.is_authenticated: 
            return Response({"error": "Lütfen önce giriş yapın."}, status=401)
        
        product_id = request.data['product_id']

        # 2. 🔥 KONTROL: Bu kullanıcı bu ürüne daha önce yorum yapmış mı?
        already_reviewed = Review.objects.filter(user=request.user, product_id=product_id).exists()
        if already_reviewed:
            return Response({"error": "Bu ürüne zaten yorum yaptınız!"}, status=400)

        # 3. Yoksa yorumu oluştur
        try:
            Review.objects.create(
                user=request.user,
                username=request.user.username, # Kullanıcı adını otomatik ekledim
                product_id=product_id,
                rating=request.data['rating'],
                comment=request.data['comment']
            )
            return Response({"msg": "Yorum başarıyla eklendi"}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ContactAPI(APIView):
    def post(self, request):
        ser = ContactSerializer(data=request.data)
        if ser.is_valid(): ser.save(); return Response({"msg": "Mesaj alındı"}, status=201)
        return Response(ser.errors, status=400)

class ProfileAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({"first_name": u.first_name, "last_name": u.last_name, "email": u.email, "username": u.username})
    def put(self, request):
        u = request.user
        u.first_name = request.data.get('first_name', u.first_name)
        u.last_name = request.data.get('last_name', u.last_name)
        u.email = request.data.get('email', u.email)
        u.save()
        return Response({"msg": "Güncellendi", "full_name": f"{u.first_name} {u.last_name}"})