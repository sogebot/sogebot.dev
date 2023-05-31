<template>
  <div style="position: absolute; right: 10px; top: 10px;">
    <v-dialog
      v-model="dialog"
      width="auto"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon color="primary" v-bind="props">
          <v-icon>mdi-cookie</v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-card-title>
          <h3>Mandatory cookies</h3>
        </v-card-title>
        <v-card-text>
          <v-switch readonly v-model="mandatory" hide-details="auto" color="primary">
            <template v-slot:label>
              <div class="d-block">
                <div><strong>MANDATORY</strong>&nbsp;- used to save user cookie preference.</div>
                <ul>
                  <li><small>cookie_control_consent</small></li>
                  <li><small>cookie_control_enabled_cookies</small></li>
                </ul>
              </div>
            </template>
            <template v-slot:message>
            </template>
          </v-switch>
          <v-switch readonly hide-details="auto" v-model="mandatory" color="primary">
            <template v-slot:label>
              <div><strong>FUNCTIONAL</strong>&nbsp;- necessary cookies for bot usage.</div>
            </template>
          </v-switch>
        </v-card-text>
        <v-card-title>
          <h3>Optional cookies</h3>
        </v-card-title>
        <v-card-text>
          <v-switch hide-details="auto" v-model="msClarity" color="primary">
            <template v-slot:label>
              <div><strong>MICROSOFT CLARITY</strong>&nbsp;- differentation of user session.</div>
            </template>
          </v-switch>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">Close Dialog</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const dialog = ref(false);
const msClarity = ref(false);
const mandatory = true;
</script>
