<template>
    <v-container v-if="!showForm" fluid>
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
            <h2 class="tw-text-2xl tw-font-semibold tw-mb-4">
                Yarns Produced
            </h2>
        </div>
        <div class="tw-flex tw-gap-2">
            <v-btn class="tw-border tw-w-32 tw-border-primary" size="small"
                :class="type === 'single' ? 'tw-bg-primary tw-text-white' : ''" @click="type = 'single'">
                Single
            </v-btn>
            <v-btn class="tw-border tw-w-32 tw-border-primary" size="small"
                :class="type === 'compose' ? 'tw-bg-primary tw-text-white' : ''" @click="type = 'compose'">
                Composite
            </v-btn>
        </div>
        <div class="tw-p-2" v-if="type === 'single'">
            <div class="tw-flex tw-justify-end">
                <v-btn color="primary" size="small" @click="handleCreateNew">
                    Create New Yarn
                </v-btn>
            </div>
            <v-data-table :items="yarns" :headers-props="{ class: 'tw-bg-secondary' }" :headers="[
                { title: 'ID', value: 'id' },
                { title: 'Yarn Name', value: 'name' },
                { title: 'Date', value: 'createdAt' },
                { title: 'Production', value: 'production' },
                { title: '', value: 'actions' },
            ]">
                <template #item.createdAt="{ item }">
                    {{ new Date((item as Yarn).createdAt).toLocaleDateString().split('T')[0] }}
                </template>

                <template #item.actions="{ item }">
                    <v-btn color="primary" size="small"
                        @click="handleViewItem(item, 'single')"><v-icon>mdi-eye</v-icon></v-btn>
                </template>

                <template #item.production="{ item }">
                    {{ item.spool?.thread?.name || 'N/A' }}
                </template>
            </v-data-table>
        </div>
        <div class="tw-p-2" v-else-if="type === 'compose'">
            <div class="tw-flex tw-justify-end">
                <v-btn color="primary" size="small" @click="handleCreateNew">
                    Create New Yarn
                </v-btn>
            </div>

            <v-data-table-server :headers-props="{ class: 'tw-bg-secondary-100' }" :headers="[
                { title: 'ID', value: 'id' },
                { title: 'Composition Name', value: 'name' },
                { title: 'Date', value: 'createdAt' },
                { title: '', value: 'actions' },
            ]" :items="composeFabrics" :itemsLength="composeFabrics.length" :loading="isLoading" expand-on-click
                fixed-header items-per-page="10" height="600" hover :header-props="{ class: 'bg-gray-200' }" show-expand
                v-model:expanded="expandedItems">
                <template #item.createdAt="{ item }">
                    {{ new Date(item.createdAt).toLocaleDateString().split('T')[0] }}
                </template>

                <template #item.actions="{ item }">
                    <v-btn color="primary" size="small"
                        @click="handleViewItem(item, 'single')"><v-icon>mdi-eye</v-icon></v-btn>
                </template>

                <template #expanded-row="{ columns, item }">
                    <td :colspan="columns.length">
                        <v-data-table :items="item.yarns" :headers-props="{ class: 'tw-bg-primary-100' }" :headers="[
                            { title: 'ID', value: 'id' },
                            { title: 'Yarn Name', value: 'name' },
                            { title: 'Date', value: 'createdAt' },
                            { title: '', value: 'actions' },
                        ]">
                            <template #item.createdAt="{ item }">
                                {{ new Date(item.createdAt).toLocaleDateString().split('T')[0] }}
                            </template>

                            <template #item.actions="{ item }">
                                <v-btn color="primary" size="small"
                                    @click="handleViewItem(item, 'single')"><v-icon>mdi-eye</v-icon></v-btn>
                            </template>
                        </v-data-table>
                    </td>
                </template>

            </v-data-table-server>
        </div>
    </v-container>
    <div v-if="showForm">
        <YarnModelForm :type="formType" :showForm="showForm" @update:showForm="showForm = $event"
            :initialData="selectedItem" :isViewOnly="isViewOnly" />
    </div>
</template>

<script lang="ts" setup>
import { getYarns } from '@/api/yarns';
import { getComposeFabrics } from '@/api/compose-fabrics';
import { useLoader } from '@/composables/useLoader';
import YarnModelForm from './YarnModelForm.vue';

const showForm = ref(false);

const isLoading = ref(false);
const { showLoader, hideLoader } = useLoader();

const type = ref<'single' | 'compose'>('single');

const expandedItems = ref<Array<string>>([]);

const selectedItem = ref<Yarn | ComposeFabric | null>(null);
const isViewOnly = ref(false);
const formType = ref<'single' | 'compose'>('single');

interface Yarn {
    id: string;
    name: string;
    createdAt: string;
    production?: string;
    spool?: {
        thread: {
            name: string;
        };
    };
    numberOfStrings?: number;
    colors?: { color: string; percentage: number }[];
    twist?: number;
    chaos?: number;
}

interface ComposeFabric {
    id: string;
    name: string;
    createdAt: string;
    yarns: Yarn[];
}

const yarns = ref<Yarn[]>([]);
const composeFabrics = ref<ComposeFabric[]>([]);

const fetchComposeFabrics = async () => {
    isLoading.value = true;
    showLoader();
    try {
        const query = {
            populate: ['yarns.strings.colors']
        }
        const response = await getComposeFabrics(query);
        composeFabrics.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching compose fabrics:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
}

const fetchYarns = async () => {
    isLoading.value = true;
    showLoader();
    try {
        const query = {
            populate: ['strings.colors', 'spool.thread']
        }
        const response = await getYarns(query);
        yarns.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching yarns:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
}

const handleCreateNew = () => {
    selectedItem.value = null;
    isViewOnly.value = false;
    formType.value = type.value;
    showForm.value = true;
};

const handleViewItem = (item: Yarn | ComposeFabric, itemType: 'single' | 'compose') => {
    selectedItem.value = item;
    isViewOnly.value = true;
    formType.value = itemType;
    showForm.value = true;
};

watch(showForm, (isShowing) => {
    if (!isShowing) {
        selectedItem.value = null;
        isViewOnly.value = false;
    }
});

const init = async () => {
    isLoading.value = true;
    showLoader();
    try {
        await Promise.all([
            fetchYarns(),
            fetchComposeFabrics()
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