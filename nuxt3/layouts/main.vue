<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px">
      <nuxt-link to="/">home</nuxt-link>
      <nuxt-link to="/test-01">/test-01</nuxt-link>
      <nuxt-link to="/test-02">/test-02</nuxt-link>
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
