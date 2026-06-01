const mongoose = require('mongoose');
const Notification = require('./server/models/Notification');
const User = require('./server/models/user');
const MaintenanceRequest = require('./server/models/MaintenanceRequest');

async function check() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:40416/', { useNewUrlParser: true, useUnifiedTopology: true });
    const users = await User.find();
    console.log("Users:", users.map(u => ({ id: u._id, email: u.email })));
    
    const reqs = await MaintenanceRequest.find().sort({ createdAt: -1 }).limit(1);
    console.log("Last Request createdById:", reqs[0]?.createdById);

    const notifs = await Notification.find();
    console.log("Notifications:");
    notifs.forEach(n => console.log({ id: n._id, userId: n.userId, title: n.title }));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
