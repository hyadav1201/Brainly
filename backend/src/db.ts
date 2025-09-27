import mongoose, { model, Schema } from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log("Connected to MongoDB");
        
        // Try to drop the problematic email index if it exists
        try {
            if (mongoose.connection.db) {
                await mongoose.connection.db.collection('users').dropIndex('email_1');
                console.log("Dropped old email index");
            }
        } catch (indexError) {
            // Index might not exist, which is fine
            console.log("Email index not found or already dropped");
        }
    } catch (e) {
        console.error("Failed to connect to MongoDB:", e);
    }
}

connectToDatabase();

const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: String
})

export const UserModel = model("User", UserSchema);

const ContentSchema = new Schema({
    title: String,
    content: String,
    link: String,
    tags: [String],
    type: String,
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
})

const LinkSchema = new Schema({
    hash: String,
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
})

export const LinkModel = model("Links", LinkSchema);
export const ContentModel = model("Content", ContentSchema);