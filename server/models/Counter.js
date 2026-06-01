const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', CounterSchema);
