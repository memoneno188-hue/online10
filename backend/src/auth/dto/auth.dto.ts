import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin' })
    @IsString({ message: 'اسم المستخدم مطلوب' })
    @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
    username: string;

    @ApiProperty({ example: 'admin123' })
    @IsString({ message: 'كلمة المرور مطلوبة' })
    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
