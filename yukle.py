import os
import django
import random

# 1. Django Ayarları
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eticaret_backend.settings')
django.setup()

# 2. Modelleri Çağır
from store.models import Category, Product

def load_data():
    print("🧹 Cleaning old data...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    print("📦 Creating English Categories...")
    
    # --- KATEGORİLER ---
    cats = {
        'Refrigerators': Category.objects.create(name='Refrigerators'),
        'Washing Machines': Category.objects.create(name='Washing Machines'),
        'Dishwashers': Category.objects.create(name='Dishwashers'),
        'Ovens & Cookers': Category.objects.create(name='Ovens & Cookers'),
        'Small Appliances': Category.objects.create(name='Small Appliances'),
        'Air Conditioning': Category.objects.create(name='Air Conditioning'),
        'TV & Audio': Category.objects.create(name='TV & Audio'), # Yeni Kategori!
    }

    # --- ÜRÜNLER (Genişletilmiş Liste) ---
    products = [
        # --- REFRIGERATORS ---
        ("Samsung RT46 Double Door Fridge", 850.00, "Refrigerators", "No-Frost, large capacity."),
        ("Bosch KGN86 XXL Fridge", 1200.00, "Refrigerators", "Extra large capacity technology."),
        ("LG InstaView Door-in-Door", 2500.00, "Refrigerators", "See inside without opening."),
        ("Vestel Eko Low Frost", 450.00, "Refrigerators", "Budget friendly option."),
        ("Altus 300L Mini Fridge", 250.00, "Refrigerators", "Perfect for offices."),
        ("Grundig Single Door Fridge", 600.00, "Refrigerators", "Stylish design."),

        # --- WASHING MACHINES ---
        ("Samsung 9kg Ecobubble Washer", 600.00, "Washing Machines", "Efficient cleaning."),
        ("LG Steam Direct Drive 10kg", 750.00, "Washing Machines", "Steam cleaning with AI."),
        ("Whirlpool Supreme Care 8kg", 450.00, "Washing Machines", "Silent motor technology."),
        ("Hoover 12kg Mega Washer", 850.00, "Washing Machines", "Huge capacity for large families."),
        ("Electrolux Dryer 9kg", 700.00, "Washing Machines", "Heat pump drying technology."),

        # --- DISHWASHERS ---
        ("Siemens iQ300 Dishwasher", 550.00, "Dishwashers", "Smart dishwasher."),
        ("Bosch Series 6 Silence Plus", 680.00, "Dishwashers", "Super silent operation."),
        ("Vestel BM 401", 300.00, "Dishwashers", "4 program basic dishwasher."),
        ("Altus AL 434", 280.00, "Dishwashers", "Economic choice."),

        # --- OVENS & COOKERS ---
        ("Bosch Built-in Oven", 450.00, "Ovens & Cookers", "Turbo fan cooking."),
        ("Samsung Dual Cook Flex", 900.00, "Ovens & Cookers", "Cook two meals at once."),
        ("Kumtel Mini Oven", 80.00, "Ovens & Cookers", "Compact countertop oven."),
        ("Franke Gas Hob", 350.00, "Ovens & Cookers", "4 burner gas hob."),

        # --- SMALL APPLIANCES ---
        ("Dyson V15 Detect Vacuum", 800.00, "Small Appliances", "Laser dust detection."),
        ("Philips Airfryer XXL", 350.00, "Small Appliances", "Fat removal technology."),
        ("Nespresso Coffee Machine", 200.00, "Small Appliances", "Barista style coffee."),
        ("Tefal Steam Iron", 120.00, "Small Appliances", "Powerful steam boost."),
        ("KitchenAid Stand Mixer", 650.00, "Small Appliances", "Professional dough mixing."),
        ("Braun Blender Set", 90.00, "Small Appliances", "Hand blender with accessories."),
        ("Philips Hair Dryer", 75.00, "Small Appliances", "Ionic care for shiny hair."),

        # --- AIR CONDITIONING ---
        ("Mitsubishi Heavy Inverter AC", 1100.00, "Air Conditioning", "High energy efficiency."),
        ("Daikin Sensira Wall Mount", 950.00, "Air Conditioning", "Reliable cooling."),
        ("Beko Portable AC", 400.00, "Air Conditioning", "Easy to move air conditioner."),

        # --- TV & AUDIO (Bonus) ---
        ("Samsung 55 Inch 4K TV", 750.00, "TV & Audio", "Crystal clear UHD resolution."),
        ("LG OLED 65 Inch TV", 1800.00, "TV & Audio", "Perfect black and colors."),
        ("Sony Soundbar System", 300.00, "TV & Audio", "Cinematic sound experience."),
    ]

    print(f"🚀 Adding {len(products)} products to the store...")

    for name, price, cat_name, desc in products:
        Product.objects.create(
            name=name,
            category=cats[cat_name],
            description=desc,
            price=price,
            stock=random.randint(5, 50)
        )
        print(f"   ✅ Added: {name}")

    print("\n🎉 SUCCESS! The store is now FULLY STOCKED with English data.")

if __name__ == '__main__':
    load_data()