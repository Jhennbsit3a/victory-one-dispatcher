<template>
    <v-container>
        <v-row>
    <v-col cols="12" md="4" class="mb-4">
        <v-card class="elevation-2">
            <v-card-title class="headline text-center">
                <v-icon class="mr-2">mdi-account-multiple</v-icon>
                Total Users
            </v-card-title>
            <v-card-text class="text-h2">{{ users.length }}</v-card-text>
        </v-card>
    </v-col>
</v-row>
        <!-- Filter/Search Section -->
        <v-row dense class="align-center mb-2">
            <v-col cols="auto" class="pr-2">
                <!-- Role Filter -->
                <v-select
                    v-model="selectedRole"
                    :items="roles"
                    label="Filter by Role"
                    outlined
                    dense
                ></v-select>
            </v-col>
            <v-col cols="auto" class="pr-2">
                <!-- Search Field -->
                <v-text-field
                    v-model="searchQuery"
                    label="Search Users by Name"
                    outlined
                    dense
                />
            </v-col>
            <v-col cols="auto">
                <!-- Reset Button -->
                <v-btn
                    icon
                    color="primary"
                    @click="resetFilters"
                    class="reset-button"
                >
                    <v-icon>mdi-restart</v-icon>
                </v-btn>
            </v-col>
        </v-row>

        <!-- Data Table -->
        <v-card class="elevation-2">
            <v-card-title>
                <span class="headline">User Management</span>
                <v-spacer></v-spacer>
                <!-- Add Button -->
                <v-btn color="primary" icon @click="openAddDialog">
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </v-card-title>

            <v-data-table
                :headers="userHeaders"
                :items="filteredUsers"
                item-key="uid"
                class="elevation-1"
            >
                <template v-slot:item.fullName="{ item }">
                    {{ item.fullName }}
                </template>
                <template v-slot:item.phone="{ item }">
                    {{ item.phone || "N/A" }}
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-btn color="blue" icon @click="editUser(item)">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn color="red" icon @click="confirmDelete(item.uid)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
            </v-data-table>
        </v-card>

        <v-dialog v-model="editDialogVisible" max-width="500px">
    <v-card>
        <v-card-title>
            <span class="headline">
                {{ editingUserID ? 'Edit User' : 'Add User' }}
            </span>
        </v-card-title>
        <v-card-text>
            <v-form ref="userForm" v-model="isValid">
                <v-text-field
                    v-model="userForm.firstName"
                    label="First Name"
                    outlined
                    required
                ></v-text-field>
                <v-text-field
                    v-model="userForm.lastName"
                    label="Last Name"
                    outlined
                    required
                ></v-text-field>
                <v-text-field
                    v-model="userForm.email"
                    label="Email"
                    outlined
                    required
                ></v-text-field>
                <v-text-field
                    v-model="userForm.phone"
                    label="Phone"
                    outlined
                ></v-text-field>
                <v-select
                    v-model="userForm.role"
                    :items="roles"
                    label="Role"
                    outlined
                    required
                ></v-select>
            </v-form>
        </v-card-text>
        <v-card-actions>
            <v-btn color="blue darken-1" text @click="closeEditDialog">
                Cancel
            </v-btn>
            <v-btn color="blue darken-1" text :disabled="!isValid" @click="submitUserForm">
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>

<v-dialog v-model="deleteDialog" max-width="400px">
    <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
            Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="red" text @click="deleteConfirmed">Delete</v-btn>
            <v-btn text @click="closeDeleteDialog">Cancel</v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>

    </v-container>
</template>

<script>
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '~/plugins/firebase';

