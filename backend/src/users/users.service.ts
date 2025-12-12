import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UpdatePermissionsDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async create(createUserDto: CreateUserDto) {
        // Check if username already exists
        const existing = await this.prisma.user.findUnique({
            where: { username: createUserDto.username },
        });

        if (existing) {
            throw new ConflictException('Username already exists');
        }

        // Validate password
        if (createUserDto.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                fullName: createUserDto.fullName,
                passwordHash: hashedPassword,
                isAdmin: createUserDto.isAdmin || false,
                isActive: true,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                isAdmin: true,
                createdAt: true,
            },
        });

        // Create permissions if provided and user is not admin
        if (!user.isAdmin && createUserDto.permissions && createUserDto.permissions.length > 0) {
            await this.prisma.userPermission.createMany({
                data: createUserDto.permissions.map(p => ({
                    userId: user.id,
                    screen: p.screen,
                    canView: p.canView,
                    canCreate: p.canCreate,
                    canEdit: p.canEdit,
                    canDelete: p.canDelete,
                })),
            });
        }

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string) {
        const user = await this.findOne(id);

        // Prevent users from modifying their own admin status
        if (id === currentUserId && updateUserDto.isAdmin !== undefined) {
            throw new ForbiddenException('Cannot modify your own admin status');
        }

        // Check if username is being changed and if it's already taken
        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existing = await this.prisma.user.findUnique({
                where: { username: updateUserDto.username },
            });

            if (existing) {
                throw new ConflictException('Username already exists');
            }
        }

        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
            select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                isAdmin: true,
                updatedAt: true,
            },
        });
    }

    async remove(id: string, currentUserId: string) {
        // Prevent users from deleting themselves
        if (id === currentUserId) {
            throw new ForbiddenException('Cannot delete your own account');
        }

        const user = await this.findOne(id);

        // Check if this is the last admin
        if (user.isAdmin) {
            const adminCount = await this.prisma.user.count({
                where: { isAdmin: true, isActive: true },
            });

            if (adminCount <= 1) {
                throw new ForbiddenException('Cannot delete the last admin user');
            }
        }

        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto, currentUserId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, passwordHash: true, isAdmin: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // If changing own password, verify current password
        if (id === currentUserId && changePasswordDto.currentPassword) {
            const isValid = await bcrypt.compare(
                changePasswordDto.currentPassword,
                user.passwordHash,
            );

            if (!isValid) {
                throw new BadRequestException('Current password is incorrect');
            }
        }

        // Validate new password
        if (changePasswordDto.newPassword.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async getUserPermissions(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Admins have all permissions
        if (user.isAdmin) {
            return { isAdmin: true, permissions: [] };
        }

        const permissions = await this.prisma.userPermission.findMany({
            where: { userId },
            select: {
                screen: true,
                canView: true,
                canCreate: true,
                canEdit: true,
                canDelete: true,
            },
        });

        return { isAdmin: false, permissions };
    }

    async updatePermissions(userId: string, updatePermissionsDto: UpdatePermissionsDto) {
        const user = await this.findOne(userId);

        // Cannot set permissions for admin users
        if (user.isAdmin) {
            throw new BadRequestException('Cannot set permissions for admin users');
        }

        // Delete existing permissions
        await this.prisma.userPermission.deleteMany({
            where: { userId },
        });

        // Create new permissions
        if (updatePermissionsDto.permissions.length > 0) {
            await this.prisma.userPermission.createMany({
                data: updatePermissionsDto.permissions.map(p => ({
                    userId,
                    screen: p.screen,
                    canView: p.canView,
                    canCreate: p.canCreate,
                    canEdit: p.canEdit,
                    canDelete: p.canDelete,
                })),
            });
        }

        return this.getUserPermissions(userId);
    }

    async toggleActive(id: string, isActive: boolean, currentUserId: string) {
        // Prevent users from deactivating themselves
        if (id === currentUserId) {
            throw new ForbiddenException('Cannot deactivate your own account');
        }

        return this.prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                username: true,
                isActive: true,
            },
        });
    }
}
