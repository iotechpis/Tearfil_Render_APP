import { useI18n } from 'vue-i18n';

export default function useRules() {
    const i18n = useI18n();

    const required = (value: any) => {
        if(typeof value === 'number' && Number(value) === 0) {
            return true;
        }
        return !!value || i18n.t('rules.required');
    }

    const email = (value: string) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value) || i18n.t('rules.email');
    };

    const min = (value: string, length: number) => {
        return value?.length >= length || i18n.t('rules.min', [length]);
    };

    const max = (value: string, length: number) => {
        return value?.length <= length || i18n.t('rules.max', [length]);
    };

    const minNumber = (value: number, min: number) => {
        return value >= min || i18n.t('rules.minNumber', [min]);
    };

    const maxNumber = (value: number, max: number) => {
        return value <= max || i18n.t('rules.maxNumber', [max]);
    };

    const betweenNumber = (value: number, min: number, max: number) => {
        return value >= min && value <= max || i18n.t('rules.betweenNumber', [min, max]);
    };

    const between = (value: string, min: number, max: number) => {
        return value?.length >= min && value?.length <= max || i18n.t('rules.between', [min, max]);
    };

    const comparePassword = (value: string, password: string) => {
        return value === password || i18n.t('rules.comparePassword');
    };

    const greaterThan = (value: number, min: number) => {
        return Number(value) > Number(min) || i18n.t('rules.greaterThan', [min]);
    };

    const lessThan = (value: number, max: number) => {
        return Number(value) < Number(max) || i18n.t('rules.lessThan', [max]);
    };

    const greaterThenEqual = (value: number, min: number) => {
        return Number(value) >= Number(min) || i18n.t('rules.greaterThenEqual', [min]);
    };

    const lessThenEqual = (value: number, max: number) => {
        return Number(value) <= Number(max) || i18n.t('rules.lessThenEqual', [max]);
    };

    return {
        required,
        email,
        min,
        max,
        minNumber,
        maxNumber,
        betweenNumber,
        comparePassword,
        greaterThan,
        lessThan,
        greaterThenEqual,
        lessThenEqual,
        between,
    };
}
