<script setup lang="ts">
import { computed, reactive } from 'vue';

import { PHeading, PTab } from '@spaceone/design-system';


import { store } from '@/store';

import UserAPIKeyTable from '@/services/my-page/my-account/user-api-key/modules/APIKeyTable.vue';
import GRPCEndpointsTab from '@/services/my-page/my-account/user-api-key/modules/GRPCEndpointsTab.vue';
import RestEndpointsTab from '@/services/my-page/my-account/user-api-key/modules/RestEndpointsTab.vue';


const state = reactive({
    tabs: [{
        name: 'rest',
        label: 'REST',
    }, {
        name: 'gRPC',
        label: 'gRPC',
    }],
    activeTab: 'rest',
    userId: computed(() => store.state.user.userId),
});

</script>

<template>
    <section class="api-key-wrapper">
        <p-heading :title="$t('IDENTITY.USER.MAIN.API_KEY')"
                   :title-info="$t('IDENTITY.USER.API_KEY.TITLE_INFO')"
                   class="page-title"
        />
        <user-a-p-i-key-table :user-id="state.userId" />
        <p-tab v-model="state.activeTab"
               :tabs="state.tabs"
        >
            <template #rest>
                <rest-endpoints-tab />
            </template>
            <template #gRPC>
                <g-r-p-c-endpoints-tab />
            </template>
        </p-tab>
    </section>
</template>

<style lang="postcss" scoped>
.page-title {
    align-items: center;
}
</style>
