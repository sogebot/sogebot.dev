<template>
  <v-container class="fill-height">
    <v-responsive class="align-center fill-height">
      <v-card variant="tonal" max-width="600" class="ma-auto">
        <template v-slot:title>
          <v-img src="@/assets/sogebot_large.png" alt="sogeBot Logo" width="190"/>
          <h4 class="pt-1 font-weight-thin">Connect to server</h4>
        </template>

        <template v-slot:text>
          <v-combobox hide-details="auto" label="Server address" v-model="server" :items="serverHistory" />
          <v-text-field hide-details="auto" label="Logged in as" placeholder="Not logged in" v-model="user.login"
            style="pointer-events: none;" readonly>
            <template v-slot:append-inner>
              <v-btn icon variant="text" :color="user ? 'red': 'green'" style="pointer-events: all;">
                <v-icon :icon="user ? 'mdi-logout' : 'mdi-login'"></v-icon>
              </v-btn>
            </template>
          </v-text-field>
          <v-text-field hide-details="auto" label="Autoconnect link" persistent-hint
            style="pointer-events: none;"
            hint="Use this link to skip server select" readonly v-model="autoConnectLink">
            <template v-slot:append-inner>
              <v-btn icon variant="text" @click="copyToClipboard" style="pointer-events: all;">
                <v-icon :icon="copied ? 'mdi-clipboard-check' : 'mdi-clipboard'"></v-icon>
              </v-btn>
            </template>
          </v-text-field>

          <v-alert type="info" variant="tonal" class="mt-2">This is client-based application and no informations are
            saved on our server.</v-alert>
        </template>

        <template v-slot:actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="outlined" v-if="user">Connect</v-btn>
        </template>
      </v-card>
    </v-responsive>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const server = ref('http://localhost:20000')
const serverHistory = ref(JSON.parse(localStorage.serverHistory ?? '[]'))
const autoConnectLink = computed(() => `${window.location.origin}?server=${server.value}`)

const user = computed(() => {
  try {
      return JSON.parse(localStorage['cached-logged-user']);
    } catch {
      return false;
    }
})

if (localStorage.server) {
  server.value = JSON.parse(localStorage.server)
}

const copied = ref(false);
const copyToClipboard = () => {
  navigator.clipboard.writeText(autoConnectLink.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 1000);
};
</script>
