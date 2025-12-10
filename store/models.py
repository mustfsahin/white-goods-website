from django.db import models

# Category Table
class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Category Name")

    class Meta:
        verbose_name_plural = "Categories"  

    def __str__(self):
        return self.name

# Product Table
class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Category")
    name = models.CharField(max_length=200, verbose_name="Product Name")
    description = models.TextField(verbose_name="Description", blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price")
    stock = models.IntegerField(verbose_name="Stock Quantity")
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name="Product Image")
    
    def __str__(self):
        return self.name