import { faker } from '@faker-js/faker';
import { range } from 'lodash';

import type { SelectDropdownMenuItem } from '@/inputs/dropdown/select-dropdown/type';

const getMenuItem = (word?: string): SelectDropdownMenuItem => {
    let label = faker.random.word();
    if (word) {
        label = label.slice(0, label.length / 2) + word + label.slice(label.length / 2);
    }
    return {
        name: faker.datatype.uuid(),
        label,
        type: 'item',
        // disabled: faker.datatype.boolean(),
    };
};

export const getSelectDropdownMenu = (min = 10, max = 30, word?: string): SelectDropdownMenuItem[] => range(faker.datatype.number({ min, max })).map(() => getMenuItem(word));
export const getSelectDropdownMenuWithMultiTypes = (): SelectDropdownMenuItem[] => range(30).map((i) => {
    const result = getMenuItem();

    if ([0, 10, 20].includes(i)) {
        result.type = 'header';
    } else if ([1, 11, 21].includes(i)) {
        result.type = 'divider';
    }

    return result;
});

