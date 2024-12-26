<template>
    <v-container>
      <v-alert type="error" outlined>
        You do not have permission to access this page.
      </v-alert>
    </v-container>
  </template>
  
  <script>
  export default {
    head() {
      return {
        title: 'No Access'
      };
    }
  }
  </script>
  