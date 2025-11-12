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
            <div class="tw-w-1/3 tw-bg-primary-100 tw-p-4 tw-rounded-lg tw-overflow-y-auto">
                <v-form class="tw-flex tw-flex-col tw-gap-2">
                    <h2>{{ type == 'single' ? 'Single Yarn' : 'Compose Yarns' }}</h2>
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

interface Props {
    showForm: boolean;
    type?: 'single' | 'compose';
}

const props = defineProps<Props>();
const emit = defineEmits(['update:showForm']);

const showNewYarn = ref<boolean>(false);

interface Cor {
    color: string;
    percentage: number;
}

interface YarnFormData {
    name: string;
    numberOfStrings: number;
    colors: Cor[]; 
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
    validateForm();
    showNewYarn.value = true;
    previewForm.value = { ...form.value };
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
    validateFabrics();
    showNewYarn.value = false;
    fabricsCompose.value = true;
    previewFabricsForm.value = [...fabrics.value];
}

const localShowForm = ref<boolean>(props.showForm);

watch(() => props.showForm, (newShowFrom) => {
    localShowForm.value = newShowFrom;
});

const close = () => {
    emit('update:showForm', false);
};

</script>