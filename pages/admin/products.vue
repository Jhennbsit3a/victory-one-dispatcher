<template>
    <v-container>
  
      <v-row>
        <v-col cols="12" md="4" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-cube</v-icon>
              Total Products
            </v-card-title>
            <v-card-text class="text-h2">{{ totalProducts }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col cols="12" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-cube</v-icon>
              Product Management
              <v-spacer></v-spacer>
              <v-btn @click="openAddProductDialog" color="primary" icon class="ml-4">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-card-title>
  
            <v-data-table :headers="productHeaders" :items="filteredProducts" item-key="ProductID" class="elevation-1"
              :header-class="{ 'text-align-center': true }">
              <template v-slot:item.actions="{ item }">
                <v-btn @click="editProduct(item)" color="blue" icon>
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn @click="confirmDeleteProduct(item.ProductID)" color="red" icon>
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <!-- New View Details Button -->
                <v-btn @click="viewProductDetails(item)" color="green" icon>
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
      <v-dialog v-model="editDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">{{ editingProductID ? 'Edit Product' : 'Add Product' }}</v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field v-model="productForm.ProductName" label="Product Name" outlined dense required
                :rules="[validateProductName]" @input="cleanProductName"></v-text-field>
              <v-text-field v-model="productForm.Price" label="Price" type="number" outlined dense
                required></v-text-field>
              <v-select v-model="productForm.CategoryID" :items="categories" item-text="ProductType"
                item-value="CategoryID" label="Product Type" outlined dense required></v-select>
              <v-textarea v-model="productForm.ProductDescription" label="Product Description" outlined dense
                required></v-textarea>
              <v-file-input v-model="imageFile" label="Upload Image" outlined dense accept="image/*"
                @change="onImageUpload"></v-file-input>
              <!-- <v-text-field v-model="imageUrl" label="Image URL (optional)" outlined dense></v-text-field> -->
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="submitProduct">{{ editingProductID ? 'Update' : 'Add' }}</v-btn>
            <v-btn @click="closeEditDialog" color="secondary">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this product?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="deleteProduct(productToDelete)" color="red">Delete</v-btn>
            <v-btn @click="deleteDialog = false" color="secondary">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Product Details Dialog -->
      <v-dialog v-model="detailsDialog" max-width="500">
        <v-card>
          <v-card-title class="headline text-center justify-center" style="margin-bottom: 10px;">Product
            Details</v-card-title>
          <v-card-text>
            <p style="color: black"><strong>Product Name:</strong> {{ productDetails.ProductName }}</p>
            <p style="color: black"><strong>Price:</strong> ₱{{ productDetails.Price }}</p>
            <p style="color: black"><strong>Category:</strong> {{ productDetails.ProductType }}</p>
            <p style="color: black"><strong>Description:</strong> {{ productDetails.ProductDescription }}</p>
            <v-img :src="productDetails.Image" height="200px" class="mt-4"></v-img>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="detailsDialog = false" style="background-color: #ffa900; color: white;">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this product?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteProduct(productToDelete)" color="red">Delete</v-btn>
            <v-btn text @click="deleteDialog = false" color=" ">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-card class="elevation-2 mt-4">
        <v-card-title class="headline text-center">
          <v-icon class="mr-2">mdi-history</v-icon>
          Action Logs
        </v-card-title>
        <v-data-table :headers="logHeaders" :items="logs" item-key="timestamp" class="elevation-1">
          <template v-slot:item.timestamp="{ item }">
            {{ new Date(item.timestamp).toLocaleString() }}
          </template>
        </v-data-table>
      </v-card>
  
    </v-container>
  </template>
  
  <script>
  import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
  import { firestore } from '~/plugins/firebase';
  
  export default {
    data() {
      return {
        editDialog: false,
        detailsDialog: false,
        productDetails: {},
        searchQuery: '', // Holds the search query for filtering
        totalProducts: 0, // New property for total products
        logs: [], // Logs array
        logHeaders: [
          { text: 'Timestamp', value: 'timestamp' },
          { text: 'Action', value: 'action' },
          { text: 'Details', value: 'details' },
        ],
        productHeaders: [
          { text: 'Product Type', value: 'ProductType' },
          { text: 'Product Name', value: 'ProductName' },
          { text: 'Price', value: 'Price' },
          { text: 'Actions', value: 'actions', sortable: false }
        ],
        products: [],
        categories: [],
        productForm: {
          ProductName: '',
          Price: '',
          CategoryID: '',
          ProductDescription: '',
          Image: '' // This will hold the base64 string or URL
        },
        newCategory: {
          ProductType: '' // New data property for the additional category
        },
        imageFile: null, // Holds the uploaded image file
        imageUrl: '', // Holds the image URL from the text field
        editingProductID: null,
        deleteDialog: false,
        productToDelete: null
      };
    },
    computed: {
      filteredProducts() {
        // Step 1: Filter based on the search query
        let filteredList = this.products;
        if (this.searchQuery) {
          filteredList = this.products.filter(product =>
            product.ProductName.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
  
        // Step 2: Sort the filtered list alphabetically by ProductName
        return filteredList.sort((a, b) => a.ProductName.localeCompare(b.ProductName));
      }
    },
    mounted() {
      this.loadCategories();
      this.loadProducts();
      this.loadLogs(); // Load logs from localStorage
    },
    methods: {
      cleanProductName() {
        this.productForm.ProductName = this.productForm.ProductName.replace(/[^a-zA-Z\s]/g, '');
      },
      validateProductName(value) {
        if (!value) {
          return 'Product Name is required.';
        }
        const regex = /^[a-zA-Z\s]+$/;
        if (!regex.test(value)) {
          return 'Product Name must only contain letters and spaces.';
        }
        return true;
      },
      addLog(action, details) {
        const logEntry = {
          timestamp: Date.now(),
          action,
          details,
        };
        this.logs.push(logEntry);
        localStorage.setItem('productLogs', JSON.stringify(this.logs)); // Persist to localStorage
      },
      loadLogs() {
        const savedLogs = localStorage.getItem('productLogs');
        if (savedLogs) {
          this.logs = JSON.parse(savedLogs);
        }
      },
      viewProductDetails(item) {
        this.productDetails = item; // Set the selected product details
        this.detailsDialog = true;  // Open the dialog
      },
      async loadCategories() {
        const snapshot = await getDocs(collection(firestore, 'Categories'));
        this.categories = snapshot.docs.map(doc => ({
          CategoryID: doc.id,
          ...doc.data()
        }));
      },
      async loadProducts() {
        const productsRef = collection(firestore, 'Products');
        onSnapshot(productsRef, (snapshot) => {
          this.products = snapshot.docs.map(doc => {
            const data = doc.data();
            const category = this.categories.find(cat => cat.CategoryID === data.CategoryID);
            return {
              ProductID: doc.id,
              ProductName: data.ProductName,
              ProductType: category ? category.ProductType : 'Unknown',
              Price: data.Price,
              ProductDescription: data.ProductDescription,
              Image: data.Image,
            };
          });
          this.totalProducts = this.products.length; // Update total products count
        });
      },
      resetProductForm() {
        this.productForm = {
          ProductName: '',
          Price: '',
          CategoryID: '',
          ProductDescription: '',
          Image: ''
        };
        this.newCategory.ProductType = ''; // Reset the new category field
        this.imageFile = null; // Reset image file
        this.imageUrl = ''; // Reset image URL
        this.editingProductID = null;
      },
      confirmDeleteProduct(productID) {
        this.productToDelete = productID;
        this.deleteDialog = true;
      },
      // Override methods to add logs
      async deleteProduct(productID) {
        try {
          await deleteDoc(doc(firestore, 'Products', productID));
          this.addLog('Deleted Product', `ProductID: ${productID}`);
          this.loadProducts();
          this.deleteDialog = false;
        } catch (error) {
          console.error('Error deleting product: ', error);
        }
      },
      async submitProduct() {
        if (this.editingProductID) {
          const productRef = doc(firestore, 'Products', this.editingProductID);
          await updateDoc(productRef, {
            ProductName: this.productForm.ProductName,
            Price: this.productForm.Price,
            CategoryID: this.productForm.CategoryID,
            ProductDescription: this.productForm.ProductDescription,
            Image: this.imageUrl || this.productForm.Image,
          });
          this.addLog(
            'Edited Product',
            `ProductID: ${this.editingProductID}, Name: ${this.productForm.ProductName}`
          );
          this.editingProductID = null;
        } else {
          const docRef = await addDoc(collection(firestore, 'Products'), {
            ProductName: this.productForm.ProductName,
            Price: this.productForm.Price,
            CategoryID: this.productForm.CategoryID,
            ProductDescription: this.productForm.ProductDescription,
            Image: this.imageUrl,
          });
          this.addLog(
            'Added Product',
            `ProductID: ${docRef.id}, Name: ${this.productForm.ProductName}`
          );
        }
        this.loadProducts();
        this.closeEditDialog();
      },
  
      editProduct(item) {
        this.editingProductID = item.ProductID; // Set the product ID
        this.productForm = { ...item }; // Populate form with the product's data
        this.productForm.CategoryID = this.categories.find(category => category.ProductType === item.ProductType)?.CategoryID || '';
        this.imageUrl = item.Image; // Populate the image URL field
        this.editDialog = true; // Open the dialog
      },
      onImageUpload() {
        if (this.imageFile) {
          const file = this.imageFile; // Directly access the selected file
  
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imageUrl = e.target.result; // Set the image URL to the base64 string
          };
          reader.readAsDataURL(file);
        } else {
          console.error('No file selected');
        }
      },
      onUrlInput() {
        // Handle logic for URL input if needed
      },
      closeEditDialog() {
        this.editDialog = false; // Close the dialog
        this.resetProductForm(); // Reset the form
      },
      openAddProductDialog() {
        this.editingProductID = null; // Clear any editing state
        this.resetProductForm(); // Reset the form
        this.editDialog = true; // Open the dialog for adding a new product
      },
    }
  };
  </script>
  
  <style>
  .dashboard-card {
    background-color: #333;
    color: white;
    padding: 40px;
  }
  </style>