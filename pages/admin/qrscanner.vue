<template>
  <v-container class="pa-5">
    <!-- QR Code Scanner Section
    <v-card class="elevation-10">
      <v-card-title class="headline text-center">
        QR Code Scanner
      </v-card-title>

      <v-card-text class="text-center">
        
        <v-textarea label="Scanned Data" v-model="scannedData" outlined rows="5" readonly
          class="scanned-data-textarea"></v-textarea>

        
        <v-btn color="primary" class="mt-3 reset-btn" @click="resetForm" fab small>
          <v-icon>mdi-refresh</v-icon>
        </v-btn>

        
        <v-alert v-if="invalidOrder" type="error" class="mt-3" prominent>
          Invalid or Expired QR Code
        </v-alert>
      </v-card-text>
    </v-card> -->

    <!-- Order Details Section -->
    <v-card class="elevation-10 mt-5">
      <v-card-title class="headline text-center">
        Order ID Details
      </v-card-title>

      <v-card-text>
        <!-- Input Field for UID -->
        <v-text-field label="Enter Order UID" v-model="orderUID" outlined dense @change="fetchOrderDetails"
          autofocus></v-text-field>
        <!-- Reset Button -->
        <v-btn color="primary" class="mt-3 reset-btn" @click="resetForm" fab small>
          <v-icon>mdi-refresh</v-icon>
        </v-btn>

        <!-- Cart Items Section -->
        <v-card class="mt-5" v-if="orderDetails && orderDetails.cartItems && orderDetails.cartItems.length > 0">
          <v-card-title>Cart Items</v-card-title>
          <v-simple-table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in orderDetails.cartItems" :key="index">
                <td>{{ item.productName }}</td>
                <td>{{ item.Quantity }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card>

        <!-- User Information Section -->
        <v-card class="mt-5" v-if="userDetails && Object.keys(userDetails).length > 0">
          <v-card-title>User Information</v-card-title>
          <v-simple-table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Customer Name</td>
                <td>{{ userDetails.firstName }} {{ userDetails.lastName }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card>

        <!-- Order Information Section -->
        <v-card class="mt-5" v-if="orderDetails">
          <v-card-title>Order Information</v-card-title>
          <v-simple-table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Payment Method</td>
                <td>{{ orderDetails.paymentMethod }}</td>
              </tr>
              <tr>
                <td>Delivery Address</td>
                <td>{{ orderDetails.deliveryAddress }}</td>
              </tr>
              <tr>
                <td>Estimated Delivery Date</td>
                <td>{{ orderDetails.estimatedDeliveryDate }}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{{ orderDetails.total }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card>

        <!-- Error Alert for Invalid UID -->
        <v-alert v-if="invalidOrder" type="error" class="mt-3" prominent>
          Invalid Order UID or the Order does not exist.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "~/plugins/firebase";


export default {
  data() {
    return {
      scannedData: "", // Scanned data from QR scanner
      orderUID: "", // UID input
      orderDetails: null, // Fetched order details
      userDetails: {}, // User details
      invalidOrder: false, // Invalid order flag
    };
  },
  computed: {
    shouldFocus() {
      // Return true when you want the field to be focused
      // For example, after navigating to this component
      return this.$route.name === 'YourRouteName'
    }
  },
  methods: {
    // Fetch order details by UID
    async fetchOrderDetails() {
      try {
        if (!this.orderUID.trim()) {
          this.invalidOrder = true;
          this.orderDetails = null;
          return;
        }

        const orderRef = doc(firestore, "Orders", this.orderUID.trim());
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          this.orderDetails = orderSnap.data(); // Set order details
          this.invalidOrder = false; // Reset invalid flag

          // Fetch user details using the userId from the order
          const userRef = doc(firestore, "Users", this.orderDetails.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            this.userDetails = userSnap.data(); // Set user details
          } else {
            this.userDetails = {}; // Reset if user not found
          }
        } else {
          this.orderDetails = null;
          this.invalidOrder = true; // UID not found
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        this.orderDetails = null;
        this.invalidOrder = true;
      }
    },

    // Reset form fields
    resetForm() {
      this.scannedData = "";
      this.orderUID = "";
      this.orderDetails = null;
      this.userDetails = {};
      this.invalidOrder = false;
    },
  },
};
</script>

<style scoped>
.v-container {
  max-width: 600px;
  margin: 0 auto;
}

.v-card {
  background-color: #f5f5f5;
}

.v-card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
}

.scanned-data-textarea {
  background-color: #ffffff;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
}

.reset-btn {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.v-alert {
  padding: 15px;
}
</style>
