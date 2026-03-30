<script setup lang="ts">
const route = useRoute();

await navigateTo(
  {
    path: "/primary",
    query: route.query,
    hash: route.hash,
  },
  { redirectCode: 301, replace: true },
);
</script>
