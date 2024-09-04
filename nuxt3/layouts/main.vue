<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px">
      <nuxt-link to="/">home</nuxt-link>
      <nuxt-link to="/test2">/test2</nuxt-link>
    </div>
    <div style="padding: 10px">
      <slot></slot>
    </div>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>
