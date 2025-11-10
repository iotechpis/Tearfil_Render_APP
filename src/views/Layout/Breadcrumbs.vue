<template>
    <v-breadcrumbs
        class="tw-px-0 tw-pt-0 tw-pb-7"
        :items="items">
        <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
</template>

<script setup lang="ts">
    import { useRoute } from 'vue-router';
    import { VBreadcrumbs } from 'vuetify/lib/components/index.mjs';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    const $route = useRoute();
    const $t = useI18n().t;

    const items = computed(() => {
        const routes = $route.matched;
        const items: VBreadcrumbs['$props']['items'] = [];
        routes.forEach((route) => {
            items.push({
                title: $t(`${route.name as string}`),
                disabled: route.name === $route.name,
                to: route.path,
            });
        });
        return items;
    });
</script>

<style scoped></style>