<template>
    <v-container fluid>
        <v-data-table :items="threads" :headers="[
            { title: 'ID', value: 'id' },
            { title: 'Thread', value: 'name' },
            { title: 'date', value: 'production' },
            { title: '', value: 'actions' },
        ]">
            <template #item.production="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString().split('T')[0] }}
            </template>

            <template #item.actions="{ item }">
                <v-btn :to="`productions/${item.documentId}`" color="primary" size="small">Ver</v-btn>
            </template>
        </v-data-table>
    </v-container>
</template>

<script lang="ts" setup>
import { getThreads } from '@/api/threads';
import { useLoader } from '@/composables/useLoader';

const isLoading = ref(false);
const { showLoader, hideLoader } = useLoader();

const threads = ref<any[]>([]);

const fecthThreads = async () => {
    isLoading.value = true;
    showLoader();
    try {
        const query = {}
        const response = await getThreads(query);
        threads.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching threads:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
}

const init = async () => {
    isLoading.value = true;
    showLoader();
    try {
        await Promise.all([
            fecthThreads(),
        ]);
    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
}

onMounted(init)
</script>