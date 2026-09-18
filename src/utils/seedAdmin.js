import { generateHash } from './bcrypt.utils.js';
import { env } from '../configs/env.js';
import User from '../models/user.model.js';

export const seedAdminUser = async() =>{
    try{
        const existingAdmin = await User.findOne({uid: env.adminPhone, role: 'admin' });
        if(existingAdmin){
            return;
        }
        //create admin user if not exists
        await User.create({
            name: env.adminName,
            uid: env.adminPhone,
            email: env.adminEmail,
            password: await generateHash(env.adminPassword),
            role: 'ADMIN'
        })
        console.log('Admin user seeded successfully.');
    }catch(error){
        console.error('Error seeding admin user:', error.message);
    }
}