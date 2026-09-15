import mongoose from 'mongoose';
import PERMISSIONS from '../constants/permissions';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            streetAddress: {
                type: String,
                trim: true,
                lowercase: true,
                default: ""
            },
            city: {
                type: String,
                trim: true,
                lowercase: true,
                default: ""
            },
            state: {
                type: String,
                trim: true,
                lowercase: true,
                default: ""
            },
            country: {
                type: String,
                trim: true,
                lowercase: true,
                default: ""
            },
            postalCode: {
                type: String,
                trim: true,
                default: ""
            }
        },
        uid: {                                         //represent phone number or unique id of admin in encrypted format
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {                                //user password
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['USER', 'ADMIN', 'STAFF', 'SUPPORT', 'DELIVERY_AGENT'],
            default: 'USER',
            uppercase: true,
        },
        permissions: {
            type: [string],
            enum: PERMISSIONS,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

export default User;