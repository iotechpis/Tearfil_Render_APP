<template>
    <div class="tw-flex tw-items-center tw-justify-between">
        <div class="tw-text-2xl tw-font-semibold">
            Create a New Favric/Material
        </div>
        <div class="tw-flex tw-gap-4">
            <v-btn color="primary" size="small" @click="close">
                Close
            </v-btn>
        </div>
    </div>
    <div class="tw-mt-4 tw-w-96 tw-h-96 tw-border tw-border-gray-300 ">
        <DeterministicMaterialViewer :fabrics="myFabrics" :percentages="myPercentages" :palette="myPalette" />
    </div>

</template>

<script lang="ts" setup>
import DeterministicMaterialViewer from './DeterministicMaterialViewer.vue';

interface Props {
    showForm: boolean;
}

const myFabrics = ref([
    { name: 'Feixe 1', numberOfStrings: 50, color: '#FF0000', twist: 2, chaos: 0.2 },
    { name: 'Feixe 2', numberOfStrings: 50, color: '#0000FF', twist: 2, chaos: 0.2 }
]);

// Dados para a textura determinística
const myPercentages = ref([30, 40, 30]);
const myPalette = ref([
    [1.0, 0.0, 0.0], // Vermelho
    [0.0, 0.0, 1.0], // Azul
    [0.0, 1.0, 0.0]  // Verde
]);

const props = defineProps<Props>();
const emit = defineEmits(['update:showForm']);

const localShowForm = ref<boolean>(props.showForm);

watch(() => props.showForm, (newShowFrom) => {
    localShowForm.value = newShowFrom;
});

const close = () => {
    emit('update:showForm', false);
};
</script>