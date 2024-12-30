<template>
  <v-container>
    <h1 class="text-center mb-4">Order Dispatch</h1>

    <!-- Filter Buttons -->
    <v-row class="mb-4" justify="center">
      <v-btn v-for="status in ['All', 'Pending', 'Shipped']" :key="status" class="mx-2" color="primary"
        :outlined="selectedStatus !== status" @click="filterOrders(status)">
        {{ status }}
      </v-btn>
    </v-row>

    <!-- Orders Grid -->
    <v-row>
      <v-col v-for="order in filteredOrders" :key="order.id" cols="12" md="6" lg="4">
        <v-card class="mb-4">
          <v-card-text>
            <h3 class="mb-2">Customer Name: <span class="font-weight-medium">{{ getCustomerName(order.userId) ||
                'Unknown User' }}</span></h3>
            <p class="mb-2">
              <strong>Delivery Address:</strong> <span>{{ order.deliveryAddress || 'No address provided' }}</span>
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn :color="order.status === 'Shipped' ? 'grey' : 'success'" :disabled="order.status === 'Shipped'"
              @click="openConfirmDialog(order.id)">
              {{ order.status === 'Shipped' ? 'Shipped' : 'Dispatch' }}
            </v-btn>
            <v-btn color="info" @click="viewOrderDetails(order)">
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>



    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Dispatch</v-card-title>
        <v-card-text>
          Are you sure you want to mark this order as dispatched?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="confirmDispatch">
            Yes
          </v-btn>
          <v-btn color="red darken-1" text @click="closeConfirmDialog">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Order Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <h3>Order Details</h3>
        </v-card-title>
        <v-card-text>
          <p><strong>Order UID:</strong> {{ selectedOrder.id }}</p>
          <p><strong>Customer Name:</strong> {{ customerName }}</p>
          <h4>Cart Items:</h4>
          <ul>
            <li style="margin-bottom: 5px;" v-for="item in selectedOrder.cartItems" :key="item.id">
              {{ item.productName }}
            </li>
          </ul>
          <p><strong>Status:</strong> {{ selectedOrder.status }}</p>
          <p><strong>Payment Method:</strong> {{ selectedOrder.paymentMethod }}</p>
          <p><strong>Delivery Address:</strong> {{ selectedOrder.deliveryAddress }}</p>
          <p>
            <strong>Estimated Delivery Date:</strong>
            {{ selectedOrder.estimatedDeliveryDate || 'Not specified' }}
          </p>
          <p><strong>Tax:</strong> ₱{{ selectedOrder.tax }}</p>
          <p><strong>Total:</strong> ₱{{ selectedOrder.total }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="closeDetailsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { firestore } from '~/plugins/firebase';
import { collection, onSnapshot, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';

export default {
  data() {
    return {
      orders: [], // All orders from Firestore
      filteredOrders: [], // Filtered orders to display
      selectedStatus: 'All', // Currently selected filter
      confirmDialog: false, // Confirmation dialog visibility
      detailsDialog: false, // Dialog visibility for order details
      selectedOrder: {}, // Currently selected order for details
      customerName: '', // Customer's full name
      orderToDispatch: null, // ID of the order to dispatch
      usersMap: {}, // Cache user data
    };
  },
  async created() {
    // Fetch Orders Collection in Real-Time
    try {
      // Fetch Orders Collection in Real-Time
      const ordersRef = collection(firestore, 'Orders');
      onSnapshot(ordersRef, (snapshot) => {
        this.orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.filterOrders(this.selectedStatus);
      });

      // Fetch Users Collection and Build Cache
      const usersSnapshot = await getDocs(collection(firestore, 'Users'));
      this.usersMap = usersSnapshot.docs.reduce((map, doc) => {
        const userData = doc.data();
        map[doc.id] = `${userData.firstName} ${userData.lastName}`;
        return map;
      }, {});
    } catch (error) {
      console.error('Error fetching orders or users:', error);
    }
    // Displaying firestore Data for checking
    const ordersRef = collection(firestore, "Users");

    try {
      const querySnapshot = await getDocs(ordersRef);

      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      console.table(ordersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    // Displaying firestore Data for checking
    
  },
  methods: {
//     async fetchAndUpdateUser(userId, updatedData) {
//   try {
//     // Fetch Users Collection
//     const usersRef = collection(firestore, 'Users');
//     const querySnapshot = await getDocs(usersRef);

//     // Display fetched data in the console
//     const usersData = [];
//     querySnapshot.forEach((doc) => {
//       usersData.push({ id: doc.id, ...doc.data() });
//     });
//     console.table(usersData);

//     // Update specific user by ID
//     const userDocRef = doc(firestore, 'Users', userId);
//     await updateDoc(userDocRef, updatedData);
//     console.log(`User with ID ${userId} has been updated successfully!`);
//   } catch (error) {
//     console.error('Error fetching or updating user data:', error);
//   }
// },
    filterOrders(status) {
      this.selectedStatus = status;

      // Exclude "walk-in-order" from filtered results
      if (status === 'All') {
        this.filteredOrders = this.orders.filter(
          (order) => order.status !== 'walk-in-order'
        );
      } else {
        this.filteredOrders = this.orders.filter(
          (order) => order.status === status && order.status !== 'walk-in-order'
        );
      }
    },
    getCustomerName(userId) {
      // Lookup customer name from preloaded usersMap
      return this.usersMap[userId];
    },
    openConfirmDialog(orderId) {
      this.orderToDispatch = orderId; // Save the order ID to be dispatched
      this.confirmDialog = true; // Show the confirmation dialog
    },
    closeConfirmDialog() {
      this.orderToDispatch = null; // Clear the order ID
      this.confirmDialog = false; // Hide the confirmation dialog
    },
    async   confirmDispatch() {
      if (!this.orderToDispatch) return; // Exit if no order is selected

      try {
        const orderDocRef = doc(firestore, 'Orders', this.orderToDispatch);

        // Update the order's status to 'Dispatched'
        await updateDoc(orderDocRef, { status: 'Shipped' });

        // Refresh the filtered list to reflect changes
        this.filterOrders(this.selectedStatus);

        // Show a success message (optional)
        this.snackbar = true;
        this.snackbarMessage = `Order ${this.orderToDispatch} dispatched successfully!`;

        // Close the confirmation dialog
        this.closeConfirmDialog();
      } catch (error) {
        console.error('Error dispatching order:', error);
        // Close the dialog even if there was an error
        this.closeConfirmDialog();
      }
    },
    async viewOrderDetails(order) {
      try {
        // Set the selected order
        this.selectedOrder = order;

        // Fetch the user's name from the Users collection
        const userDocRef = doc(firestore, 'Users', order.userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.customerName = `${userData.firstName} ${userData.lastName}`;
        } else {
          this.customerName = 'Unknown User';
        }

        // Open the details dialog
        this.detailsDialog = true;
      } catch (error) {
        console.error('Error fetching user details:', error);
        this.customerName = 'Unknown User';
        this.detailsDialog = true; // Show dialog even if user details fail
      }
    },
    closeDetailsDialog() {
      this.detailsDialog = false;
      this.selectedOrder = {};
      this.customerName = '';
    },
  },
  // mounted(){
  //   // this.fetchAndUpdateUser('driver_account', { role: 'driver'});
  // }
};

</script>

<style scoped>
h3 {
  font-size: 18px;
  color: #4a4a4a;
}

p {
  font-size: 14px;
  color: #7d7d7d;
}

.font-weight-medium {
  font-weight: 500;
}

.mb-2 {
  margin-bottom: 8px;
}
.text-center {
  text-align: center;
}
.mb-4 {
  margin-bottom: 16px;
}
.mx-2 {
  margin-left: 8px;
  margin-right: 8px;
}
</style>
