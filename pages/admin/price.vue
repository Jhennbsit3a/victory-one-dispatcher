<template>
    <v-container>
      <v-row>
        <v-col cols="12" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-currency-php</v-icon>
              Price Management Logs
              <v-spacer></v-spacer>
              <v-btn icon @click="openAddPriceDialog" aria-label="Add Price" color="primary" class="ml-4">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-card-title>
  
            <!-- Price History Table -->
            <v-data-table :headers="priceHeaders" :items="filteredPriceHistory" item-key="id" class="elevation-1"
              :header-class="{ 'text-align-center': true }">
              <template v-slot:item.actions="{ item }">
                <!-- <v-btn icon @click="editPriceHistory(item)" aria-label="Edit Price History" text>
                  <v-icon color="blue">mdi-pencil</v-icon>
                </v-btn> -->
  
                <!-- Delete Button -->
                <v-btn icon @click="confirmDeletePrice(item)" aria-label="Delete Price History" text>
                  <v-icon color="red">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Add Price Dialog -->
      <v-dialog v-model="addPriceDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Add New Price</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitPriceForm">
              <v-autocomplete v-model="priceForm.ProductID" :items="products" item-text="name" item-value="id"
                label="Product" outlined dense required @change="onProductChange" />
  
              <!-- Old Price field populated with the current product price -->
              <v-text-field v-model="priceForm.OldPrice" label="Old Price" outlined dense type="number" readonly />
  
              <!-- New Price field remains empty for the user to input a new price -->
              <v-text-field v-model="priceForm.NewPrice" label="New Price" outlined dense type="number" required />
  
              <v-textarea v-model="priceForm.ChangedBy" label="Changed By" outlined dense required />
  
              <v-row class="mt-4">
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn type="submit" color="primary" class="mr-2">
                    Add Price
                  </v-btn>
                  <v-btn @click="closeAddPriceDialog" color="secondary">Cancel</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
  
      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this price change?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="deletePriceHistory" color="red">Delete</v-btn>
            <v-btn @click="deleteDialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script>
  import { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
  import { firestore } from "~/plugins/firebase";
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  
  export default {
    data() {
      return {
        currentUser: null, // Store logged-in user info
        currentUserRole: "", // Store logged-in user's role
        search: "", // Search text field
        priceHeaders: [
          { text: "Product Name", value: "ProductName" },
          { text: "Old Price", value: "OldPrice" },
          { text: "New Price", value: "NewPrice" },
          { text: "Changed At", value: "ChangedAt" },
          { text: "Changed By", value: "ChangedBy" },
          { text: "Actions", value: "actions", sortable: false },
        ],
        priceHistory: [],
        products: [],
        priceForm: {
          ProductID: "",
          OldPrice: "",
          NewPrice: "",
          ChangedAt: "",
          ChangedBy: "",
        },
        priceSubmitButtonText: "Add Price Change",
        priceIdToEdit: null,
        deleteDialog: false,
        priceToDelete: null,
        addPriceDialog: false, // Dialog state for adding new price
      };
    },
    mounted() {
      this.loadProducts();
      this.loadPriceHistory();
      this.getCurrentUserDetails(); // Load user details on mount
    },
    computed: {
      filteredPriceHistory() {
        return this.priceHistory.filter(item => {
          const productName = item.ProductName ? item.ProductName : ''; // Ensure productName is a string
          return productName.toLowerCase().includes(this.search.toLowerCase());
        });
      },
    },
    methods: {
      async getCurrentUserDetails() {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.currentUser = user;
            // Fetch user role from Firestore
            const userRef = doc(firestore, "Users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              this.currentUserRole = userSnap.data().role || "Unknown Role";
            }
          } else {
            console.warn("No user is logged in.");
          }
        });
      },
      openAddPriceDialog() {
        this.priceForm.ChangedBy = this.currentUserRole; // Auto-fill role
        this.addPriceDialog = true;
      },
      closeAddPriceDialog() {
        this.addPriceDialog = false;
        this.resetPriceForm(); // Reset the form when dialog is closed
      },
      async loadProducts() {
        try {
          const snapshot = await getDocs(collection(firestore, "Products"));
          this.products = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().ProductName,
          }));
        } catch (error) {
          console.error("Error loading products:", error);
        }
      },
      async loadPriceHistory() {
        try {
          const snapshot = await getDocs(collection(firestore, "Price"));
          const productNames = {};
  
          // Ensure products are loaded before accessing product names
          this.products.forEach(product => {
            productNames[product.id] = product.name;
          });
  
          console.log('Product Names:', productNames); // Debugging output
  
          this.priceHistory = snapshot.docs.map(doc => ({
            id: doc.id,
            ProductName: productNames[doc.data().ProductID] || 'Unknown', // Ensure there's always a fallback value
            OldPrice: doc.data().OldPrice,
            NewPrice: doc.data().NewPrice,
            ChangedAt: doc.data().ChangedAt.toDate().toLocaleString(),
            ChangedBy: doc.data().ChangedBy,
          }));
        } catch (error) {
          console.error("Error loading price history:", error);
        }
      },
      async onProductChange() {
        const productRef = doc(firestore, "Products", this.priceForm.ProductID);
        const productSnap = await getDoc(productRef);
  
        if (productSnap.exists()) {
          // Set both OldPrice and NewPrice based on the selected product
          this.priceForm.OldPrice = productSnap.data().Price || 0; // Set current price as Old Price
          this.priceForm.NewPrice = ""; // Leave New Price empty
        } else {
          console.error("Product not found");
        }
      },
      async submitPriceForm() {
        const { ProductID, NewPrice, ChangedBy } = this.priceForm;
  
        if (!ProductID || !NewPrice || !ChangedBy) {
          alert("Product, New Price, and Changed By fields are required.");
          return;
        }
  
        try {
          const productRef = doc(firestore, "Products", ProductID);
          const productSnap = await getDoc(productRef);
  
          if (!productSnap.exists()) {
            alert("Product not found.");
            return;
          }
  
          const docRef = await addDoc(collection(firestore, "Price"), {
            ProductID,
            OldPrice: productSnap.data().Price || 0,
            NewPrice,
            ChangedAt: new Date(),
            ChangedBy,
          });
  
          await updateDoc(productRef, {
            Price: NewPrice,
          });
  
          // Update the price history with the new entry
          this.priceHistory.push({
            id: docRef.id,
            ProductName: productSnap.data().ProductName,
            OldPrice: productSnap.data().Price || 0,
            NewPrice,
            ChangedAt: new Date().toLocaleString(),
            ChangedBy,
          });
  
          this.closeAddPriceDialog(); // Close the dialog after submission
        } catch (error) {
          console.error("Error submitting price change:", error);
          alert("Failed to submit price change. Please try again.");
        }
      },
      resetPriceForm() {
        this.priceForm = {
          ProductID: "",
          NewPrice: "",
          ChangedBy: "",
        };
        this.priceSubmitButtonText = "Add Price Change";
        this.priceIdToEdit = null;
      },
      editPriceHistory(item) {
        this.priceForm = {
          ProductID: item.ProductID,
          OldPrice: item.OldPrice,
          NewPrice: item.NewPrice,
          ChangedAt: item.ChangedAt,
          ChangedBy: item.ChangedBy,
        };
        this.priceSubmitButtonText = "Update Price Change";
        this.priceIdToEdit = item.id;
      },
      confirmDeletePrice(item) {
        this.priceToDelete = item.id;
        this.deleteDialog = true;
      },
      async deletePriceHistory() {
        try {
          await deleteDoc(doc(firestore, "Price", this.priceToDelete));
          this.priceHistory = this.priceHistory.filter(item => item.id !== this.priceToDelete);
          this.deleteDialog = false;
        } catch (error) {
          console.error("Error deleting price history:", error);
          alert("Failed to delete price history. Please try again.");
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .dashboard-card {
    background-color: #333;
    color: white;
    padding: 40px;
  }
  
  .elevation-2 {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  </style>
  