<template>
    <v-container v-if="!showForm" fluid>
        <div class="tw-flex tw-items-center tw-justify-end">
            <v-btn color="primary" size="small" @click="showForm = true">
                Create Material
            </v-btn>
        </div>
        <div class="tw-p-2">
            <v-data-table flat elevation="0" :items="materials" :loading="isLoading" :headers="[
                { title: 'ID', value: 'id' },
                { title: 'Material Name', value: 'name' },
                { title: 'Yarns', value: 'yarns.length' },
                { title: 'Compose Fabrics', value: 'compose_fabrics.length' },
                { title: 'Created At', value: 'createdAt' },
                { title: '', value: 'actions' }
            ]" class="elevation-1">
                <template #item.yarns.length="{ item }">
                    <span>{{ item.yarns.length }}</span>
                </template>
                <template #item.compose_fabrics.length="{ item }">
                    <span>{{ item.compose_fabrics.length }}</span>
                </template>
                <template #item.createdAt="{ item }">
                    <span>{{ new Date(item.createdAt).toLocaleDateString() }}</span>
                </template>
                <template #item.actions="{ item }">
                    <v-btn color="primary" size="small"><v-icon>mdi-eye</v-icon></v-btn>
                </template>
            </v-data-table>

        </div>
    </v-container>
    <div v-if="showForm">
        <CreateMaterial :showForm="showForm" @update:showForm="showForm = $event" />
    </div>
</template>

<script lang="ts" setup>
import { getMaterials } from '@/api/materials';
import { useLoader } from '@/composables/useLoader';
import CreateMaterial from './CreateMaterial.vue';


const isLoading = ref(false);
const { showLoader, hideLoader } = useLoader();

const materials = ref<Array<any>>([]);

const showForm = ref(false);

const fetchMaterials = async () => {
    isLoading.value = true;
    showLoader();
    try {
        const query = {
            populate: ['yarns', 'compose_fabrics']
        }
        const response = await getMaterials(query);
        materials.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching materials:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
}

const init = async () => {
    isLoading.value = true;
    try {
        await Promise.all([
            fetchMaterials(),
        ]);
    } catch {
        console.error('Error during initialization');
    } finally {
        isLoading.value = false;
    }
}

onMounted(init)
</script>