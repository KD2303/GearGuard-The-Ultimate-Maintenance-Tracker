const { mongoose } = require("../config/database");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: {
      values: ["Admin", "Manager", "Technician"],
      message: "Role must be one of: Admin, Manager, Technician",
    },
    default: "Technician",
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    select: false,
  },

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);