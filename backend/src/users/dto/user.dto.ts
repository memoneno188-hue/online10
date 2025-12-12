import { IsString, IsBoolean, IsOptional, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    username: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    permissions?: PermissionDto[];
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class ChangePasswordDto {
    @IsOptional()
    @IsString()
    currentPassword?: string; // Required for own password

    @IsString()
    @MinLength(8)
    newPassword: string;

    @IsString()
    confirmPassword: string;
}

export class PermissionDto {
    @IsString()
    screen: string;

    @IsBoolean()
    canView: boolean;

    @IsBoolean()
    canCreate: boolean;

    @IsBoolean()
    canEdit: boolean;

    @IsBoolean()
    canDelete: boolean;
}

export class UpdatePermissionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    permissions: PermissionDto[];
}
