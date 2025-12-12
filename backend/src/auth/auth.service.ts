import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new UnauthorizedException('بيانات تسجيل الدخول غير صحيحة');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('هذا الحساب غير نشط');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('بيانات تسجيل الدخول غير صحيحة');
        }

        // Generate tokens
        const payload = { sub: user.id, username: user.username, isAdmin: user.isAdmin };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin,
            },
        };
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            // Generate new access token
            const newPayload = {
                sub: payload.sub,
                username: payload.username,
                isAdmin: payload.isAdmin,
            };
            const accessToken = this.jwtService.sign(newPayload);

            return { accessToken };
        } catch (error) {
            throw new UnauthorizedException('رمز التحديث غير صالح');
        }
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                isAdmin: true,
                isActive: true,
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        return user;
    }
}
