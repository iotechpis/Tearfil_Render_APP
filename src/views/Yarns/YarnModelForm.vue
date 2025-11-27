<template>
    <v-container fluid>
        <div class="my-2 mb-4">
            <div class="d-flex justify-space-between align-center">
                <div class="d-flex">
                    <v-btn
                        v-if="possibleToSave && !props.isViewOnly"
                        color="primary"
                        class="mr-2"
                        @click="handleSaveClick"
                        :loading="isLoadingSave">
                        Save
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="outlined"
                        @click="close">
                        Close
                    </v-btn>
                </div>
            </div>
        </div>

        <v-dialog
            v-model="showThreadModal"
            max-width="500"
            persistent>
            <v-card :loading="isLoadingSave">
                <v-card-title class="text-h6">Select Thread</v-card-title>
                <v-card-text>
                    <p class="text-body-2 mb-4">A new spool will be created for this yarn. Please select which thread to associate it with.</p>
                    <v-select
                        v-model="selectedThread"
                        :items="threads"
                        item-title="name"
                        item-value="id"
                        label="Available Threads"
                        variant="outlined"
                        density="compact"
                        hide-details></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        variant="outlined"
                        @click="showThreadModal = false"
                        :disabled="isLoadingSave">
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        class="ml-2"
                        @click="confirmThreadSelection"
                        :disabled="!selectedThread || isLoadingSave">
                        Confirm and Save
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Error Display (for API errors only) -->
        <v-alert
            v-if="errorMessage && !formRef"
            class="mt-2"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = ''"
            >{{ errorMessage }}</v-alert
        >
        <v-row
            class="mt-2"
            align="stretch">
            <v-col
                cols="12"
                md="4">
                <v-card
                    class="pa-3 h-100"
                    variant="outlined"
                    style="display: flex; flex-direction: column">
                    <v-card-title class="pa-0 text-subtitle-1 mb-3">
                        {{ type == 'single' ? 'Single Yarn Configuration' : 'Compose Yarns Configuration' }}
                    </v-card-title>
                    <v-form
                        ref="formRef"
                        style="flex: 1; display: flex; flex-direction: column">
                        <v-text-field
                            v-if="type == 'compose'"
                            v-model="composeFabricName"
                            label="Composition Name"
                            required
                            variant="outlined"
                            density="compact"
                            :rules="[rules.required]"
                            :disabled="props.isViewOnly"></v-text-field>

                        <v-slider
                            v-if="type == 'compose'"
                            v-model="composeFabricTwist"
                            :min="0"
                            :max="100"
                            :step="1"
                            label="Composition Twist"
                            thumb-label
                            density="compact"
                            hide-details
                            class="mt-2"
                            :disabled="props.isViewOnly"></v-slider>

                        <v-divider
                            v-if="type == 'compose'"
                            class="my-3"></v-divider>

                        <div v-if="type == 'compose'">
                            <v-card-title class="pa-0 text-subtitle-1 mb-1">Yarns Added</v-card-title>
                            <v-alert
                                v-if="fabrics.length === 0"
                                type="info"
                                density="compact"
                                variant="tonal"
                                class="mb-2">
                                No yarns added yet. Configure a yarn below and click "Add to Fabrics".
                            </v-alert>
                            <v-chip-group
                                v-else
                                class="mb-0">
                                <v-chip
                                    v-for="(yarn, index) in fabrics"
                                    :key="index"
                                    class="mb-0"
                                    closable
                                    @click:close="fabrics.splice(index, 1)"
                                    :disabled="props.isViewOnly">
                                    {{ yarn.name }}
                                </v-chip>
                            </v-chip-group>
                        </div>

                        <v-divider
                            v-if="type == 'compose'"
                            class="my-3"></v-divider>

                        <v-text-field
                            class="mb-4"
                            v-model="form.name"
                            label="Yarn Name"
                            required
                            variant="outlined"
                            density="compact"
                            :rules="[rules.required]"
                            :disabled="props.isViewOnly"></v-text-field>
                        <v-text-field
                            v-model="form.numberOfStrings"
                            type="number"
                            label="Number of strings"
                            variant="outlined"
                            density="compact"
                            :rules="[rules.required, (v: any) => rules.greaterThan(v, 0) || 'Number of strings must be greater than zero']"
                            :min="1"
                            :disabled="props.isViewOnly"></v-text-field>

                        <template v-if="type == 'single' || type == 'compose'">
                            <v-card-title class="pa-0 text-subtitle-1 mb-1 mt-4">Colors</v-card-title>

                            <div v-if="form.colors.length === 0">
                                <v-alert
                                    type="info"
                                    density="compact"
                                    variant="tonal"
                                    class="mb-2">
                                    No colors added yet. Add colors below to get started.
                                </v-alert>
                            </div>

                            <div
                                v-if="form.colors.length > 0"
                                class="mb-2">
                                <v-chip
                                    v-for="(cor, index) in form.colors"
                                    :key="index"
                                    class="mb-1 mr-2"
                                    closable
                                    @click:close="removerCor(index)"
                                    :disabled="props.isViewOnly">
                                    <div
                                        class="mr-2"
                                        style="width: 16px; height: 16px; border-radius: 4px; border: 1px solid #ccc; display: inline-block"
                                        :style="{ backgroundColor: cor.color }"></div>
                                    {{ cor.color }} - {{ cor.percentage }}%
                                </v-chip>
                            </div>

                            <div v-if="type === 'single' && form.colors.length > 0">
                                <v-alert
                                    :type="colorsTotalPercentage === 100 ? 'success' : 'warning'"
                                    density="compact"
                                    variant="tonal"
                                    class="mb-2">
                                    Total: {{ colorsTotalPercentage }}% {{ colorsTotalPercentage === 100 ? '(Complete)' : `(Need ${100 - colorsTotalPercentage}% more)` }}
                                </v-alert>
                            </div>

                            <v-card
                                v-if="!props.isViewOnly"
                                variant="outlined"
                                class="pa-3 mt-2">
                                <div class="text-body-2 mb-2">Add New Color</div>
                                <v-color-picker
                                    elevation="0"
                                    mode="hex"
                                    flat
                                    v-model="newColor"
                                    hide-inputs></v-color-picker>
                                <div class="mt-2">
                                    <div class="d-flex justify-space-between align-center mb-1">
                                        <span class="text-body-2">Percentage: {{ newPercentage }}%</span>
                                        <span class="text-caption text-medium-emphasis">Remaining: {{ maxPercentage }}%</span>
                                    </div>
                                    <v-slider
                                        v-model="newPercentage"
                                        :min="1"
                                        :max="Math.max(1, maxPercentage)"
                                        :step="1"
                                        thumb-label
                                        density="compact"
                                        hide-details
                                        :disabled="maxPercentage === 0"></v-slider>
                                </div>
                                <v-btn
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    block
                                    class="mt-2"
                                    @click="adicionarCor"
                                    :disabled="maxPercentage === 0 || newPercentage <= 0">
                                    Add Color
                                </v-btn>
                                <v-alert
                                    v-if="type === 'single' && colorsTotalPercentage !== 100"
                                    type="error"
                                    density="compact"
                                    variant="tonal"
                                    class="mt-2">
                                    The total percentage of colors must equal 100%. Current total: {{ colorsTotalPercentage }}%.
                                </v-alert>
                            </v-card>
                        </template>

                        <v-slider
                            v-model="form.twist"
                            :min="0"
                            :max="100"
                            :step="1"
                            label="Twist"
                            thumb-label
                            density="compact"
                            hide-details
                            class="mt-4"
                            :disabled="props.isViewOnly"></v-slider>
                        <v-slider
                            v-model="form.chaos"
                            :min="0"
                            :max="100"
                            :step="1"
                            label="Chaos"
                            thumb-label
                            density="compact"
                            hide-details
                            :disabled="props.isViewOnly"></v-slider>
                        <div
                            v-if="type == 'single' && !props.isViewOnly"
                            class="d-flex mt-4 justify-end">
                            <v-btn
                                color="primary"
                                @click="applyChanges">
                                Apply Changes
                            </v-btn>
                        </div>
                        <div
                            v-if="type == 'compose' && !props.isViewOnly"
                            class="d-flex flex-column tw-gap-4 mt-4 justify-end">
                            <v-btn
                                color="primary"
                                variant="outlined"
                                class="mr-2"
                                @click="addYarnToFabrics">
                                Add to Fabrics
                            </v-btn>
                            <v-btn
                                color="primary"
                                @click="compose">
                                Apply Changes
                            </v-btn>
                        </div>
                    </v-form>
                </v-card>
            </v-col>

            <v-col
                cols="12"
                md="8"
                v-if="showNewYarn">
                <v-card
                    class="pa-3 h-100"
                    variant="outlined"
                    style="display: flex; flex-direction: column">
                    <v-card-title class="pa-0 text-subtitle-1 mb-2">Preview</v-card-title>
                    <div style="flex: 1; min-height: 0">
                        <CreateYarn
                            :key="`yarn-${previewForm.name}-${previewForm.numberOfStrings}`"
                            :form="previewForm" />
                    </div>
                </v-card>
            </v-col>

            <v-col
                cols="12"
                md="8"
                v-if="fabricsCompose">
                <v-card
                    class="pa-3 h-100"
                    variant="outlined"
                    style="display: flex; flex-direction: column">
                    <v-card-title class="pa-0 text-subtitle-1 mb-2">Composite Preview</v-card-title>
                    <div class="mb-3">
                        <v-chip
                            v-for="(yarn, index) in previewFabricsForm"
                            :key="index"
                            class="mb-1 mr-2">
                            {{ yarn.name }}{{ index < previewFabricsForm.length - 1 ? ',' : '' }}
                        </v-chip>
                    </div>
                    <div style="flex: 1; min-height: 400px">
                        <CompositeYarn
                            :key="`composite-${previewFabricsForm.length}-${previewFabricsForm.map((f: any) => f.name).join('-')}-${composeFabricTwist}`"
                            :fabrics="previewFabricsForm"
                            :compositeTwist="composeFabricTwist" />
                    </div>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
    import { VForm } from 'vuetify/lib/components/index.mjs';
    import CreateYarn from './CreateYarn.vue';
    import CompositeYarn from './CompositeYarn.vue';
    import { createColor } from '@/api/colors';
    import { createString } from '@/api/strings';
    import { createYarn } from '@/api/yarns';
    import { createSpool } from '@/api/spools';
    import { getThreads } from '@/api/threads';
    import { useLoader } from '@/composables/useLoader';
    import { useAlert } from '@/composables/useAlert';
    import useRules from '@/composables/rules';
    import { createComposeFabric } from '@/api/compose-fabrics';

    const isLoadingSave = ref<boolean>(false);
    const { showLoader, hideLoader } = useLoader();
    const alertStore = useAlert();
    const showAlert = alertStore.showAlert;
    const errorMessage = ref<string>('');
    const formRef = ref<VForm | null>(null);
    const rules = useRules();

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
    const composeFabricTwist = ref<number>(0);

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
        numberOfStrings: 100,
        colors: [],
        twist: 0,
        chaos: 0,
    });

    const previewForm = ref<YarnFormData>({
        ...form.value,
        colors: [...form.value.colors],
    });

    const newColor = ref<string>('#FFFFFF');
    const newPercentage = ref<number>(100);

    const colorsTotalPercentage = computed(() => {
        return form.value.colors.reduce((sum: number, c: Color) => sum + c.percentage, 0);
    });

    const maxPercentage = computed(() => {
        return Math.max(0, 100 - colorsTotalPercentage.value);
    });

    // Watch for changes in maxPercentage and update newPercentage accordingly
    watch(
        maxPercentage,
        (newMax) => {
            if (newMax === 0) {
                newPercentage.value = 0;
            } else if (newPercentage.value > newMax) {
                newPercentage.value = newMax;
            } else if (newPercentage.value === 0 && newMax > 0) {
                newPercentage.value = Math.min(newMax, 100);
            }
        },
        { immediate: true },
    );

    const adicionarCor = async () => {
        if (newPercentage.value <= 0 || maxPercentage.value === 0) {
            return;
        }

        const totalAtual = form.value.colors.reduce((sum, c) => sum + c.percentage, 0);
        const novoTotal = totalAtual + newPercentage.value;

        if (novoTotal > 100) {
            errorMessage.value = `The total of colors must be equal to 100%. Current total: ${totalAtual}%.`;
            showAlert({
                color: 'error',
                text: `The total of colors must be equal to 100%. Current total: ${totalAtual}%.`,
                variant: 'flat',
            });
            return;
        }

        form.value.colors.push({
            color: newColor.value,
            percentage: newPercentage.value,
        });

        // Set to remaining percentage after adding
        const remaining = 100 - colorsTotalPercentage.value;
        newPercentage.value = Math.max(1, Math.min(remaining, 100));
        errorMessage.value = '';
    };

    const removerCor = (index: number) => {
        form.value.colors.splice(index, 1);
        // Update newPercentage to reflect the new maximum available
        const remaining = 100 - colorsTotalPercentage.value;
        newPercentage.value = Math.max(1, Math.min(remaining, 100));
    };

    const validateForm = async () => {
        if (!formRef.value) return false;

        errorMessage.value = '';
        const { valid } = await formRef.value.validate();

        if (!valid) {
            return false;
        }

        // Additional validation for colors percentage
        if (type.value === 'single') {
            const totalPercentage = form.value.colors.reduce((sum, c) => sum + c.percentage, 0);
            if (totalPercentage !== 100) {
                errorMessage.value = `The total percentage of colors must equal 100%. Current total: ${totalPercentage}%.`;
                showAlert({
                    color: 'error',
                    text: `The total percentage of colors must equal 100%. Current total: ${totalPercentage}%.`,
                    variant: 'flat',
                });
                return false;
            }
        }

        return true;
    };

    const applyChanges = async () => {
        if (!(await validateForm())) {
            return;
        }
        errorMessage.value = '';
        showNewYarn.value = false;
        await nextTick();
        previewForm.value = {
            ...form.value,
            colors: [...form.value.colors],
        };
        await nextTick();
        showNewYarn.value = true;
        possibleToSave.value = true;
        showAlert({
            color: 'success',
            text: 'Changes applied successfully!',
            variant: 'flat',
        });
    };

    const type = ref<'single' | 'compose'>(props.type || 'single');

    const fabricsCompose = ref<boolean>(false);

    const fabrics = ref<YarnFormData[]>([]);

    const addYarnToFabrics = async () => {
        // Validate the form before adding
        if (!formRef.value) return;

        errorMessage.value = '';
        const { valid } = await formRef.value.validate();
        if (!valid) {
            showAlert({
                color: 'error',
                text: 'Please fill in all required fields before adding yarn to fabrics.',
                variant: 'flat',
            });
            return;
        }

        // Validate colors percentage
        if (form.value.colors.length === 0) {
            showAlert({
                color: 'error',
                text: 'Please add at least one color before adding yarn to fabrics.',
                variant: 'flat',
            });
            return;
        }

        const totalPercentage = form.value.colors.reduce((sum, c) => sum + c.percentage, 0);
        if (totalPercentage !== 100) {
            showAlert({
                color: 'error',
                text: `The total percentage of colors must equal 100%. Current total: ${totalPercentage}%.`,
                variant: 'flat',
            });
            return;
        }

        if (form.value.numberOfStrings <= 0) {
            showAlert({
                color: 'error',
                text: 'Number of strings must be greater than zero.',
                variant: 'flat',
            });
            return;
        }

        fabrics.value.push({ ...form.value });
        form.value = {
            name: '',
            numberOfStrings: 100,
            colors: [],
            twist: 0,
            chaos: 0,
        };
        // Reset newPercentage when form resets
        newPercentage.value = 100;
        showNewYarn.value = false;
        possibleToSave.value = false;

        // Reset form validation to clear any error messages after form updates
        await nextTick();
        if (formRef.value) {
            formRef.value.resetValidation();
        }

        showAlert({
            color: 'success',
            text: 'Yarn added to fabrics successfully!',
            variant: 'flat',
        });
    };

    const previewFabricsForm = ref<YarnFormData[]>([...fabrics.value]);

    const validateFabrics = async (requireFormValidation: boolean = false) => {
        errorMessage.value = '';

        // Only validate form fields if required (e.g., when adding yarn to fabrics)
        if (requireFormValidation && formRef.value) {
            const { valid } = await formRef.value.validate();
            if (!valid) {
                return false;
            }
        }

        // Additional validations
        if (fabrics.value.length === 0) {
            errorMessage.value = 'Please add at least one yarn to compose.';
            showAlert({
                color: 'error',
                text: 'Please add at least one yarn to compose.',
                variant: 'flat',
            });
            return false;
        }

        if (fabrics.value.some((yarn) => yarn.numberOfStrings <= 0)) {
            errorMessage.value = 'All yarns must have a number of strings greater than zero.';
            showAlert({
                color: 'error',
                text: 'All yarns must have a number of strings greater than zero.',
                variant: 'flat',
            });
            return false;
        }

        if (
            fabrics.value.some((yarn) => {
                const totalPercentage = yarn.colors.reduce((sum, c) => sum + c.percentage, 0);
                return totalPercentage !== 100;
            })
        ) {
            errorMessage.value = 'All yarns must have colors with a total percentage equal to 100%.';
            showAlert({
                color: 'error',
                text: 'All yarns must have colors with a total percentage equal to 100%.',
                variant: 'flat',
            });
            return false;
        }

        if (fabrics.value.some((yarn) => !yarn.name)) {
            errorMessage.value = 'All yarns must have a name.';
            showAlert({
                color: 'error',
                text: 'All yarns must have a name.',
                variant: 'flat',
            });
            return false;
        }
        return true;
    };

    const compose = async () => {
        console.log('Fabrics to compose:', fabrics.value);

        // Only validate fabrics array, not the current form
        if (!(await validateFabrics(false))) {
            return;
        }
        errorMessage.value = '';

        // Create a deep copy of fabrics to ensure reactivity
        previewFabricsForm.value = fabrics.value.map((yarn) => ({
            name: yarn.name,
            numberOfStrings: yarn.numberOfStrings,
            colors: yarn.colors.map((c) => ({ color: c.color, percentage: c.percentage })),
            twist: yarn.twist,
            chaos: yarn.chaos,
        }));

        // Toggle to force re-render
        fabricsCompose.value = false;
        await nextTick();
        fabricsCompose.value = true;
        possibleToSave.value = true;

        console.log('Preview fabrics form:', previewFabricsForm.value);
        console.log('Fabrics compose:', fabricsCompose.value);

        showAlert({
            color: 'success',
            text: 'Composite fabric created successfully!',
            variant: 'flat',
        });
    };

    const fetchThreads = async () => {
        isLoadingSave.value = true;
        showLoader();
        try {
            const query = {};
            const response = await getThreads(query);
            threads.value = (response.data as any).data;
        } catch (error) {
            console.error('Error fetching threads:', error);
            errorMessage.value = 'Could not load threads. Please try again.';
            showAlert({
                color: 'error',
                text: 'Could not load threads. Please try again.',
                variant: 'flat',
            });
        } finally {
            isLoadingSave.value = false;
            hideLoader();
        }
    };

    const handleSaveClick = async () => {
        errorMessage.value = '';
        if (!possibleToSave.value) {
            errorMessage.value = 'Please apply changes before saving.';
            showAlert({
                color: 'error',
                text: 'Please apply changes before saving.',
                variant: 'flat',
            });
            return;
        }
        if (type.value === 'compose') {
            if (!composeFabricName.value) {
                errorMessage.value = 'Please provide a Composition Name.';
                showAlert({
                    color: 'error',
                    text: 'Please provide a Composition Name.',
                    variant: 'flat',
                });
                return;
            }
            if (previewFabricsForm.value.length === 0) {
                errorMessage.value = 'Please add yarns and click "Apply Changes" before saving.';
                showAlert({
                    color: 'error',
                    text: 'Please add yarns and click "Apply Changes" before saving.',
                    variant: 'flat',
                });
                return;
            }
        }
        if (threads.value.length === 0) {
            await fetchThreads();
        }
        if (threads.value.length > 0) {
            showThreadModal.value = true;
        } else {
            errorMessage.value = 'No threads available. Please create a thread first.';
            showAlert({
                color: 'error',
                text: 'No threads available. Please create a thread first.',
                variant: 'flat',
            });
        }
    };

    const confirmThreadSelection = () => {
        if (!selectedThread.value) {
            errorMessage.value = 'Please select a thread.';
            showAlert({
                color: 'error',
                text: 'Please select a thread.',
                variant: 'flat',
            });
            return;
        }
        showThreadModal.value = false;
        executeSave(selectedThread.value);
        selectedThread.value = null;
    };

    const executeSave = async (threadId: string | null) => {
        errorMessage.value = '';
        if (type.value === 'single') {
            if (!threadId) {
                errorMessage.value = 'A thread ID is required to save a single yarn.';
                showAlert({
                    color: 'error',
                    text: 'A thread ID is required to save a single yarn.',
                    variant: 'flat',
                });
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

                const colorPromises = formToSave.colors.map((cor) => {
                    return createColor({
                        code: cor.color,
                        percentage: cor.percentage,
                        string: stringId,
                    });
                });
                await Promise.all(colorPromises);

                const yarnData = {
                    name: formToSave.name,
                    twist: formToSave.twist,
                    chaos: formToSave.chaos,
                    strings: [stringId],
                };
                const yarnResponse = await createYarn({ ...yarnData });
                const yarnId = yarnResponse.data.data.id;

                const spoolData = {
                    name: `${formToSave.name} Spool`,
                    yarn: yarnId,
                    thread: threadId,
                };
                await createSpool({ ...spoolData });

                showAlert({
                    color: 'success',
                    text: 'Yarn saved successfully!',
                    variant: 'flat',
                });
                close();
            } catch (error: any) {
                console.error('Error saving yarn:', error);
                errorMessage.value = error.response?.data?.message || error.message || 'An error occurred while saving. Please try again.';
                showAlert({
                    color: 'error',
                    text: error.response?.data?.message || error.message || 'An error occurred while saving. Please try again.',
                    variant: 'flat',
                });
            } finally {
                isLoadingSave.value = false;
                hideLoader();
            }
        } else {
            isLoadingSave.value = true;
            showLoader();
            try {
                const yarnsToCreate = previewFabricsForm.value;
                const createdYarnIds: string[] = [];

                for (const yarnForm of yarnsToCreate) {
                    const stringResponse = await createString({
                        number: yarnForm.numberOfStrings,
                    });
                    const stringId = stringResponse.data.data.id;

                    const colorPromises = yarnForm.colors.map((cor) =>
                        createColor({
                            code: cor.color,
                            percentage: cor.percentage,
                            string: stringId,
                        }),
                    );
                    await Promise.all(colorPromises);

                    const yarnResponse = await createYarn({
                        name: yarnForm.name,
                        twist: yarnForm.twist,
                        chaos: yarnForm.chaos,
                        strings: [stringId],
                    });
                    const yarnId = yarnResponse.data.data.id;

                    await createSpool({
                        name: `${yarnForm.name} Spool`,
                        yarn: yarnId,
                        thread: threadId,
                    });

                    createdYarnIds.push(yarnId);
                }

                const composeFabricData = {
                    name: composeFabricName.value,
                    twist: composeFabricTwist.value,
                    yarns: createdYarnIds,
                };
                await createComposeFabric({ ...composeFabricData });

                showAlert({
                    color: 'success',
                    text: 'Compose Fabric saved successfully!',
                    variant: 'flat',
                });
                close();
            } catch (error: any) {
                console.error('Error saving compose fabric:', error);
                errorMessage.value = error.response?.data?.message || error.message || 'An error occurred while saving the compose fabric.';
                showAlert({
                    color: 'error',
                    text: error.response?.data?.message || error.message || 'An error occurred while saving the compose fabric.',
                    variant: 'flat',
                });
            } finally {
                isLoadingSave.value = false;
                hideLoader();
            }
        }
    };

    const localShowForm = ref<boolean>(props.showForm);

    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                if (props.type === 'single') {
                    form.value = {
                        name: newData.name || '',
                        numberOfStrings: newData.numberOfStrings || 0,
                        colors: newData.colors
                            ? newData.colors.map((c: any) => ({
                                  color: c.color,
                                  percentage: c.percentage,
                              }))
                            : [],
                        twist: newData.twist || 0,
                        chaos: newData.chaos || 0,
                    };
                } else if (props.type === 'compose') {
                    fabrics.value = newData.yarns
                        ? newData.yarns.map((yarn: any) => ({
                              name: yarn.name || '',
                              numberOfStrings: yarn.numberOfStrings || 0,
                              colors: yarn.colors
                                  ? yarn.colors.map((c: any) => ({
                                        color: c.color,
                                        percentage: c.percentage,
                                    }))
                                  : [],
                              twist: yarn.twist || 0,
                              chaos: yarn.chaos || 0,
                          }))
                        : [];
                }
            }
        },
        { immediate: true },
    );

    watch(
        () => props.showForm,
        (newShowFrom) => {
            localShowForm.value = newShowFrom;
        },
    );

    watch(type, (newType) => {
        // Reset form state when switching types
        form.value = {
            name: '',
            numberOfStrings: 100,
            colors: [],
            twist: 0,
            chaos: 0,
        };
        newPercentage.value = 100;
        newColor.value = '#FFFFFF';
        showNewYarn.value = false;
        possibleToSave.value = false;
        fabricsCompose.value = false;
        fabrics.value = [];
        composeFabricName.value = '';
        composeFabricTwist.value = 0;
        errorMessage.value = '';
    });

    const close = () => {
        emit('update:showForm', false);
    };
</script>
