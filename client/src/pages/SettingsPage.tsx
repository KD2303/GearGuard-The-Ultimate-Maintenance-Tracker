import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Mail, Smartphone, ShieldCheck, Webhook, Trash2, Play, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import axios from 'axios';

const SettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState({
    inApp: true,
    email: false,
    push: false,
    sound: true,
    dnd: false
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preferences updated!', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', provider: 'Slack', events: ['urgent_request', 'health_critical'] });

  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        const res = await axios.get('/api/v1/webhooks', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setWebhooks(res.data.data);
      } catch (err) {
        console.error("Failed to load webhooks", err);
      }
    };
    fetchWebhooks();
  }, []);

  const handleAddWebhook = async () => {
    if (!newWebhook.url) return toast.error("URL is required");
    try {
      const res = await axios.post('/api/v1/webhooks', newWebhook, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWebhooks([res.data.data, ...webhooks]);
      setNewWebhook({ ...newWebhook, url: '' });
      toast.success("Webhook added!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await axios.delete(`/api/v1/webhooks/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWebhooks(webhooks.filter(w => w._id !== id));
      toast.success("Webhook deleted");
    } catch (err) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTestWebhook = async (webhook: any) => {
    try {
      await axios.post('/api/v1/webhooks/test', { url: webhook.url, provider: webhook.provider }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Test payload sent!");
    } catch (err) {
      toast.error("Failed to send test payload");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account preferences and notification settings.</p>
      </div>

      <div className="space-y-6">
        {/* Notifications Section */}
        <section className="glass rounded-3xl 
          border border-gray-200 dark:border-gray-700 
          bg-white/40 dark:bg-gray-800/60 
          p-6 lg:p-8 shadow-xl backdrop-blur-xl transition-colors">
          <div className="flex items-center space-x-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
            <Bell className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Alert Preferences</h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 space-y-6">
            {/* In-App Notifications */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-2xl">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">In-App Alerts</p>
                  <p className="text-xs  dark:text-gray-400">Show real-time toast notifications and bell badges.</p>
                </div>
              </div>
              <button 
                onClick={() => togglePreference('inApp')}
                className={clsx(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  preferences.inApp ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-600"
                )}
              >
                <span className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-800 transition-colors shadow ring-0 transition duration-200 ease-in-out",
                  preferences.inApp ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-2xl">
                  {preferences.sound ? <Volume2 className="h-5 w-5 text-purple-600" /> : <VolumeX className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Sound Effects</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Play a subtle sound when a new notification arrives.</p>
                </div>
              </div>
              <button 
                onClick={() => togglePreference('sound')}
                className={clsx(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  preferences.sound ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-600"
                )}
              >
                <span className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-800 transition-colors shadow ring-0 transition duration-200 ease-in-out",
                  preferences.sound ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center space-x-4 opacity-60">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-2xl">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Email Digest (Coming Soon)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive a daily summary of equipment status changes.</p>
                </div>
              </div>
              <div className="h-6 w-11 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white
                hover:bg-gray-200 dark:hover:bg-gray-600 cursor-not-allowed"></div>
            </div>

            {/* Mobile Push */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center space-x-4 opacity-60">
                <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-2xl">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Mobile Push (Coming Soon)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Get alerts directly on your smartphone.</p>
                </div>
              </div>
              <div className="h-6 w-11 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white
                hover:bg-gray-200 dark:hover:bg-gray-600 cursor-not-allowed"></div>
            </div>
          </div>
        </section>

        {/* Account Security (Placeholder) */}
        <section className="glass rounded-3xl border border-white/50 bg-white/40 dark:bg-gray-800/60 p-6 lg:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Security</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your account security and password settings.</p>
          <button className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
            Change Password
          </button>
        </section>

        {/* Webhook Integrations Section */}
        <section className="glass rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-800/60 p-6 lg:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <Webhook className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Webhook Integrations</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Automatically send alerts to third-party services like Slack or Discord.</p>
          
          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <select 
              value={newWebhook.provider}
              onChange={(e) => setNewWebhook({...newWebhook, provider: e.target.value})}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            >
              <option value="Slack">Slack</option>
              <option value="Discord">Discord</option>
              <option value="Teams">Teams</option>
            </select>
            <input 
              type="text" 
              value={newWebhook.url}
              onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
              placeholder="https://hooks.slack.com/services/..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
            <button 
              onClick={handleAddWebhook}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No webhooks configured yet.</p>
            )}
            {webhooks.map((wh) => (
              <div key={wh._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/60 dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center space-x-2">
                    <span className={clsx(
                      "px-2 py-1 text-xs font-bold rounded-full",
                      wh.provider === 'Slack' ? "bg-red-100 text-red-700" :
                      wh.provider === 'Discord' ? "bg-indigo-100 text-indigo-700" :
                      "bg-blue-100 text-blue-700"
                    )}>{wh.provider}</span>
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate max-w-[200px] sm:max-w-xs">{wh.url}</span>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    {wh.events.map((ev: string) => (
                      <span key={ev} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {ev.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleTestWebhook(wh)} className="p-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors" title="Test Webhook">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteWebhook(wh._id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Delete Webhook">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
