const { mongoose } = require("../config/database");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },

  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["Admin", "Manager", "Technician"],
    default: "Technician"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);