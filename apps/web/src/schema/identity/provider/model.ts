import type { Tags, TimeStamp } from '@/schema/_common/model';

export interface ProviderModel {
    provider: string;
    name: string;
    alias: string;
    color: string;
    icon: string;
    order: number;
    options: Record<string, any>;
    tags: Tags;
    is_managed: boolean;
    created_at: TimeStamp;
    updated_at: TimeStamp;
}
