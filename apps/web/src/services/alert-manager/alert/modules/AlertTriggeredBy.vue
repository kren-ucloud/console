<template>
    <span>
        <p-link v-if="link"
                :action-icon="ACTION_ICON.INTERNAL_LINK"
                new-tab
                :to="link"
        >
            {{ label }}
        </p-link>
        <template v-else>
            {{ label }}
        </template>
    </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import {
    computed, reactive, toRefs,
} from 'vue';
import type { Location } from 'vue-router';

import { PLink } from '@spaceone/design-system';
import { ACTION_ICON } from '@spaceone/design-system/src/inputs/link/type';


import { QueryHelper } from '@cloudforet/core-lib/query';

import type { ReferenceItem } from '@/store/modules/reference/type';

import { PROJECT_ROUTE } from '@/services/project/route-config';

export default {
    name: 'AlertTriggeredBy',
    components: {
        PLink,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        projectId: {
            type: String,
            default: '',
        },
        disableLink: {
            type: Boolean,
            default: false,
        },
        webhookReference: {
            type: Object as PropType<ReferenceItem>,
            default: undefined,
        },
        userReference: {
            type: Object as PropType<ReferenceItem>,
            default: undefined,
        },
    },
    setup(props) {
        const queryHelper = new QueryHelper();

        const state = reactive({
            webhookLabel: computed<string|undefined>(() => props.webhookReference?.label),
            userLabel: computed<string|undefined>(() => props.userReference?.label),
            label: computed(() => state.webhookLabel || state.userLabel || props.value),
            link: computed<Location|undefined>(() => {
                if (props.disableLink) return undefined;
                if (props.webhookReference) {
                    return {
                        name: PROJECT_ROUTE.DETAIL.TAB.ALERT.WEBHOOK._NAME,
                        params: {
                            id: props.projectId,
                        },
                        query: {
                            filters: queryHelper.setFilters([{ k: 'webhook_id', v: props.value, o: '=' }]).rawQueryStrings,
                        },
                    };
                } if (state.userReference) {
                    return {
                        name: PROJECT_ROUTE.DETAIL.TAB.MEMBER._NAME,
                        params: {
                            id: props.projectId,
                        },
                        query: {
                            filters: queryHelper.setFilters([{ v: props.value }]).rawQueryStrings,
                        },
                    };
                }
                return undefined;
            }),
        });

        return {
            ...toRefs(state),
            ACTION_ICON,
        };
    },
};
</script>
