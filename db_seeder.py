import os
import django
import random

# Django ayarlarını bu dosyaya tanıtıyoruz
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eticaret_backend.settings')
django.setup()

from store.models import Category, Product

def populate():
    # Önce temizlik yapalım (Eski verileri sil)
    print("🧹 Cleaning old data...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    # KATEGORİLER VE ÜRÜNLER (TAMAMEN İNGİLİZCE)
    data = {
        "Smartphones": [
            {"name": "iPhone 15 Pro Max", "price": 1199.00, "desc": "The ultimate iPhone with titanium design, A17 Pro chip, and the most powerful camera system yet."},
            {"name": "Samsung Galaxy S24 Ultra", "price": 1299.00, "desc": "Unleash new possibilities with Galaxy AI. Titanium frame, massive screen, and S-Pen included."},
            {"name": "Google Pixel 8 Pro", "price": 999.00, "desc": "The most pro Pixel ever. Best-in-class camera with AI editing tools and pure Android experience."},
            {"name": "OnePlus 12", "price": 799.00, "desc": "Smooth beyond belief. Snapdragon 8 Gen 3, huge battery, and ultra-fast charging."},
            {"name": "Xiaomi 14 Ultra", "price": 1099.00, "desc": "Legendary Leica optics meets powerful performance. A photography beast in your pocket."},
            {"name": "iPhone 13", "price": 599.00, "desc": "Still amazing. Dual-camera system, durable design, and all-day battery life."},
        ],
        "Laptops & Computers": [
            {"name": "MacBook Air M3", "price": 1099.00, "desc": "Lean. Mean. M3 Machine. The world's most popular laptop is now better than ever."},
            {"name": "Dell XPS 15", "price": 1499.00, "desc": "Immersive display, high performance. Perfect for creators and professionals."},
            {"name": "ASUS ROG Zephyrus G14", "price": 1599.00, "desc": "The world's most powerful 14-inch gaming laptop. AMD Ryzen 9 and RTX 4070."},
            {"name": "Lenovo ThinkPad X1 Carbon", "price": 1399.00, "desc": "Ultralight and ultratough. The gold standard for business laptops."},
            {"name": "HP Spectre x360", "price": 1249.00, "desc": "Convertible 2-in-1 laptop with a stunning OLED touch display and premium design."},
            {"name": "Logitech MX Master 3S", "price": 99.00, "desc": "An icon remastered. Quiet clicks and 8K DPI track-on-glass sensor."},
        ],
        "Audio & Headphones": [
            {"name": "Sony WH-1000XM5", "price": 348.00, "desc": "Industry-leading noise canceling headphones with crystal clear hands-free calling."},
            {"name": "AirPods Pro (2nd Gen)", "price": 249.00, "desc": "Up to 2x more Active Noise Cancellation. Personalized Spatial Audio with dynamic head tracking."},
            {"name": "Bose QuietComfort Ultra", "price": 429.00, "desc": "World-class noise cancellation, quieter than ever before. Breakthrough spatial audio."},
            {"name": "JBL Flip 6 Speaker", "price": 129.00, "desc": "Bold sound for every adventure. Waterproof and dustproof portable Bluetooth speaker."},
            {"name": "Sennheiser Momentum 4", "price": 299.00, "desc": "Premium sound quality with 60-hour battery life and adaptive noise cancellation."},
            {"name": "Marshall Stanmore III", "price": 379.00, "desc": "Legendary sound. A Bluetooth speaker with a classic rock'n'roll design."},
        ],
        "Wearables & Smartwatches": [
            {"name": "Apple Watch Ultra 2", "price": 799.00, "desc": "The most rugged and capable Apple Watch. Designed for outdoor adventure and endurance training."},
            {"name": "Samsung Galaxy Watch 6", "price": 299.00, "desc": "Unlock your best self. Sleep coaching, heart monitoring, and seamless connectivity."},
            {"name": "Garmin Fenix 7 Pro", "price": 899.00, "desc": "Solar powered multisport GPS watch. Built for the toughest challenges."},
            {"name": "Fitbit Charge 6", "price": 159.00, "desc": "Give your routine a boost. Fitness tracker with Google apps and heart rate tools."},
            {"name": "Oura Ring Gen3", "price": 299.00, "desc": "Sleep and activity tracker wrapped in a stylish titanium ring."},
        ],
        "Gaming & Consoles": [
            {"name": "PlayStation 5 Slim", "price": 499.00, "desc": "Play Has No Limits. Lightning speed, haptic feedback, and 3D Audio."},
            {"name": "Xbox Series X", "price": 499.00, "desc": "Power your dreams. The fastest, most powerful Xbox ever."},
            {"name": "Nintendo Switch OLED", "price": 349.00, "desc": "Play anytime, anywhere. 7-inch OLED screen for vivid colors."},
            {"name": "Steam Deck OLED", "price": 549.00, "desc": "Portability meets power. Your Steam library, anywhere you go."},
            {"name": "DualSense Controller", "price": 69.00, "desc": "Discover a deeper gaming experience with the innovative PS5 controller."},
            {"name": "Razer BlackWidow V4", "price": 169.00, "desc": "Mechanical gaming keyboard with Razer Chroma RGB and tactile switches."},
        ]
    }

    print("🚀 Starting to populate database...")

    for cat_name, products in data.items():
        # Kategoriyi oluştur
        category = Category.objects.create(name=cat_name)
        print(f"📂 Category Created: {cat_name}")

        for prod in products:
            # Ürünü oluştur
            Product.objects.create(
                category=category,
                name=prod["name"],
                description=prod["desc"],
                price=prod["price"],
                stock=random.randint(5, 50), # Rastgele stok (5 ile 50 arası)
                image=None # Resim boş kalsın, frontend placeholder koyacak
            )
            print(f"   - Added: {prod['name']}")

    print("\n✅ SUCCESS! Database populated with dummy data.")

if __name__ == '__main__':
    populate()