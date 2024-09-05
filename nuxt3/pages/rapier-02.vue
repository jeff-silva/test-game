<template>
  <nuxt-layout name="main">
    <div
      id="game"
      style="width: 100%; height: 400px; position: relative"
    ></div>
    <a href="">Refresh</a>
  </nuxt-layout>
</template>

<script setup>
import Rapier02 from "@/classes/rapier-02/Rapier02.js";
new Rapier02({ el: "#game", debug: true });
</script>
