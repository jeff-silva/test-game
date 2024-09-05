<template>
  <nuxt-layout name="main">
    <div
      id="app-game"
      style="width: 100%; height: 600px"
    ></div>
    <a href="">refresh</a>
    <pre>appGameData: {{ appGameData }}</pre>
  </nuxt-layout>
</template>

<script setup>
import AppGame from "@/classes/test-02/AppGame.js";

const appGame = new AppGame({
  el: "#app-game",
});

const appGameData = reactive({
  input: {},
});
</script>
