// backend/models/Chat.js
import { Schema, model } from 'mongoose';

const chatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only 2 participants
chatSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    next(new Error('Chat must have exactly 2 participants'));
  }
  next();
});

// Create compound index for efficient queries
chatSchema.index({ participants: 1 });

export default model('Chat', chatSchema);
