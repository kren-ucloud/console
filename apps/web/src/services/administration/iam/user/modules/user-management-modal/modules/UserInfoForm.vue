<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { TranslateResult } from 'vue-i18n';

import {
    PFieldGroup, PTextInput, PButton, PSelectDropdown,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/types/inputs/context-menu/type';
import { debounce } from 'lodash';


import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { store } from '@/store';
import { i18n } from '@/translations';

import type { UserReferenceMap } from '@/store/modules/reference/user/type';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import type {
    Validation,
} from '@/services/administration/iam/user/lib/user-form-validations';
import {
    checkDuplicateID,
    checkEmailFormat, checkEmptyValue,
    checkOauth,
    checkRequiredField,
} from '@/services/administration/iam/user/lib/user-form-validations';
import type { User } from '@/services/administration/iam/user/type';
import { useUserPageStore } from '@/services/administration/store/user-page-store';
import type { ExternalMenuType } from '@/services/administration/type';

interface Props {
    activeTab?: string;
    item?: User;
    isUserIdValid?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
    activeTab: '',
    item: undefined,
    isUserIdValid: undefined,
});

const userPageStore = useUserPageStore();
const userPageState = userPageStore.$state;

const emit = defineEmits<{(e: 'change-input', formState): void,
    (e: 'update:is-user-id-valid', isUserIdValid: boolean): void,
}>();

const state = reactive({
    loading: false,
    searchText: '',
    selectedItems: [] as MenuItem[],
    externalItems: [] as MenuItem[],
    supportFind: computed(() => !!store.state.domain.authOptions?.support_find),
    users: computed<UserReferenceMap>(() => store.getters['reference/userItems']),
});
const formState = reactive({
    userId: '',
    name: '',
});
const validationState = reactive({
    proxyIsUserIdValid: useProxyValue('isUserIdValid', props, emit),
    userIdInvalidText: '' as TranslateResult,
    userIdValidText: '' as TranslateResult,
});

/* Components */
const setExternalMenuItems = (users) => {
    const _externalItems: ExternalMenuType[] = [];
    users.forEach((user) => {
        const singleItem = {
            name: user.userId,
            label: user.name ? `${user.userId} (${user.name})` : user.userId,
            disabled: false,
        };
        if (state.users[user.userId]) {
            singleItem.label = `(${i18n.t('IDENTITY.USER.FORM.ALREADY_EXISTS')}) ${singleItem.label}`;
            singleItem.disabled = true;
        }
        _externalItems.push(singleItem);
    });
    state.externalItems = _externalItems;
};
const handleDeleteSelectedExternalUser = () => {
    formState.userId = '';
    formState.name = '';
    validationState.proxyIsUserIdValid = undefined;
    validationState.userIdInvalidText = '';
};
const handleSelectExternalUser = async (userItem) => {
    await getExternalUser(userItem.name);
    await handleClickCheckId();
};
const handleChangeName = () => {
    emit('change-input', { ...formState, name: formState.name });
};
const handleChangeUserId = () => {
    if (validationState.proxyIsUserIdValid) {
        validationState.proxyIsUserIdValid = undefined;
        validationState.userIdInvalidText = '';
    }
};
const setForm = () => {
    formState.userId = props.item.user_id;
    formState.name = props.item.name || '';
};

/* API */
const listExternalUser = debounce(async () => {
    try {
        state.loading = true;
        const { results } = await SpaceConnector.client.identity.user.find({
            search: {
                keyword: state.searchText,
            },
        });
        await setExternalMenuItems(results);
    } catch (e) {
        ErrorHandler.handleError(e);
        state.externalItems = [];
    } finally {
        state.loading = false;
    }
}, 300);
const getExternalUser = async (userId: string) => {
    try {
        const { results, total_count } = await SpaceConnector.client.identity.user.find({
            search: {
                userId,
            },
        });
        if (total_count > 0) {
            const selectedExternalUser = results[0];
            formState.userId = selectedExternalUser.userId;

            if (state.users[userId]) {
                formState.name = '';
            } else {
                formState.name = selectedExternalUser.name;
            }
        }
    } catch (e) {
        ErrorHandler.handleError(e);
        formState.userId = userId;
        formState.name = '';
    }
};

