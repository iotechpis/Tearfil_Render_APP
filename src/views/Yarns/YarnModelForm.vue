<template>
    <v-container fluid>
        <div class="tw-flex tw-justify-between tw-items-center">
            <h2 class="tw-text-2xl tw-font-semibold">
                Create New Yarn
            </h2>
            <div class="tw-flex tw-gap-4">
                <v-btn v-if="possibleToSave && !props.isViewOnly" color="primary" size="small" @click="handleSaveClick"
                    :loading="isLoadingSave">
                    Save
                </v-btn>
                <v-btn color="primary" size="small" @click="close">
                    Close
                </v-btn>
            </div>
        </div>
        <v-dialog v-model="showThreadModal" max-width="500" persistent>
            <v-card :loading="isLoadingSave">
                <v-card-title>Select Thread</v-card-title>
                <v-card-text>
                    <p class="tw-mb-4">A new spool will be created for this yarn. Please select which thread to
                        associate it with.</p>
                    <v-select v-model="selectedThread" :items="threads" item-title="name" item-value="id"
                        label="Available Threads" density="compact" hide-details></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showThreadModal = false" :disabled="isLoadingSave">
                        Cancel
                    </v-btn>
                    <v-btn color="primary" @click="confirmThreadSelection" :disabled="!selectedThread || isLoadingSave">
                        Confirm and Save
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <div class="tw-flex tw-mt-1 tw-gap-4 tw-h-full">
            <div class="tw-w-1/3 tw-bg-primary-100 tw-p-4 tw-rounded-lg tw-overflow-y-auto">
                <v-form class="tw-flex tw-flex-col tw-gap-2">
                    <h2>{{ type == 'single' ? 'Single Yarn' : 'Compose Yarns' }}</h2>

                    <v-text-field v-if="type == 'compose'" v-model="composeFabricName" label="Composition Name" required
                        density="compact" class="tw-mb-2" hide-details></v-text-field>

                    <v-text-field v-model="form.name" label="Yarn Name" required></v-text-field>
                    <v-text-field v-model="form.numberOfStrings" type="number" label="Number of strings"></v-text-field>

                    <template v-if="type == 'single'">
                        <h3 class="tw-font-semibold tw-mt-4">Colors</h3>

                        <div v-if="form.colors.length > 0" class="tw-flex tw-flex-col tw-gap-2 tw-mb-2">
                            <div v-for="(cor, index) in form.colors" :key="index"
                                class="tw-flex tw-items-center tw-gap-2 tw-p-2 tw-bg-white tw-rounded">
                                <div class="tw-w-6 tw-h-6 tw-rounded tw-border" :style="{ backgroundColor: cor.color }">
                                </div>
                                <span class="tw-flex-1">{{ cor.color }} - {{ cor.percentage }}%</span>
                                <v-btn icon="mdi-delete" variant="text" size="x-small"
                                    @click="removerCor(index)"></v-btn>
                            </div>
                        </div>

                        <div class="tw-p-2 tw-border tw-rounded-lg tw-bg-white">
                            <v-color-picker class="tw-w-full" elevation="0" mode="hex" flat
                                v-model="newColor"></v-color-picker>
                            <v-text-field v-model.number="newPercentage" label="Percentage (%)" type="number" suffix="%"
                                class="tw-mt-2" hide-details></v-text-field>
                            <v-btn color="secondary" size="small" block class="tw-mt-2" @click="adicionarCor">
                                Add Color
                            </v-btn>
                        </div>
                    </template>

                    <template v-if="type == 'compose'">
                        <h3 class="tw-font-semibold tw-mt-4">Colors</h3>

                        <div v-if="form.colors.length > 0" class="tw-flex tw-flex-col tw-gap-2 tw-mb-2">
                            <div v-for="(cor, index) in form.colors" :key="index"
                                class="tw-flex tw-items-center tw-gap-2 tw-p-2 tw-bg-white tw-rounded">
                                <div class="tw-w-6 tw-h-6 tw-rounded tw-border" :style="{ backgroundColor: cor.color }">
                                </div>
                                <span class="tw-flex-1">{{ cor.color }} - {{ cor.percentage }}%</span>
                                <v-btn icon="mdi-delete" variant="text" size="x-small"
                                    @click="removerCor(index)"></v-btn>
                            </div>
                        </div>

                        <div class="tw-p-2 tw-border tw-rounded-lg tw-bg-white">
                            <v-color-picker class="tw-w-full" elevation="0" mode="hex" flat
                                v-model="newColor"></v-color-picker>
                            <v-text-field v-model.number="newPercentage" label="Percentage (%)" type="number" suffix="%"
                                class="tw-mt-2" hide-details></v-text-field>
                            <v-btn color="secondary" size="small" block class="tw-mt-2" @click="adicionarCor">
                                Add Color
                            </v-btn>
                        </div>
                    </template>

                    <v-slider v-model="form.twist" :step="1" label="Twist" thumb-label density="compact"
                        hide-details></v-slider>
                    <v-slider v-model="form.chaos" :step="1" label="Chaos" thumb-label density="compact"
                        hide-details></v-slider>
                    <div v-if="type == 'single'" class="tw-flex tw-justify-end tw-mt-4">
                        <v-btn color="primary" size="small" @click="applyChanges">
                            Apply Changes
                        </v-btn>
                    </div>
                    <div v-if="type == 'compose'" class="tw-flex tw-justify-end tw-mt-4 tw-gap-2">
                        <v-btn color="primary" size="small" @click="addYarnToFabrics">
                            Add to Fabrics
                        </v-btn>
                        <v-btn color="primary" size="small" @click="compose">
                            Apply Changes
                        </v-btn>
                    </div>
                </v-form>

            </div>

            <div class="tw-w-2/3" v-if="showNewYarn">
                <CreateYarn :form="previewForm" />
            </div>

            <div class="tw-w-2/3" v-if="fabricsCompose">
                <div class="tw-flex tw-gap-1">
                    <div v-for="(yarn, index) in previewFabricsForm" :key="index" class="">
                        {{ yarn.name }} {{ index < previewFabricsForm.length - 1 ? ',' : '' }} </div>
                    </div>
                    <CompositeYarn :fabrics="previewFabricsForm" />
                </div>
            </div>
    </v-container>
