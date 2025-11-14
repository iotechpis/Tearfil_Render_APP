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
            <label class="tw-block tw-mb-2 tw-font-semibold" for="material-name">Import a Yarn</label>
            <v-select outlined flat label="Yarn" placeholder="Import a Yarn"></v-select>
        </div>

        <div class="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-4">

        </div>

    </div>

</template>

<script lang="ts" setup>
interface Props {
    showForm: boolean;
}


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