const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const TeamMemberSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String },
  avatar: { type: String },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  isActive: { type: Boolean, default: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'MaintenanceTeam' }
}, { timestamps: true });

TeamMemberSchema.virtual('team', {
  ref: 'MaintenanceTeam',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

TeamMemberSchema.set('toObject', { virtuals: true });
TeamMemberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
