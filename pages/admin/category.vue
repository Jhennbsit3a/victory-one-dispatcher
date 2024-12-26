<template>
    <v-container>
  
      <v-row>
        <!-- Total Categories Card -->
        <v-col cols="12" md="4" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-folder</v-icon>
              Total Categories
            </v-card-title>
            <v-card-text class="text-h2">{{ totalCategories }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col cols="12" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="headline text-center">
              <v-icon class="mr-2">mdi-folder</v-icon>
              Product Type Management
              <v-spacer></v-spacer>
              <v-btn icon color="blue" @click="openAddDialog">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-card-title>
  
            <v-data-table :headers="categoryHeaders" :items="filteredCategories" item-key="id" class="elevation-1"
              :header-class="{ 'text-align-center': true }">
              <template v-slot:item.actions="{ item }">
                <v-btn icon @click="editCategory(item)" aria-label="Edit Category" text>
                  <v-icon color="blue">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="confirmDeleteCategory(item.id)" aria-label="Delete Category" text>
                  <v-icon color="red">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Add Dialog -->
      <v-dialog v-model="addDialog" max-width="500">
        <v-card>
          <v-card-title>
            <span class="headline">{{ dialogTitle }}</span>
          </v-card-title>
  
          <v-card-text>
            <v-form ref="addForm" @submit.prevent="submitCategory">
              
              <v-text-field v-model="categoryForm.CategoryID" label="Category ID" outlined dense required
                readonly></v-text-field>
              <v-text-field v-model="categoryForm.ProductType" label="Product Type" outlined dense
                required></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="submitCategory">{{ categorySubmitButtonText }}</v-btn>
            <v-btn color="grey darken-1" text @click="addDialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-col cols="12" class="mb-4">
        <v-card class="elevation-2">
          <v-card-title class="headline text-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            Logs
          </v-card-title>
          <v-data-table :headers="logHeaders" :items="logs" item-key="timestamp" class="elevation-1"></v-data-table>
        </v-card>
      </v-col>
  
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this category?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="deleteCategory(categoryToDelete)" color="red">Delete</v-btn>
            <v-btn @click="deleteDialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
    </v-container>
  </template>
  
  <script>
  import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
  import { firestore } from '~/plugins/firebase';
  
  export default {
    data() {
      return {
        categoryHeaders: [
          { text: 'Category ID', value: 'CategoryID' },
          { text: 'Product Type', value: 'ProductType' },
          { text: 'Actions', value: 'actions', sortable: false }
        ],
        logHeaders: [
          { text: 'Timestamp', value: 'timestamp' },
          { text: 'Action', value: 'action' },
          { text: 'Details', value: 'details' }
        ],
        addDialog: false, // Controls the add dialog visibility
        logs: [], // Store logs
        categories: [],
        categoryForm: {
          CategoryID: '',
          ProductType: ''
        },
        categorySubmitButtonText: 'Add Category',
        deleteDialog: false,
        categoryToDelete: null,
        searchQuery: '', // Add search query property
        totalCategories: 0, // New property for total categories
        dialogTitle: '' // Add dialogTitle with an empty default value
      };
    },
    computed: {
      // Computed property for filtering and sorting categories based on search query
      filteredCategories() {
        let filteredList = this.categories;
  
        // Filter categories based on search query
        if (this.searchQuery) {
          filteredList = this.categories.filter(category =>
            category.ProductType.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
  
        // Sort categories alphabetically by ProductType
        return filteredList.sort((a, b) => a.ProductType.localeCompare(b.ProductType));
      }
    },
  
    mounted() {
      this.loadCategories();
      this.loadLogs(); // Load logs from localStorage
    },
    methods: {
      openAddDialog() {
        this.resetCategoryForm();
        this.dialogTitle = 'Add New Category';
        this.addDialog = true;
      },
      async handleAdd() {
        const { CategoryID, ProductType } = this.categoryForm;
  
        if (!CategoryID || !ProductType) {
          alert("Both Category ID and Product Type are required.");
          return;
        }
  
        const docRef = await addDoc(collection(firestore, 'Categories'), { CategoryID, ProductType });
        this.categories.push({ id: docRef.id, CategoryID, ProductType });
        this.addLog('Add', `Category ID: ${CategoryID}, Product Type: ${ProductType}`);
        this.totalCategories++;
        this.addDialog = false;
      },
      resetCategoryForm() {
        const lastCategory = this.categories.reduce((max, cat) => Math.max(max, parseInt(cat.CategoryID, 10)), 0);
        this.categoryForm = {
          CategoryID: (lastCategory + 1).toString(),
          ProductType: ''
        };
      },
      async loadCategories() {
        const snapshot = await getDocs(collection(firestore, 'Categories'));
        this.categories = snapshot.docs.map(doc => ({
          id: doc.id,
          CategoryID: doc.data().CategoryID,
          ProductType: doc.data().ProductType
        }));
        this.totalCategories = this.categories.length; // Update total categories count
  
        // Automatically generate CategoryID for new categories
        if (this.categories.length > 0) {
          const lastCategory = this.categories.reduce((max, cat) => Math.max(max, parseInt(cat.CategoryID, 10)), 0);
          this.categoryForm.CategoryID = (lastCategory + 1).toString();
        } else {
          this.categoryForm.CategoryID = '1'; // Starting from 1 if no categories exist
        }
      },
      loadLogs() {
        const storedLogs = localStorage.getItem('categoryLogs');
        this.logs = storedLogs ? JSON.parse(storedLogs) : [];
      },
      saveLogs() {
        localStorage.setItem('categoryLogs', JSON.stringify(this.logs));
      },
      addLog(action, details) {
        const newLog = {
          timestamp: new Date().toLocaleString(),
          action,
          details
        };
        this.logs.unshift(newLog); // Add to the beginning of the logs array
        this.saveLogs();
      },
      async submitCategory() {
        const { CategoryID, ProductType } = this.categoryForm;
  
        if (!CategoryID || !ProductType) {
          alert("Both Category ID and Product Type are required.");
          return;
        }
  
        // Check if the category already exists by CategoryID
        const existingCategory = this.categories.find(cat => cat.CategoryID === CategoryID);
        if (existingCategory) {
          // If the category exists, update it
          const categoryRef = doc(firestore, 'Categories', existingCategory.id);
          await updateDoc(categoryRef, { ProductType });
          existingCategory.ProductType = ProductType; // Update the local list
          this.addLog('Edit', `Category ID: ${CategoryID}, Updated Product Type to: ${ProductType}`);
        } else {
          // If the category does not exist, create a new one
          const docRef = await addDoc(collection(firestore, 'Categories'), { CategoryID, ProductType });
          this.categories.push({ id: docRef.id, CategoryID, ProductType });
          this.addLog('Add', `Category ID: ${CategoryID}, Product Type: ${ProductType}`);
        }
  
        this.addDialog = false; // Close the dialog after submission
        this.resetCategoryForm(); // Reset the form
      },
      confirmDeleteCategory(id) {
        this.categoryToDelete = id;
        this.deleteDialog = true;
      },
      async deleteCategory(id) {
        const categoryRef = doc(firestore, 'Categories', id);
        const category = this.categories.find(item => item.id === id);
        await deleteDoc(categoryRef);
        this.categories = this.categories.filter(item => item.id !== id);
        this.totalCategories = this.categories.length;
        this.addLog('Delete', `Category ID: ${category.CategoryID}, Product Type: ${category.ProductType}`);
        this.deleteDialog = false;
      },
      editCategory(item) {
        this.categoryForm = { ...item };  // Pre-fill the form with the selected category data
        this.categorySubmitButtonText = 'Update Category'; // Change the button text to 'Update Category'
        this.dialogTitle = 'Edit Category'; // Update the dialog title
        this.addDialog = true; // Open the dialog for editing
      },
      resetCategoryForm() {
        this.categoryForm = {
          CategoryID: '',
          ProductType: ''
        };
        this.categorySubmitButtonText = 'Add Category';
        this.loadCategories();
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
  
  .statistics-card {
    background-color: #f9f9f9;
  }
  </style>