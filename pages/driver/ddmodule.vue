<template>
    <v-app>
      <v-container>
        <!-- Header -->
        <v-row class="mb-4">
          <v-col cols="12">
            <h2>Driver Module</h2>
            <v-divider class="header-divider"></v-divider>
          </v-col>
        </v-row>
  
        <!-- Orders Table -->
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="orderHeaders"
              :items="orders"
              item-value="id"
              class="elevation-1"
              dense
            >
              <template v-slot:body="{ items }">
                <tbody>
                  <tr v-for="order in items" :key="order.id">
                    <td>{{ order.id }}</td>
                    <td>{{ order.customerName }}</td>
                    <td>{{ order.total | currency }}</td>
                    <td>{{ order.status }}</td>
                    <td>
                      <v-btn 
                        style="background-color: green; color: white;"
                        @click="openConfirmationDialog(order.id)" 
                        :disabled="order.status !== 'Shipped'"
                      >
                        Mark as Delivered
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
  
        <!-- Confirmation Dialog -->
        <v-dialog v-model="dialog" persistent max-width="400px">
          <v-card>
            <v-card-title class="headline">Confirm Delivery</v-card-title>
            <v-card-text>
              Are you sure you want to mark this order as delivered?
            </v-card-text>
            <v-card-actions>
              <v-btn color="blue" text @click="dialog = false">Cancel</v-btn>
              <v-btn color="green" text @click="confirmDelivery">Confirm</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-app>
  </template>
  
  <script>
  import { firestore } from '~/plugins/firebase';
  import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
  
  export default {
    data() {
      return {
        orders: [],
        orderHeaders: [
          { text: 'Order ID', value: 'id' },
          { text: 'Customer Name', value: 'customerName' },
          { text: 'Total', value: 'total', align: 'end' },
          { text: 'Status', value: 'status' },
          { text: 'Actions', value: 'actions', align: 'center' }
        ],
        dialog: false, // For controlling the confirmation dialog
        currentOrderId: null // To store the current order id for confirmation
      };
    },
    async created() {
      await this.fetchShippedOrders();
    },
    methods: {
      async fetchShippedOrders() {
        try {
          const ordersQuery = query(
            collection(firestore, 'Orders'),
            where('status', '==', 'Shipped')
          );
          
          const querySnapshot = await getDocs(ordersQuery);
          
          const ordersWithCustomerNames = [];
          
          for (let docSnap of querySnapshot.docs) {
            const orderData = docSnap.data();
            const userId = orderData.userId;
    
            const userDocRef = doc(firestore, 'Users', userId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.data();
    
            const customerName = `${userData.firstName} ${userData.lastName}`;
    
            ordersWithCustomerNames.push({
              id: docSnap.id,
              customerName,
              total: orderData.total,
              status: orderData.status
            });
          }
    
          this.orders = ordersWithCustomerNames;
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      },
      
      // Open the confirmation dialog
      openConfirmationDialog(orderId) {
        this.currentOrderId = orderId; // Store the order ID to be confirmed
        this.dialog = true; // Open the dialog
      },
      
      // Confirm delivery and update the order status
      async confirmDelivery() {
        try {
          const orderRef = doc(firestore, 'Orders', this.currentOrderId);
          await updateDoc(orderRef, {
            status: 'Delivered'
          });
          this.fetchShippedOrders(); // Refresh the order list
          this.$toast.success('Order marked as delivered!');
        } catch (error) {
          console.error('Error updating order status:', error);
          this.$toast.error('Failed to update order status');
        } finally {
          this.dialog = false; // Close the dialog
        }
      }
    },
    filters: {
      currency(value) {
        if (!value) return '';
        return '₱' + value.toFixed(2);
      }
    }
  };
  </script>
  
  <style scoped>
  .header-divider {
    background-color: #FFA900;
    height: 4px;
    width: 80px;
    margin: 0 auto;
  }
  
  .v-data-table th, .v-data-table td {
    text-align: center;
    padding: 8px;
  }
  </style>
  