<template>
    <div class="tw-p-4 tw-flex tw-items-center tw-justify-between">
        <div class="tw-text-2xl tw-font-semibold">
            Create a New Fabric/Material
        </div>
        <div class="tw-flex tw-gap-4">
            <v-btn color="primary" size="small" @click="close">
                Close
            </v-btn>
        </div>
    </div>
    <div class="tw-flex tw-gap-4 tw-h-full">
        <div class="tw-w-1/3 tw-bg-primary-100 tw-p-4 tw-rounded-lg tw-overflow-y-auto">
            <v-form fluid>
                <div class="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-mb-4">
                    <div class="tw-w-40 tw-p-2 tw-text-center tw-border tw-border-primary tw-rounded-lg tw-cursor-pointer"
                        :class="type === 'yarn' ? 'tw-bg-primary tw-text-white' : ''" @click="type = 'yarn'">
                        Yarn
                    </div>
                    <div class="tw-w-40 tw-p-2 tw-text-center tw-border tw-border-primary tw-rounded-lg tw-cursor-pointer"
                        :class="type === 'compose' ? 'tw-bg-primary tw-text-white' : ''" @click="type = 'compose'">
                        Compose Fabric
                    </div>
                </div>
                <v-divider class="tw-mt-1 tw-mb-1"></v-divider>
                <div class="tw-mt-2 tw-flex tw-flex-col tw-gap-4">
                    <v-select v-if="type === 'yarn'" v-model="selectedYarn" :items="yarns" item-title="name"
                        item-value="id" label="Select Yarn" outlined dense></v-select>

                    <v-select v-if="type === 'compose'" v-model="selectedComposeFabric" :items="composeFabrics"
                        item-title="name" item-value="id" label="Select Compose Fabric" outlined dense></v-select>

                    <v-checkbox v-model="applyYarnCard" dense>
                        <template v-slot:label>
                            <span class="tw-font-medium">Apply Yarn Card</span>
                        </template>
                    </v-checkbox>

                    <v-text-field :disabled="!applyYarnCard" v-model="yarnCrossing" label="Yarn Crossing" type="number"
                        outlined dense></v-text-field>

                    <div class="tw-mt-4 tw-flex tw-justify-end" v-if="applyYarnCard && yarnCrossing > 0">
                        <v-btn color="primary" @click="showMaterialPreview" :loading="isLoading">
                            Generate Material
                        </v-btn>
                    </div>
                </div>
            </v-form>
        </div>

        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4 tw-h-96" v-if="showYarn && !applyYarnCard">
            <CreateYarn :form="yarnForm" />
        </div>
        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4 tw-h-96" v-if="showYarn && applyYarnCard">
            <CreateYarn :form="yarnForm" :showCard="applyYarnCard" />
        </div>
        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4 tw-h-96" v-if="showComposeFabric && !applyYarnCard">
            <CompositeYarn :fabrics="composeFabricForm" :compositeTwist="compositeTwist" />
        </div>
        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4 tw-h-96" v-if="showComposeFabric && applyYarnCard">
            <CompositeYarn :fabrics="composeFabricForm" :compositeTwist="compositeTwist" :showCard="applyYarnCard" />
        </div>
        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4 tw-h-96" v-if="materialPreview">
            <MaterialSimulator :fabrics="previewData" :crossings="yarnCrossing" />
        </div>
    </div>

</template>

<script lang="ts" setup>
import { getYarns } from '@/api/yarns';
import { getComposeFabrics } from '@/api/compose-fabrics';
import { useLoader } from '@/composables/useLoader';
import CreateYarn from '../Yarns/CreateYarn.vue';
import CompositeYarn from '../Yarns/CompositeYarn.vue';
import MaterialSimulator from './MaterialSimulator.vue';

const type = ref<'yarn' | 'compose'>('yarn');

const { showLoader, hideLoader } = useLoader();
const isLoading = ref<boolean>(false);

interface Props {
    showForm: boolean;
}

const showYarn = ref<boolean>(false);
const showComposeFabric = ref<boolean>(false);
const yarnForm = ref<any>(null);
const composeFabricForm = ref<any[]>([]);
const compositeTwist = ref<number>(0);

const previewData = computed(() => {
    if (type.value === 'yarn' && yarnForm.value) {
        return [yarnForm.value];
    } else if (type.value === 'compose') {
        return composeFabricForm.value;
    }
    return [];
});

const yarns = ref<any[]>([]);
const composeFabrics = ref<any[]>([]);

const selectedYarn = ref<number | null>(null);
const selectedComposeFabric = ref<number | null>(null);
const applyYarnCard = ref<boolean>(false);
const yarnCrossing = ref<number>(0);
const showGenerateButton = ref<boolean>(false);

watch(() => yarnCrossing.value, (newVal) => {
    if (newVal > 0) {
        showGenerateButton.value = true;
    }
});

const materialPreview = ref<boolean>(false);

const showMaterialPreview = () => {
    if ((type.value === 'yarn' && !selectedYarn.value) ||
        (type.value === 'compose' && !selectedComposeFabric.value)) {
        return;
    }
    materialPreview.value = true;
    showYarn.value = false;
    showComposeFabric.value = false;
};

const props = defineProps<Props>();
const emit = defineEmits(['update:showForm']);

const localShowForm = ref<boolean>(props.showForm);

watch(() => props.showForm, (newShowFrom) => {
    localShowForm.value = newShowFrom;
});

const close = () => {
    emit('update:showForm', false);
};

const fetchYarns = async () => {
    isLoading.value = true;
    showLoader();
    try {
        const query = {
            populate: ['strings.colors']
        }
        const response = await getYarns(query);
        yarns.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching yarns:', error);
    } finally {
        isLoading.value = false;
        hideLoader();
    }
};

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
};

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

watch(() => selectedYarn.value, (newVal) => {
    showYarn.value = true;
    if (selectedYarn.value) {
        const yarn = yarns.value.find(y => y.id === newVal);
        yarnForm.value = {
            name: yarn?.name,
            numberOfStrings: yarn.strings[0].number,
            colors: yarn.strings[0].colors.map(({ code, percentage }: { code: string; percentage: number }) => ({
                color: code,
                percentage
            })),
            twist: yarn.twist,
            chaos: yarn.chaos,
        }
    }
});

watch(() => selectedComposeFabric.value, (newVal) => {
    showComposeFabric.value = true;
    if (selectedComposeFabric.value) {
        const composeFabric = composeFabrics.value.find(cf => cf.id == newVal);

        for (const yarn of composeFabric.yarns) {
            composeFabricForm.value.push({
                name: yarn?.name,
                numberOfStrings: yarn.strings[0].number,
                colors: yarn.strings[0].colors.map(({ code, percentage }: { code: string; percentage: number }) => ({
                    color: code,
                    percentage
                })),
                twist: yarn.twist,
                chaos: yarn.chaos,
            });
        }
        compositeTwist.value = composeFabric.twist;
    }
})

onMounted(init);
</script>