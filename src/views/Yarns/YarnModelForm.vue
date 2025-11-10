<template>
    <v-container fluid>
        <div class="tw-flex tw-justify-between tw-items-center">
            <h2 class="tw-text-2xl tw-font-semibold">
                Create New Yarn
            </h2>
            <div class="tw-flex tw-gap-4">
                <v-btn color="primary" size="small" @click="close">
                    Close
                </v-btn>
            </div>
        </div>
        <div class="tw-flex tw-mt-1 tw-gap-4 tw-h-full">
            <div class="tw-w-1/3 tw-bg-primary-100 tw-p-4 tw-rounded-lg">
                <!-- Form Fields for Yarn Model -->
                <v-form class="tw-flex tw-flex-col tw-gap-2">
                    <h2>{{ type=='single' ? 'Single Yarn' : 'Compose Yarns' }}</h2>
                    <v-text-field v-model="form.name" label="Yarn Name" required></v-text-field>
                    <v-text-field v-model="form.numberOfStrings" type="number" label="Number of strings"></v-text-field>
                    <v-color-picker class="tw-w-full" elevation="0" mode="hex" flat
                        v-model="form.color"></v-color-picker>
                    <v-slider v-model="form.twist" :step="1" label="Twist" thumb-label density="compact"
                        hide-details></v-slider>
                    <v-slider v-model="form.chaos" :step="1" label="Chaos" thumb-label density="compact"
                        hide-details></v-slider>
                    <div v-if="type=='single'" class="tw-flex tw-justify-end tw-mt-4">
                        <v-btn color="primary" size="small" @click="applyChanges">
                            Apply Changes
                        </v-btn>
                    </div>
                    <div v-if="type=='compose'" class="tw-flex tw-justify-end tw-mt-4 tw-gap-2" >
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
                <!-- 3D Yarn Model Preview Component -->
                <CreateYarn :form="previewForm" />
            </div>

            <div class="tw-w-2/3" v-if="fabricsCompose">
                <!-- 3D Yarn Model Preview Component for Fabrics Composition -->
                 <div class="tw-flex tw-gap-1">
                    <div v-for="(yarn, index) in previewFabricsForm" :key="index" class="">
                        {{ yarn.name }} {{ index < previewFabricsForm.length -1 ? ',' : '' }}
                    </div>
                 </div>                
                 <CompositeYarn :fabrics="previewFabricsForm" />
            </div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import CreateYarn from './CreateYarn.vue';
import CompositeYarn from './CompositeYarn.vue';

interface Props {
    showForm: boolean;
    type?: 'single' | 'compose';
}

const props = defineProps<Props>();
const emit = defineEmits(['update:showForm']);

const showNewYarn = ref<boolean>(false);

interface YarnFormData {
    name: string;
    numberOfStrings: number;
    color: string;
    twist: number;
    chaos: number;
}

const form = ref<YarnFormData>({
    name: '',
    numberOfStrings: 0,
    color: '',
    twist: 0,
    chaos: 0,
})

const previewForm = ref<YarnFormData>({
    ...form.value
});

const applyChanges = () => {
    showNewYarn.value = true;
    previewForm.value = { ...form.value };
};

const type = ref<string>(props.type || 'single');


const fabricsCompose = ref<boolean>(false);

const fabrics = ref<YarnFormData[]>([]);

const addYarnToFabrics = () => {
    fabrics.value.push({ ...form.value });
    // Reset form after adding
    form.value = {
        name: '',
        numberOfStrings: 0,
        color: '',
        twist: 0,
        chaos: 0,
    };
    showNewYarn.value = false;
};

const previewFabricsForm = ref<YarnFormData[]>({
    ...fabrics.value
});

const compose = () => {
    showNewYarn.value = false;
    fabricsCompose.value = true;
    previewFabricsForm.value = [ ...fabrics.value ];
}

const localShowForm = ref<boolean>(props.showForm);

watch(() => props.showForm, (newShowFrom) => {
    localShowForm.value = newShowFrom;
});

const close = () => {
    emit('update:showForm', false);
};


</script>