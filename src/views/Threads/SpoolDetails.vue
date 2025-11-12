<template>
    <v-container fluid v-if="!isMobile">
        <div v-if="spool" class="tw-p-4">
            <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
                <h1 class="tw-text-2xl tw-font-semibold">
                    Spool Details - {{ spool.name }}
                </h1>
            </div>
            <div class="tw-flex tw-gap-4">
                <div class="tw-w-1/2">
                    <Spools :code="''" :src="`${api_url}${spool?.spool[0].url}`" />
                </div>
                <div class="tw-w-1/2">
                    <YarnModel :strings="spool.yarn.strings[0]" />
                </div>
            </div>
            <div class="tw-mt-4 tw-w-full">
                <h2 class="tw-text-xl tw-font-semibold tw-mb-2">Yarn Information</h2>
                <div class="tw-flex tw-gap-4">
                    <div class="tw-w-1/2">
                        <v-card>
                            <v-card-title>
                                Spool Details
                            </v-card-title>
                            <v-card-text>
                                <p class="tw-flex tw-justify-between">
                                    <span class="tw-font-semibold tw-flex tw-items-center tw-gap-1">
                                        <v-icon small>mdi-calendar</v-icon>
                                        <span>Date:</span>
                                    </span>
                                    <span>{{ spool.createdAt.split('T')[0] }}</span>
                                </p>
                                <p class="tw-flex tw-justify-between">
                                    <span class="tw-font-semibold tw-flex tw-items-center tw-gap-1">
                                        <v-icon small>mdi-tag</v-icon>
                                        <span>Name:</span>
                                    </span>
                                    <span>{{ spool.name }}</span>
                                </p>
                                <p class="tw-flex tw-justify-between">
                                    <span class="tw-font-semibold tw-flex tw-items-center tw-gap-1">
                                        <v-icon small>mdi-weight</v-icon>
                                        <span>Weight:</span>
                                    </span>
                                    <span>{{ spool.weight }} Kg</span>
                                </p>
                            </v-card-text>
                        </v-card>
                    </div>

                    <div class="tw-w-1/2">
                        <v-card>
                            <v-card-title>
                                Yarn Details
                            </v-card-title>
                            <v-card-text>
                                <p class="tw-flex tw-justify-between">
                                    <span class="tw-font-semibold tw-flex tw-items-center tw-gap-1">
                                        <v-icon small>mdi-tag</v-icon>
                                        <span>Name:</span>
                                    </span>
                                    <span>{{ spool.yarn.name }}</span>
                                </p>
                                <div class="tw-mt-2">
                                    <h3 class="tw-font-semibold tw-mb-1">Strings:</h3>
                                    <div v-for="(yarnDef, yarnIndex) in spool.yarn.strings" :key="yarnIndex"
                                        class="tw-mb-4 tw-border-t tw-pt-2">
                                        <h3 class="tw-font-semibold tw-mb-1">
                                            Yarn Definition {{ yarnIndex + 1 }} ({{ yarnDef.number }} strings)
                                        </h3>

                                        <div v-for="(colorItem, index) in yarnDef.colors" :key="index"
                                            class="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                                            <span class="tw-h-6 tw-text-center tw-text-xs"
                                                :style="{ backgroundColor: colorItem.code }">{{ colorItem.code }}</span>
                                            <v-progress-linear color="red" :buffer-value="colorItem.percentage">
                                            </v-progress-linear>
                                            <span class="tw-w-8 tw-text-right tw-text-xs">{{ colorItem.percentage
                                                }}%</span>
                                        </div>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </div>
            <div class="tw-mt-4 tw-flex tw-justify-end">
                <v-btn @click="drawer = true" class="tw-w-32" color="primary">
                    Render
                </v-btn>
            </div>
        </div>
        <v-navigation-drawer v-model="drawer" location="right" permanent width="900">
            <div class="tw-flex tw-justify-end">
                <v-btn icon @click="drawer = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
        </v-navigation-drawer>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useLoader } from '@/composables/useLoader';
import { getSpool } from '@/api/spools';
import Spools from './Spools.vue';
import YarnModel from '../Yarns/YarnModel.vue';

const drawer = ref(false);
const api_url = import.meta.env.VITE_API_URL;

const lgAndUp = useDisplay()

const isMobile = computed(() => {
    console.log('isMobile', lgAndUp.mobile.value);
    return lgAndUp.mobile.value;
});
const $route = useRoute();
const { showLoader, hideLoader } = useLoader();

const spoolId = $route.params.spoolId as string;

const spool = ref<any>(null);

const fetchSpool = async (spoolId: string) => {
    showLoader();
    try {
        const query = {
            populate: ['thread', 'spool', 'yarn.strings.colors']
        }
        const response = await getSpool(spoolId, query);
        console.log('Spool data:', response.data);
        spool.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching spool:', error);
    } finally {
        hideLoader();
    }
}

onMounted(async () => {
    if (spoolId) {
        await fetchSpool(spoolId);
    }
});
</script>