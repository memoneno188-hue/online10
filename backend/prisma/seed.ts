import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: hashedPassword,
            isAdmin: true,
            isActive: true,
        },
    });

    console.log('✅ Admin user created:', admin.username);

    // Create default settings
    await prisma.companySetting.upsert({
        where: { id: 'single_row' },
        update: {},
        create: { id: 'single_row' },
    });

    await prisma.appSetting.upsert({
        where: { id: 'single_row' },
        update: {},
        create: { id: 'single_row' },
    });

    await prisma.printSetting.upsert({
        where: { id: 'single_row' },
        update: {},
        create: { id: 'single_row' },
    });

    await prisma.treasury.upsert({
        where: { id: 'single_row' },
        update: {},
        create: { id: 'single_row' },
    });

    console.log('✅ Default settings created');

    // Create some expense categories
    const categories = [
        'رواتب',
        'إيجار',
        'كهرباء وماء',
        'صيانة',
        'مصاريف إدارية',
        'مصاريف أخرى',
    ];

    for (const name of categories) {
        await prisma.expenseCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    console.log('✅ Expense categories created');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