</template>

<script lang="ts" setup>
import CreateYarn from './CreateYarn.vue';
import CompositeYarn from './CompositeYarn.vue';
import { createColor } from '@/api/colors';
import { createString } from '@/api/strings';
import { createYarn } from '@/api/yarns';
import { createSpool } from '@/api/spools';
import { getThreads } from '@/api/threads';
import { useLoader } from '@/composables/useLoader';
import { createComposeFabric } from '@/api/compose-fabrics';

const isLoadingSave = ref<boolean>(false);
const { showLoader, hideLoader } = useLoader();

interface Props {
    showForm: boolean;
    type: 'single' | 'compose';
    initialData: any;
    isViewOnly: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:showForm']);

const showThreadModal = ref<boolean>(false);
const threads = ref<any[]>([]);
const selectedThread = ref<string | null>(null);

const showNewYarn = ref<boolean>(false);
const possibleToSave = ref<boolean>(false);

const composeFabricName = ref<string>('');

interface Color {
    color: string;
    percentage: number;
}

interface YarnFormData {
    name: string;
    numberOfStrings: number;
    colors: Color[];
    twist: number;
    chaos: number;
}

const form = ref<YarnFormData>({
    name: '',
    numberOfStrings: 0,
    colors: [],
    twist: 0,
    chaos: 0,
})

const previewForm = ref<YarnFormData>({
    ...form.value
});

const newColor = ref<string>('#FFFFFF');
const newPercentage = ref<number>(100);

const adicionarCor = () => {
    if (newPercentage.value > 0) {
        const totalAtual = form.value.colors.reduce((sum, c) => sum + c.percentage, 0);
        const novoTotal = totalAtual + newPercentage.value;

        if (novoTotal > 100) {
            alert(`O total das cores não pode ultrapassar 100%. Valor atual: ${totalAtual}%.`);
            return;
        }
        form.value.colors.push({
            color: newColor.value,
            percentage: newPercentage.value,
        });
    }
};

const removerCor = (index: number) => {
    form.value.colors.splice(index, 1);
};

const validateForm = () => {
    if (!form.value.name) {
        alert('Please enter a name for the yarn.');
        return false;
    }
    if (form.value.numberOfStrings <= 0) {
        alert('Number of strings must be greater than zero.');
        return false;
    }
    if (props.type === 'single') {
        const totalPercentage = form.value.colors.reduce((sum, c) => sum + c.percentage, 0);
        if (totalPercentage !== 100) {
            alert(`The total percentage of colors must equal 100%. Current total: ${totalPercentage}%.`);
            return false;
        }
    }
    return true;
};

const applyChanges = () => {
    if (!validateForm()) {
        return;
    }
    showNewYarn.value = true;
    previewForm.value = { ...form.value };
    possibleToSave.value = true;
};

const type = ref<string>(props.type || 'single');


const fabricsCompose = ref<boolean>(false);

const fabrics = ref<YarnFormData[]>([]);

const addYarnToFabrics = () => {
    fabrics.value.push({ ...form.value });
    form.value = {
        name: '',
        numberOfStrings: 0,
        colors: [],
        twist: 0,
        chaos: 0,
    };
    showNewYarn.value = false;
    possibleToSave.value = false;
};

// @ts-ignore
const previewFabricsForm = ref<YarnFormData[]>({
    ...fabrics.value
});

const validateFabrics = () => {
    if (fabrics.value.length === 0) {
        alert('Please add at least one yarn to compose.');
        return false;
    }

    if (fabrics.value.some(yarn => yarn.numberOfStrings <= 0)) {
        alert('All yarns must have a number of strings greater than zero.');
        return false;
    }

    if (fabrics.value.some(yarn => {
        const totalPercentage = yarn.colors.reduce((sum, c) => sum + c.percentage, 0);
        return totalPercentage !== 100;
    })) {
        alert('All yarns must have colors with a total percentage equal to 100%.');
        return false;
    }

    if (fabrics.value.some(yarn => !yarn.name)) {
        alert('All yarns must have a name.');
        return false;
    }
    return true;
};

const compose = () => {
    if (!validateFabrics()) {
        return;
    }
    showNewYarn.value = false;
    fabricsCompose.value = true;
    previewFabricsForm.value = [...fabrics.value];
    possibleToSave.value = true;
}

const fetchThreads = async () => {
    isLoadingSave.value = true;
    showLoader();
    try {
        const query = {};
        const response = await getThreads(query);
        threads.value = (response.data as any).data;
    } catch (error) {
        console.error('Error fetching threads:', error);
        alert('Could not load threads. Please try again.');
    } finally {
        isLoadingSave.value = false;
        hideLoader();
    }
};

const handleSaveClick = async () => {
    if (!possibleToSave.value) {
        alert('Please apply changes before saving.');
        return;
    }
    if (type.value === 'compose') {
        if (!composeFabricName.value) {
            alert('Please provide a Composition Name.');
            return;
        }
        if (previewFabricsForm.value.length === 0) {
            alert('Please add yarns and click "Apply Changes" before saving.');
            return;
        }
    }
    if (threads.value.length === 0) {
        await fetchThreads();
    }
    if (threads.value.length > 0) {
        showThreadModal.value = true;
    }
};

const confirmThreadSelection = () => {
    if (!selectedThread.value) {
        alert('Please select a thread.');
        return;
    }
    showThreadModal.value = false;
    executeSave(selectedThread.value);
    selectedThread.value = null;
};

const executeSave = async (threadId: string | null) => {
    if (type.value === 'single') {
        if (!threadId) {
            alert('A thread ID is required to save a single yarn.');
            return;
        }

        isLoadingSave.value = true;
        showLoader();

        try {
            const formToSave = previewForm.value;
            const stringData = {
                number: formToSave.numberOfStrings,
            };
            const stringResponse = await createString({ ...stringData });
            const stringId = stringResponse.data.data.id;

            const colorPromises = formToSave.colors.map(cor => {
                return createColor({
                    code: cor.color,
                    percentage: cor.percentage,
                    string: stringId
                });
            });
            await Promise.all(colorPromises);

            const yarnData = {
                name: formToSave.name,
                twist: formToSave.twist,
                chaos: formToSave.chaos,
                strings: [stringId]
            };
            const yarnResponse = await createYarn({ ...yarnData });
            const yarnId = yarnResponse.data.data.id;


            const spoolData = {
                name: `${formToSave.name} Spool`,
                yarn: yarnId,
                thread: threadId
            };
            await createSpool({ ...spoolData });

            alert('Yarn saved successfully!');
            close();
        } catch (error) {
            console.error('Error saving yarn:', error);
            alert('An error occurred while saving. Please check the console.');
        } finally {
            isLoadingSave.value = false;
            hideLoader();
        }
    } else {
        try {
            const yarnsToCreate = previewFabricsForm.value;
            const createdYarnIds: string[] = [];

            for (const yarnForm of yarnsToCreate) {
                const stringResponse = await createString({
                    number: yarnForm.numberOfStrings,
                });
                const stringId = stringResponse.data.data.id;

                const colorPromises = yarnForm.colors.map(cor => createColor({
                    code: cor.color, 
                    percentage: cor.percentage, 
                    string: stringId
                }));
                await Promise.all(colorPromises);

                const yarnResponse = await createYarn({
                        name: yarnForm.name,
                        twist: yarnForm.twist,
                        chaos: yarnForm.chaos,
                        strings: [stringId]
                });
                const yarnId = yarnResponse.data.data.id;

                await createSpool({
                        name: `${yarnForm.name} Spool`,
                        yarn: yarnId,
                        thread: threadId
                });

                createdYarnIds.push(yarnId);
            }

            const composeFabricData = {
                name: composeFabricName.value,
                yarns: createdYarnIds 
            };
            await createComposeFabric({ ...composeFabricData });

            alert('Compose Fabric saved successfully!');
            close();

        } catch (error) {
            console.error('Error saving compose fabric:', error);
            alert('An error occurred while saving the compose fabric.');
        } finally {
            isLoadingSave.value = false;
            hideLoader();
        }
    }
};

const localShowForm = ref<boolean>(props.showForm);

watch(() => props.initialData, (newData) => {
    if (newData) {
        if (props.type === 'single') {
            form.value = {
                name: newData.name || '',
                numberOfStrings: newData.numberOfStrings || 0,
                colors: newData.colors ? newData.colors.map((c: any) => ({
                    color: c.color,
                    percentage: c.percentage
                })) : [],
                twist: newData.twist || 0,
                chaos: newData.chaos || 0,
            };
        } else if (props.type === 'compose') {
            fabrics.value = newData.yarns ? newData.yarns.map((yarn: any) => ({
                name: yarn.name || '',
                numberOfStrings: yarn.numberOfStrings || 0,
                colors: yarn.colors ? yarn.colors.map((c: any) => ({
                    color: c.color,
                    percentage: c.percentage
                })) : [],
                twist: yarn.twist || 0,
                chaos: yarn.chaos || 0,
            })) : [];
        }
    }
}, { immediate: true });

watch(() => props.showForm, (newShowFrom) => {
    localShowForm.value = newShowFrom;
});

const close = () => {
    emit('update:showForm', false);
};

</script>