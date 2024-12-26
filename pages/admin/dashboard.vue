<template>
    <v-container>
      <v-card-title class="headline text-center">
        <v-icon class="mr-2" large style="color: white;">mdi-view-dashboard</v-icon>
        Dashboard Overview
      </v-card-title>
  
      <!-- Primary Statistics -->
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="elevation-2 statistics-card">
            <v-card-title class="headline">
              <v-icon class="mr-2" color="red" large>mdi-account-multiple</v-icon>
              Total Users
            </v-card-title>
            <v-card-text class="text-h2">{{ totalUsers }}</v-card-text>
          </v-card>
        </v-col>
  
        <v-col cols="12" md="4">
          <v-card class="elevation-2 statistics-card">
            <v-card-title class="headline">
              <v-icon class="mr-2" color="blue" large>mdi-cube-outline</v-icon>
              Total Products
            </v-card-title>
            <v-card-text class="text-h2">{{ totalProducts }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-spacer style="margin-bottom: 50px;"></v-spacer>
  
      <!-- Separated Total Orders, Income, and Sales -->
      <v-card-title class="headline text-center">
        <v-icon class="mr-2" large style="color: white;">mdi-currency-php</v-icon>
        Sales Overview
      </v-card-title>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="elevation-2 statistics-card">
            <v-card-title class="headline">
              <v-icon class="mr-2" color="orange" large>mdi-cart-outline</v-icon>
              Total Orders
            </v-card-title>
            <v-card-text class="text-h2">{{ totalOrders }}</v-card-text>
          </v-card>
        </v-col>
  
        <v-col cols="12" md="4">
          <v-card class="elevation-2 statistics-card">
            <v-card-title class="headline">
              <v-icon class="mr-2" color="teal" large>mdi-cash</v-icon>
              Total Income
            </v-card-title>
            <v-card-text class="text-h2">₱ {{ totalIncome }}</v-card-text>
          </v-card>
        </v-col>
  
        <v-col cols="12" md="4">
          <v-card class="elevation-2 statistics-card">
            <v-card-title class="headline">
              <v-icon class="mr-2" color="purple" large>mdi-currency-usd</v-icon>
              Total Sales
            </v-card-title>
            <v-card-text class="text-h2">₱ {{ totalSales }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-spacer style="margin-bottom: 50px;"></v-spacer>
    </v-container>
  </template>
  
  <script>
  import { collection, query, where, onSnapshot } from 'firebase/firestore';
  import { firestore } from '~/plugins/firebase';
  
  export default {
    data() {
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalSales: 0,
        totalIncome: 0,
        totalUsers: 0,
      };
    },
    mounted() {
      this.loadTotalProducts();
      this.loadTotalOrders();
      this.loadTotalSales();
      this.loadTotalIncome();
      this.loadTotalUsers();
    },
    methods: {
      loadTotalProducts() {
        const productsRef = collection(firestore, 'Products');
        this.unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
          this.totalProducts = snapshot.size;
        });
      },
      loadTotalOrders() {
        const ordersRef = collection(firestore, 'Orders');
        const ordersQuery = query(ordersRef, where('status', '!=', 'Cancelled'));
        this.unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          this.totalOrders = snapshot.size;
        });
      },
      loadTotalSales() {
        const ordersRef = collection(firestore, 'Orders');
        this.unsubscribeSales = onSnapshot(ordersRef, (snapshot) => {
          let totalSalesAmount = 0;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.total) {
              totalSalesAmount += data.total;
            }
          });
          this.totalSales = totalSalesAmount;
        });
      },
      loadTotalIncome() {
        const ordersRef = collection(firestore, 'Orders');
        this.unsubscribeIncome = onSnapshot(ordersRef, (snapshot) => {
          let income = 0;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tax) {
              income += data.tax;
            }
          });
          this.totalIncome = income;
        });
      },
      loadTotalUsers() {
        const usersRef = collection(firestore, 'Users');
        this.unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
          this.totalUsers = snapshot.size;
        });
      },
      beforeDestroy() {
        if (this.unsubscribeProducts) this.unsubscribeProducts();
        if (this.unsubscribeOrders) this.unsubscribeOrders();
        if (this.unsubscribeSales) this.unsubscribeSales();
        if (this.unsubscribeIncome) this.unsubscribeIncome();
        if (this.unsubscribeUsers) this.unsubscribeUsers();
      },
    },
    filters: {
      currency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);
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
  
  .statistics-card {
    background-color: #fff;
    padding: 15px;
    border-radius: 6px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .statistics-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .text-h2 {
    font-size: 1.75rem;
    font-weight: bold;
    color: #424242;
  }
  
  .v-list-item {
    border-bottom: 1px solid #ddd;
    padding: 10px 0;
  }
  
  .v-list-item-content {
    color: #333;
  }
  </style>
  