const executeSpecificIDValidation = async () => {
    let res: Validation = { isValid: true, invalidText: '' };
    if (props.activeTab === 'local') res = checkEmailFormat(formState.userId);
    else if (props.activeTab === 'external') res = await checkOauth(formState.userId);
    return res;
};
const handleClickCheckId = async () => {
    const validation: Validation[] = await Promise.all([
        checkRequiredField(formState.userId),
        checkDuplicateID(formState.userId),
        checkEmptyValue(formState.userId),
        executeSpecificIDValidation()]);
    const invalidObj = validation.find((item) => item.invalidText.length > 0);
    if (!invalidObj) {
        validationState.proxyIsUserIdValid = true;
        validationState.userIdValidText = i18n.t('IDENTITY.USER.FORM.NAME_VALID');
        emit('change-input', { ...formState, userId: formState.userId });
    } else {
        validationState.proxyIsUserIdValid = invalidObj.isValid;
        validationState.userIdInvalidText = invalidObj.invalidText;
    }
};

/* Init */
(async () => {
    if (userPageState.visibleUpdateModal) {
        await setForm();
    }
})();

watch(() => props.activeTab, (after) => {
    if (after) {
        state.selectedItems = [];
        if (userPageState.visibleCreateModal) {
            formState.userId = '';
            formState.name = '';
            validationState.proxyIsUserIdValid = undefined;
            emit('change-input', { ...formState });
        }
    }
}, { immediate: true });
watch(() => state.searchText, (searchText) => {
    if (!searchText.trim().length) {
        state.externalItems = [];
    } else {
        listExternalUser();
    }
});
</script>

<template>
    <div class="user-info-form-wrapper">
        <p-field-group :label="$t('IDENTITY.USER.FORM.USER_ID')"
                       :required="true"
                       :invalid="validationState.proxyIsUserIdValid === false"
                       :invalid-text="validationState.userIdInvalidText"
                       :valid="validationState.proxyIsUserIdValid"
                       :valid-text="validationState.userIdValidText"
        >
            <template v-if="props.activeTab === 'external'
                          && state.supportFind
                          && state.externalItems.length > 100"
                      #help
            >
                <div class="external-items-help-text">
                    <span>{{ $t('IDENTITY.USER.FORM.TOO_MANY_RESULTS') }}</span>
                </div>
            </template>
            <template #default="{invalid}">
                <div v-if="props.activeTab === 'external' && state.supportFind">
                    <p-select-dropdown
                        class="external-select-dropdown"
                        :search-text.sync="state.searchText"
                        :class="{invalid}"
                        show-select-marker
                        :menu="state.externalItems"
                        :selected.sync="state.selectedItems"
                        :loading="state.loading"
                        disable-handler
                        use-fixed-menu-style
                        is-filterable
                        show-delete-all-button
                        @select="handleSelectExternalUser"
                        @delete-tag="handleDeleteSelectedExternalUser"
                    />
                </div>
                <div v-else
                     class="id-input-form"
                >
                    <!-- TODO: need to apply placeholder changes based on the distinction between open source and SaaS. -->
                    <p-text-input v-model="formState.userId"
                                  v-focus
                                  placeholder="user@spaceone.io"
                                  :invalid="invalid"
                                  :valid="validationState.proxyIsUserIdValid"
                                  :disabled="userPageState.visibleUpdateModal"
                                  @update:value="handleChangeUserId"
                    />
                    <p-button v-if="!userPageState.visibleUpdateModal"
                              style-type="secondary"
                              class="user-id-check-button"
                              @click="handleClickCheckId"
                    >
                        {{ $t('IDENTITY.USER.FORM.CHECK_USER_ID') }}
                    </p-button>
                </div>
            </template>
        </p-field-group>
        <p-field-group :label="$t('IDENTITY.USER.FORM.NAME')"
                       class="input-form"
        >
            <p-text-input v-model="formState.name"
                          class="text-input"
                          @update:value="handleChangeName"
            />
        </p-field-group>
    </div>
</template>

<style lang="postcss" scoped>
.user-info-form-wrapper {
    @apply flex flex-col bg-white rounded-lg;
    padding: 0.75rem;
    gap: 1rem;
    .external-items-help-text {
        @apply text-gray-400;
        font-size: 0.75rem;
        line-height: 1.3;
        padding: 0.25rem 0;
    }
    .external-select-dropdown {
        &.invalid {
            .p-search {
                @apply border-alert;
            }
        }
    }
    .id-input-form {
        @apply flex;
        gap: 0.5rem;
    }
    .p-field-group {
        margin-bottom: 0;

        /* custom design-system component - p-text-input */
        :deep(.p-text-input) {
            width: 100%;
        }
    }
}
</style>
