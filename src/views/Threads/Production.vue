<template>
    <v-container fluid v-if="!isMobile">
        <div v-if="thread">
            <Spools :src="`${api_url}${thread?.thread[0].url}`" :code="code" @update:code="code = $event"/>
            <div class="tw-mt-4 tw-w-full">
                <h2 class="tw-text-2xl tw-font-bold tw-mb-2">Spools</h2>
                <div v-if="spools.length === 0">
                    <p>No spools found for this production.</p>
                </div>
                <div v-else class="tw-w-full">
                    <v-data-table :items="spools" :headers="[
                        { title: 'ID', value: 'id' },
                        { title: 'Weight (kg)', value: 'weight' },
                        { title: 'Length (m)', value: 'length' },
                        { title: 'Actions', value: 'actions' }
                    ]" class="elevation-1">
                        <template #item.length="{ item }">
                            {{ item.weight / (item.thread.ne / 100) || '0.00' }}
                        </template>
                        <template #item.actions="{ item }">
                            <v-btn icon small @click="spool = item; drawer = true">
                                <v-icon>mdi-eye</v-icon>
                            </v-btn>
                        </template>
                    </v-data-table>
                </div>
            </div>
        </div>
        <v-navigation-drawer v-model="drawer" permanent location="right" width="900">
            <div v-if="thread" class="tw-p-4">
                <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
                    <v-btn icon @click="drawer = false; spool = null;">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <h2 class="tw-text-2xl tw-font-bold tw-mb-4">Spool Preview</h2>
                </div>
                <p><strong>ID:</strong> {{ thread.id }}</p>
                <p><strong>Name:</strong> {{ thread.name }}</p>
            </div>

            <div v-if="spool" class="tw-p-4">
                <h3 class="tw-text-xl tw-font-bold tw-mb-2">Spool Details</h3>
                <p><strong>ID:</strong> {{ spool.id }}</p>
                <p><strong>Weight (kg):</strong> {{ spool.weight }}</p>
                <p><strong>Length (m):</strong> {{ spool.weight / (spool.thread.ne / 100) || '0.00' }}</p>
                <p><strong>Thread NE:</strong> {{ spool.thread.ne }}</p>
            </div>

            <div class="tw-p-4">
                <Spools v-if="spool" :src="`${api_url}${spool?.spool[0].url}`" :code="code"/>
            </div>
            <div v-if="spool" class="tw-p-4">
                <v-btn color="primary" :to="`/productions/${productionId}/spool-details/${spool.documentId}`">Details</v-btn>
            </div>
        </v-navigation-drawer>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useLoader } from '@/composables/useLoader';
import { getThread } from '@/api/threads';
import Spools from './Spools.vue';
import { getSpools } from '@/api/spools';

const api_url = import.meta.env.VITE_API_URL;
const code = ref<string>('');
const lgAndUp = useDisplay()
const productionCode = ref<string>('');

watch(() => code.value, (newCode) => {
    const spoolName = `${newCode.split('_')[3]}_${productionCode.value}`;
    console.log('Spool Name:', spoolName);
    const s = spools.value.find(s => s.name === spoolName);
    console.log('Found Spool:', spool); 
    if (s) {
        spool.value = s;
        drawer.value = true;
    }
});

const isMobile = computed(() => {
    console.log('isMobile', lgAndUp.mobile.value);
    return lgAndUp.mobile.value;
});
const $route = useRoute();
const { showLoader, hideLoader } = useLoader();

const drawer = ref(false);

const productionId = $route.params.id as string;
const thread = ref<any>(null);
const spools = ref<any[]>([]);
const spool = ref<any>(null);

const fetchSpools = async (productionId: string) => {
    showLoader();
    try {
        const query = {
            filters: {
                thread: productionId
            },
            populate: ['thread', 'spool']
        }
        const response = await getSpools(query);
        console.log('Spools data:', response.data);
        spools.value = (response.data as any).data;
        productionCode.value = spools.value[0] ? spools.value[0].name.split('_')[1] : '';
    } catch (error) {
        console.error('Error fetching spools:', error);
    } finally {
        hideLoader();
    }
}

const fetchThread = async (productionId: string) => {
    showLoader();
    try {
        const query = {
            populate: ['thread']
        }
        const response = await getThread(productionId, query);
        console.log('Thread data:', response.data);
        thread.value = (response.data as any).data;
        console.log('Thread value:', thread.value);
        await fetchSpools(thread.value.id);
    } catch (error) {
        console.error('Error fetching thread:', error);
    } finally {
        hideLoader();
    }
}

onMounted(() => {
    console.log('Production ID:', productionId);
    if (productionId) {
        fetchThread(productionId);
    }
})
</script>