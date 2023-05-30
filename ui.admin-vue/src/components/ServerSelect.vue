<template>
  <v-container class="fill-height">
    <v-responsive class="align-center fill-height">
      <v-card variant="tonal" width="600" class="ma-auto">
      <template v-slot:title>
        Connect to server
      </template>

      <template v-slot:text>
        <v-combobox
          hide-details="auto"
          label="Server address"
          v-model="server"
          :items="serverHistory"
        />
        <v-text-field
          hide-details="auto"
          label="Logged in as"
          readonly
        >
          <template v-slot:append-inner >
            <v-btn icon variant="text" color="green">
              <v-icon icon="mdi-login"></v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <v-text-field
          hide-details="auto"
            label="Autoconnect link"
            persistent-hint
            hint="Use this link to skip server select"
            readonly
            v-model="autoConnectLink"
          >
          <template v-slot:append-inner>
            <v-btn icon variant="text">
              <v-icon icon="mdi-clipboard"></v-icon>
            </v-btn>
          </template>
        </v-text-field>

        <v-alert type="info" variant="tonal" class="mt-2">This is client-based application and no informations are saved on our server.</v-alert>
      </template>
    </v-card>
    </v-responsive>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
const server = ref('http://localhost:20000')
const serverHistory = ref(JSON.parse(localStorage.serverHistory ?? '[]'))
const autoConnectLink = ref(`${window.location.origin}?server=${server}`)

watch(server, (val) => {
  autoConnectLink.value = `${window.location.origin}?server=${val}`
})

if (localStorage.server) {
  server.value = JSON.parse(localStorage.server)
}
</script>
