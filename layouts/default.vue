<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar v-if="showDrawer" app style="background-color: #333; color: black;" color="white">
      <v-app-bar-nav-icon @click="drawer = !drawer" style="color: black;" color="black"></v-app-bar-nav-icon>
      <v-toolbar-title>Dispatcher</v-toolbar-title>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-if="showDrawer" v-model="drawer" :mini-variant="miniVariant" :clipped="clipped" fixed app
      style="background-color: #333;" color="white">
      <v-layout column fill-height>
        <!-- Navigation Items -->
        <v-list>
          <v-list-item v-for="(item, i) in filteredItems" :key="i" :to="item.to" router exact style="color: black;">
            <v-list-item-action>
              <v-icon style="color: black;">{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- Spacer to push logout button to the bottom -->
        <v-spacer></v-spacer>

        <!-- Logout Button -->
        <v-list>
          <v-list-item class="logout-button">
            <v-btn block color="red" dark @click="logout">
              <v-icon left>mdi-logout</v-icon>
              Logout
            </v-btn>
          </v-list-item>
        </v-list>
      </v-layout>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { auth, firestore } from '~/plugins/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'DefaultLayout',
  data() {
    return {
      clipped: false,
      drawer: false,
      miniVariant: false,
      showDrawer: true,
      userRole: null, // Add a property to store the user role
      items: [
        { icon: 'mdi-package-variant', title: 'Orders', to: '/dispatch/order_dispatch', roles: ['admin', 'dispatch'] },
        { icon: 'mdi-truck-fast', title: 'Shipped Orders', to: '/dispatch/shipped_orders', roles: ['admin', 'dispatch'] },
      ],
      showDrawerOnRoutes: [
        '/dispatch/order_dispatch',
        '/dispatch/shipped_orders',
      ]
    };
  },
  watch: {
    $route(to) {
      this.checkDrawerVisibility(to.path);
    }
  },
  mounted() {
    this.fetchUserRole(); // Fetch user role on mount
    this.checkDrawerVisibility(this.$route.path);
  },
  methods: {
    async fetchUserRole() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDocRef = doc(firestore, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            this.userRole = userDoc.data().role;
            console.log(`User role fetched: ${this.userRole}`); // Log the role for confirmation
          } else {
            console.error('User role not found in Firestore');
          }
        }
      });
    },
    checkDrawerVisibility(path) {
      this.showDrawer = this.showDrawerOnRoutes.includes(path);
    },
    async logout() {
      try {
        await auth.signOut();
        console.log("User has successfully logged out.");
        this.$router.replace('/');
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  },
  computed: {
    filteredItems() {
      // Filter items based on user role
      return this.items.filter(item => !item.roles || item.roles.includes(this.userRole));
    }
  }
};
</script>

<style scoped>
.logout-button {
  padding: 10px;
  margin: 0;
}

.logout-button .v-btn {
  margin: 0 auto;
  width: calc(100% - 16px);
  /* Responsive spacing */
}

.v-navigation-drawer {
  max-width: 300px;
  /* Ensure responsiveness */
}
</style>
