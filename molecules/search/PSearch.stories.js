import {
    toRefs, reactive, ref, computed,
} from '@vue/composition-api';
import { action } from '@storybook/addon-actions';
import { getKnobProps } from '@sb/storybook-util';
import {
    text, number, select, object, boolean,
} from '@storybook/addon-knobs/vue';
import PSearch from './PSearch.vue';
import { searchProps } from './PSearch.toolset';

export default {
    title: 'molecules/search-new',
    component: PSearch,
    parameters: {
        info: {
            summary: '',
            components: { PSearch },
        },
        knobs: { escapeHTML: false },
    },
};


export const defaultCase = () => ({
    components: { PSearch },
    props: getKnobProps(searchProps, {}, {
        value: true,
    }),
    template: `
    <div class="bg-white py-10" style="width: 80vw;">
        <PSearch v-bind="$props"
                 v-model="value"
                 @input="onInput"
                 @delete="onDelete"
                 @focus="onFocus"
                 @blur="onBlur"
                 @search="onSearch"
        ></PSearch>
    </div>`,
    setup(props, context) {
        const state = reactive({
            value: '',
        });

        return {
            ...toRefs(state),
            onInput: action('input'),
            onDelete: action('delete'),
            onFocus: action('focus'),
            onBlur: action('blur'),
            onSearch: action('search'),
        };
    },
});