export default {
    data() {
        return {
            selectedRole: null, // Selected role for filtering
            searchQuery: '', // Search query for the table
            userHeaders: [
                { text: 'Full Name', value: 'fullName' },
                { text: 'Email', value: 'email' },
                { text: 'Phone', value: 'phone' },
                { text: 'Role', value: 'role' },
                { text: 'Actions', value: 'actions', sortable: false },
            ],
            users: [], // Array for storing user data
            roles: ['admin', 'Business Owner', 'customer', 'cashier'], // Available roles
            editDialogVisible: false, // Visibility of the edit dialog
            deleteDialog: false, // Visibility of the delete confirmation dialog
            userForm: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: 'customer',
            },
            editingUserID: null, // ID of the user being edited
            deleteUserID: null, // ID of the user to be deleted
            isValid: false, // Validation status for the form
        };
    },
    created() {
        this.fetchUsers(); // Fetch users when component is created
    },
    computed: {
        filteredUsers() {
            // Filter by selected role
            let filtered = this.users;
            if (this.selectedRole) {
                filtered = filtered.filter(user => user.role === this.selectedRole);
            }

            // Apply search query filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(user =>
                    user.fullName.toLowerCase().includes(query)
                );
            }

            return filtered;
        },
    },
    methods: {
        editUser(user) {
    // Populate the form with existing data or default values
    this.userForm = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '', // Default to empty string
        role: user.role || 'customer',
    };

    this.editingUserID = user.uid;
    this.editDialogVisible = true;
},
        resetFilters() {
        this.selectedRole = null;
        this.searchQuery = '';
    },
        fetchUsers() {
            const q = query(collection(firestore, 'Users'));
            onSnapshot(q, snapshot => {
                this.users = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    firstName: doc.data().firstName,
                    lastName: doc.data().lastName,
                    fullName: `${doc.data().firstName} ${doc.data().lastName}`,
                    email: doc.data().email,
                    phone: doc.data().phone,
                    role: doc.data().role,
                }));
            });
        },
        openAddDialog() {
            this.resetForm();
            this.editDialogVisible = true;
        },
        resetForm() {
            this.userForm = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: 'customer',
            };
            this.editingUserID = null;
        },
        async submitUserForm() {
            if (this.editingUserID) {
                await this.updateUser();
            } else {
                await this.addUser();
            }
            this.editDialogVisible = false;
        },
        async addUser() {
            try {
                const userRef = await addDoc(collection(firestore, 'Users'), {
                    firstName: this.userForm.firstName,
                    lastName: this.userForm.lastName,
                    email: this.userForm.email,
                    phone: this.userForm.phone,
                    role: this.userForm.role,
                    createdAt: new Date(),
                });
                await updateDoc(userRef, { userID: userRef.id });
                this.fetchUsers();
            } catch (error) {
                console.error("Error adding user:", error);
            }
        },
        async updateUser() {
    try {
        const userRef = doc(firestore, 'Users', this.editingUserID);

        // Build the update payload by omitting undefined or null values
        const updatePayload = Object.fromEntries(
            Object.entries(this.userForm).filter(([_, value]) => value != null)
        );

        await updateDoc(userRef, updatePayload);

        this.fetchUsers();
    } catch (error) {
        console.error("Error updating user:", error);
    }
},
        confirmDelete(userID) {
            this.deleteUserID = userID;
            this.deleteDialog = true;
        },
        async deleteConfirmed() {
            try {
                const userRef = doc(firestore, 'Users', this.deleteUserID);
                await deleteDoc(userRef);
                this.fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
            }
            this.deleteDialog = false;
        },
        closeEditDialog() {
            this.editDialogVisible = false;
            this.resetForm();
        },
        async deleteConfirmed() {
        try {
            const userRef = doc(firestore, 'Users', this.deleteUserID);
            await deleteDoc(userRef); // Delete the user from Firestore
            this.fetchUsers();        // Refresh the user list
            this.$emit('snackbar', { message: 'User deleted successfully.', color: 'success' });
        } catch (error) {
            console.error("Error deleting user:", error);
            this.$emit('snackbar', { message: 'Failed to delete user.', color: 'error' });
        } finally {
            this.closeDeleteDialog();
        }
    },
    closeDeleteDialog() {
        this.deleteDialog = false;  // Close the dialog
        this.deleteUserID = null;   // Clear the delete ID
    },
    },
};
</script>

<style scoped>
.v-select,
.v-text-field {
    max-width: 250px;
}

.v-card-title {
    align-items: center;
}

.reset-button {
    margin-top: -25px;
}
</style>
