import mongoose, { Schema } from "mongoose";
const GigSchema = new Schema({
    student: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    title: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 120 
    },
    description: { 
        type: String, 
        required: true, 
        maxlength: 2000 
    },
    category: { 
        type: String, 
        required: true, 
        trim: true, 
        index: true 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    deliveryDays: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    skills: [{ 
        type: String, 
        trim: true 
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    },
}, { timestamps: true });

GigSchema.index({ 
    title: "text",
    description: "text", 
    category: "text", 
    skills: "text" 
});

export const Gig = mongoose.model("Gig", GigSchema);
