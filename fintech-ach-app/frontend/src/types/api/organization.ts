export interface Organization {
    id: string;
    name: string;
    description: string;
    status: OrganizationStatus;
    created_at: string;
    updated_at: string | null;
}

export enum OrganizationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    SUSPENDED = 'SUSPENDED'
}

export interface CreateOrganizationDto {
    name: string;
    description: string;
}

export interface UpdateOrganizationDto {
    name?: string;
    description?: string;
    status?: OrganizationStatus;
} 