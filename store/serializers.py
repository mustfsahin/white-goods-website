from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Category, Order, OrderItem, ContactMessage, Review, Coupon, Address

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.ImageField(source='product.image', read_only=True)
    class Meta:
        model = OrderItem
        fields = ['product_name', 'product_price', 'quantity', 'product_image']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

# store/serializers.py dosyasındaki ContactSerializer'ı bununla değiştir:

class ContactSerializer(serializers.ModelSerializer):
    # 🔥 BU SATIR ÇOK ÖNEMLİ: User'ı frontend'den bekleme, ben views'de ekleyeceğim diyoruz.
    user = serializers.PrimaryKeyRelatedField(read_only=True) 

    class Meta:
        model = ContactMessage
        fields = ['id', 'user', 'name', 'email', 'subject', 'message', 'created_at']
        # Veya fields = '__all__' kullanıyorsan da üstteki user satırı işi çözer.

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'title', 'full_address', 'city', 'phone']