<template>
    <v-container>
  
      <!-- New statistic cards section -->
      <v-row>
        <v-col cols="12" md="6" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-warehouse</v-icon>
              Total Inventory Items
            </v-card-title>
            <v-card-text class="text-center">
              <h2>{{ totalInventoryItems }}</h2>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Delete Dialog -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this inventory item?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteInventory(inventoryToDelete)" color="red">Delete</v-btn>
            <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-row>
        <v-col cols="12" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-warehouse</v-icon>
              Inventory Management
              <v-spacer></v-spacer>
              <v-btn icon color="blue" @click="openAddDialog">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-card-title>
            <v-data-table :headers="inventoryHeaders" :items="filteredInventory" item-key="id" class="elevation-1"
              :header-class="{ 'text-align-center': true }">
              <template v-slot:item.actions="{ item }">
                <v-btn icon @click="editInventory(item)" aria-label="Edit Inventory" text>
                  <v-icon color="blue">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="confirmDeleteInventory(item.id)" aria-label="Delete Inventory" text>
                  <v-icon color="red">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Add Inventory Dialog -->
      <v-dialog v-model="addInventoryDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">{{ inventorySubmitButtonText }}</v-card-title>
          <v-divider></v-divider>
          <v-form @submit.prevent="submitInventory" class="pa-4">
            
            <v-autocomplete v-model="inventoryForm.ProductName" :items="filteredProducts" item-text="name"
              item-value="name" label="Product Name" outlined dense required clearable @change="onProductNameChange" />
            <v-text-field v-model="inventoryForm.Quantity" label="Quantity" outlined dense required type="number" />
            <v-select v-model="inventoryForm.InventoryType" :items="inventoryTypeOptions" label="Inventory Type" outlined
              dense required />
            <v-text-field v-model="inventoryForm.InventoryDate" label="Inventory Date" outlined dense required
              type="date" />
            <v-textarea v-model="inventoryForm.InventoryDescription" label="Inventory Description" outlined dense />
            <v-card-actions class="d-flex justify-end">
              <v-btn text color="green" type="submit">{{ inventorySubmitButtonText }}</v-btn>
              <v-btn text color="grey" @click="closeAddDialog">Cancel</v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-dialog>
  
      <v-row>
        <v-col cols="12" md="6" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2" style="color: red;">mdi-alert</v-icon>
              Low Stock Items
            </v-card-title>
            <v-card-text class="text-center">
              <!-- Displaying the number of critical stock items -->
              <h2>{{ criticalStockItems.length }}</h2>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col cols="12" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2" style="color: red;">mdi-alert</v-icon>
              Critical Stock Items
            </v-card-title>
            <v-data-table :headers="lowStockHeaders" :items="criticalStockItems" item-key="id" class="elevation-1"
              :header-class="{ 'text-align-center': true }">
              <template v-slot:item.Quantity="{ item }">
                <div>
                  {{ item.Quantity }}
                  <v-badge color="red" content="Critical Stock" class="ml-2"></v-badge>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
    </v-container>
  </template>
  
  <script>
  import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
  import { firestore } from '~/plugins/firebase';
  
  export default {
    data() {
      return {
        inventoryHeaders: [
          { text: 'Product Name', value: 'ProductName' },
          { text: 'Quantity', value: 'Quantity' },
          { text: 'Inventory Type', value: 'InventoryType' },
          { text: 'Inventory Date', value: 'InventoryDate' },
          { text: 'Inventory Description', value: 'InventoryDescription' },
          { text: 'Actions', value: 'actions', sortable: false }
        ],
        lowStockHeaders: [ // Added lowStockHeaders without actions
          { text: 'Product Name', value: 'ProductName' },
          { text: 'Quantity', value: 'Quantity' },
          { text: 'Inventory Type', value: 'InventoryType' },
          { text: 'Inventory Date', value: 'InventoryDate' },
          { text: 'Inventory Description', value: 'InventoryDescription' }
        ],
        inventoryItems: [],  // Holds actual inventory data
        products: [],        // Holds the product list
        inventoryTypeOptions: ['Restock', 'Sales', 'Other'],  // Inventory Type Options
        inventoryForm: {
          ProductID: '',
          ProductName: '',
          Quantity: 0,  // Default value for Quantity
          InventoryType: '',  // Initially empty
          InventoryDate: '',
          InventoryDescription: '',
          CriticalStockLevel: 40 // Critical stock level is now 40
        },
        addInventoryDialog: false,
        inventorySubmitButtonText: 'Add Inventory',
        deleteDialog: false,
        inventoryToDelete: null,
        inventoryIdToEdit: null,
        searchQuery: '',  // Search query for filtering
      };
    },
    computed: {
      totalInventoryItems() {
        return this.inventoryItems.length; // Total number of inventory items
      },
      filteredProducts() {
        const query = this.searchQuery.toLowerCase();
        return this.products.filter(product =>
          product.name.toLowerCase().includes(query)
        );
      },
      filteredInventory() {
        const query = this.searchQuery.toLowerCase();
        return this.inventoryItems.filter(item =>
          item.ProductName.toLowerCase().includes(query)
        ).sort((a, b) => a.ProductName.localeCompare(b.ProductName));
      },
      lowStockItems() {
        return this.inventoryItems
          .filter(item => item.Quantity < item.CriticalStockLevel)
          .sort((a, b) => a.ProductName.localeCompare(b.ProductName)); // Sorting by ProductName
      },
      criticalStockItems() {
        // Filtering inventory items with quantities below the critical stock level
        return this.inventoryItems.filter(item => item.Quantity <= 40); // Now checks for <= 40
      }
    },
    mounted() {
      this.loadProducts();    // Load products when the component is mounted
      this.loadInventory();   // Load inventory (also adds missing products with Quantity 0)
      this.listenToOrders(); // Start listening to new orders
    },
    methods: {
      listenToOrders() {
        const ordersRef = collection(firestore, 'Orders');
  
        onSnapshot(ordersRef, async (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const order = change.doc.data();
              await this.processOrder(order);
            }
          });
        });
      },
      async processOrder(order) {
        try {
          // Use writeBatch from Firestore
          const batch = writeBatch(firestore);
  
          for (const item of order.cartItems || []) {
            const { productName, Quantity: orderQuantity } = item;
  
            // Fetch matching inventory item
            const inventoryRef = collection(firestore, 'Inventory');
            const inventorySnapshot = await getDocs(inventoryRef);
            const inventoryDoc = inventorySnapshot.docs.find(
              (doc) => doc.data().ProductName === productName
            );
  
            if (inventoryDoc) {
              const inventoryData = inventoryDoc.data();
              const newQuantity = inventoryData.Quantity - orderQuantity;
  
              if (newQuantity < 0) {
                console.warn(`Not enough stock for ${productName}`);
              } else {
                const docRef = doc(firestore, 'Inventory', inventoryDoc.id);
                batch.update(docRef, { Quantity: newQuantity });
              }
            } else {
              console.warn(`Product ${productName} not found in inventory.`);
            }
          }
  
          await batch.commit(); // Apply all updates
        } catch (error) {
          console.error('Error processing order:', error);
        }
      },
      onProductNameChange(selectedProductName) {
        // Find the selected product by name
        const selectedProduct = this.products.find(
          (product) => product.name === selectedProductName
        );
  
        // Fetch the ProductID
        this.inventoryForm.ProductID = selectedProduct ? selectedProduct.id : '';
  
        // Check if this product already exists in the inventory
        const existingInventory = this.inventoryItems.find(
          (item) => item.ProductID === this.inventoryForm.ProductID
        );
  
        // Set the Quantity field based on existing inventory or default to 0
        this.inventoryForm.Quantity = existingInventory ? existingInventory.Quantity : 0;
      },
      openAddDialog() {
        this.addInventoryDialog = true;
        this.resetInventoryForm();
        this.inventorySubmitButtonText = 'Add Inventory';
      },
      closeAddDialog() {
        this.addInventoryDialog = false;
      },
      async loadInventory() {
        try {
          const inventoryRef = collection(firestore, 'Inventory');
          onSnapshot(inventoryRef, (snapshot) => {
            const inventoryMap = new Map();
  
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const item = {
                id: doc.id,
                ProductID: data.ProductID,
                ProductName: data.ProductName,
                Quantity: data.Quantity,
                InventoryType: data.InventoryType,
                InventoryDate: data.InventoryDate,
                InventoryDescription: data.InventoryDescription,
                CriticalStockLevel: data.CriticalStockLevel || 50, // Default to 50 if not set
                lowStock: data.Quantity < (data.CriticalStockLevel || 50) // Flag for low stock
              };
              inventoryMap.set(item.ProductID, item);
            });
  
            this.inventoryItems = Array.from(inventoryMap.values());
  
            this.products.forEach((product) => {
              if (!inventoryMap.has(product.id)) {
                addDoc(collection(firestore, 'Inventory'), {
                  ProductID: product.id,
                  ProductName: product.name,
                  Quantity: 0,
                  InventoryType: 'Restock',
                  InventoryDate: new Date().toISOString(),
                  InventoryDescription: 'Added by default',
                  CriticalStockLevel: 50 // Set default CriticalStockLevel to 50
                });
              }
            });
          });
        } catch (error) {
          console.error("Error loading inventory:", error);
        }
      },
  
      async loadProducts() {
        try {
          const snapshot = await getDocs(collection(firestore, 'Products'));
          this.products = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().ProductName
          }));
        } catch (error) {
          console.error("Error loading products:", error);
        }
      },
  
      fetchProductID() {
        const selectedProduct = this.products.find(product => product.name === this.inventoryForm.ProductName);
        this.inventoryForm.ProductID = selectedProduct ? selectedProduct.id : '';
      },
  
      async submitInventory() {
        try {
          const inventoryRef = collection(firestore, 'Inventory');
          if (this.inventoryIdToEdit) {
            const inventoryDoc = doc(inventoryRef, this.inventoryIdToEdit);
            await updateDoc(inventoryDoc, this.inventoryForm);
            this.inventoryIdToEdit = null;
          } else {
            await addDoc(inventoryRef, this.inventoryForm);
          }
          this.loadInventory();
          this.closeAddDialog();
        } catch (error) {
          console.error('Error submitting inventory:', error);
        }
      },
  
      resetInventoryForm() {
        this.inventoryForm = {
          ProductID: '',
          ProductName: '',
          Quantity: 0,
          InventoryType: '',
          InventoryDate: '',
          InventoryDescription: '',
        };
        this.inventoryIdToEdit = null;
      },
  
      editInventory(item) {
        this.inventoryIdToEdit = item.id;
        this.inventoryForm = { ...item }; // Fill the form with the item's data
        this.inventorySubmitButtonText = 'Update Inventory'; // Update the dialog title/button
        this.addInventoryDialog = true; // Open the dialog
      },
      confirmDeleteInventory(id) {
        this.inventoryToDelete = id;
        this.deleteDialog = true;
      },
  
      async deleteInventory(id) {
        try {
          await deleteDoc(doc(firestore, 'Inventory', id));
          this.deleteDialog = false;  // Close the dialog
        } catch (error) {
          console.error("Error deleting inventory:", error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .dashboard-card {
    background-color: #333;
    color: white;
    padding: 40px;
  }
  
  .text-align-center {
    text-align: center;
  }
  </style>