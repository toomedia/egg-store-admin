"use client"
import { 
  Settings,
  User,
  Lock,
  Bell,
  Database,
  Palette,
  Save,
  Camera
} from 'lucide-react';
import React, { useState } from 'react';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('account');
  
  const settingsSections = [
    {
      id: 'account',
      title: 'Account',
      icon: <User size={18} />,
      description: 'Manage your profile information'
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock size={18} />,
      description: 'Password and authentication'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={18} />,
      description: 'Email and alert preferences'
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      icon: <Database size={18} />,
      description: 'Data export and privacy controls'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette size={18} />,
      description: 'Theme and display options'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Page Title */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="text-[#e6d281] mr-3" size={24} />
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8 overflow-x-auto py-4 hide-scrollbar">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`whitespace-nowrap flex items-center px-1 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeSection === section.id
                    ? 'border-[#e6d281] text-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`mr-2 transition-colors duration-200 ${
                  activeSection === section.id ? 'text-[#e6d281]' : 'text-gray-500'
                }`}>
                  {section.icon}
                </span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Content Header */}
          <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-3 text-[#e6d281]">
                  {settingsSections.find(s => s.id === activeSection)?.icon}
                </span>
                {settingsSections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <button className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-gray-900 bg-[#e6d281] hover:bg-[#d4c070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e6d281]/50 transition-colors duration-200">
              <Save className="mr-2" size={16} />
              Save Changes
            </button>
          </div>
          
          {/* Content Sections */}
          <div className="px-8 py-8">
            {activeSection === 'account' && (
              <div className="space-y-8">
                {/* Profile Information Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <User className="mr-2 text-[#e6d281]" size={18} />
                    Profile Information
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                        placeholder="example@gmail.com"
                        defaultValue="example@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                          <button className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#e6d281] rounded-full flex items-center justify-center hover:bg-[#d4c070] transition-colors duration-200">
                            <Camera className="h-3 w-3 text-gray-800" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e6d281]/50 transition-colors duration-200"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <User className="mr-2 text-[#e6d281]" size={18} />
                    Contact Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                        placeholder="+1 (555) 123-4567"
                        defaultValue="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea 
                        rows={3} 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm resize-none" 
                        placeholder="xyz, City, Country"
                        defaultValue="xyz, City, Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Lock className="mr-2 text-[#e6d281]" size={18} />
                    Change Password
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input 
                        type="password" 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password" 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 focus:outline-none transition-colors duration-200 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Lock className="mr-2 text-[#e6d281]" size={18} />
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS Authentication</p>
                      <p className="text-sm text-gray-600 mt-1">Use your phone to receive authentication codes</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-[#e6d281]"
                      role="switch"
                      aria-checked="true"
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Bell className="mr-2 text-[#e6d281]" size={18} />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex h-5 items-center">
                        <input
                          id="comments"
                          name="comments"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="comments" className="text-sm font-medium text-gray-900">
                          New messages
                        </label>
                        <p className="text-sm text-gray-600 mt-1">Get notified when you receive new messages</p>
                      </div>
                    </div>
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex h-5 items-center">
                        <input
                          id="candidates"
                          name="candidates"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="candidates" className="text-sm font-medium text-gray-900">
                          System updates
                        </label>
                        <p className="text-sm text-gray-600 mt-1">Get notified about important system updates</p>
                      </div>
                    </div>
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex h-5 items-center">
                        <input
                          id="offers"
                          name="offers"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="offers" className="text-sm font-medium text-gray-900">
                          Promotional offers
                        </label>
                        <p className="text-sm text-gray-600 mt-1">Get notified about special offers</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Bell className="mr-2 text-[#e6d281]" size={18} />
                    Push Notifications
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable push notifications</p>
                      <p className="text-sm text-gray-600 mt-1">Receive notifications on your device</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-gray-200"
                      role="switch"
                      aria-checked="false"
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Database className="mr-2 text-[#e6d281]" size={18} />
                    Data Export
                  </h3>
                  <div className="rounded-lg bg-gray-50 p-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Database className="h-6 w-6 text-[#e6d281]" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Export your data</h3>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            You can request an export of all your personal data stored in our systems. This may take up to 30 days to process.
                          </p>
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-lg border border-transparent bg-[#e6d281]/20 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#e6d281]/30 focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 transition-colors duration-200"
                          >
                            Request Data Export
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Database className="mr-2 text-[#e6d281]" size={18} />
                    Privacy Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Public Profile</p>
                        <p className="text-sm text-gray-600 mt-1">Make your profile visible to other users</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-gray-200"
                        role="switch"
                        aria-checked="false"
                      >
                        <span className="sr-only">Use setting</span>
                        <span
                          aria-hidden="true"
                          className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Data Sharing</p>
                        <p className="text-sm text-gray-600 mt-1">Allow us to share anonymized usage data</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-[#e6d281]"
                        role="switch"
                        aria-checked="true"
                      >
                        <span className="sr-only">Use setting</span>
                        <span
                          aria-hidden="true"
                          className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Palette className="mr-2 text-[#e6d281]" size={18} />
                    Theme Preferences
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" defaultChecked />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-2 peer-checked:ring-[#e6d281]/20 transition-all duration-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Light</p>
                            <p className="text-xs text-gray-600 mt-1">Default light theme</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-300 bg-gray-100"></div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-800 p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-2 peer-checked:ring-[#e6d281]/20 transition-all duration-200">
                          <div>
                            <p className="text-sm font-medium text-white">Dark</p>
                            <p className="text-xs text-gray-300 mt-1">Dark mode theme</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-600 bg-gray-700"></div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-[#f3f4f6] p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-2 peer-checked:ring-[#e6d281]/20 transition-all duration-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">System</p>
                            <p className="text-xs text-gray-600 mt-1">Follow system preference</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-800"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <Palette className="mr-2 text-[#e6d281]" size={18} />
                    Accent Color
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {['#e6d281', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                      <label key={color} className="relative block cursor-pointer">
                        <input 
                          type="radio" 
                          name="accent-color" 
                          className="peer sr-only" 
                          defaultChecked={color === '#e6d281'}
                        />
                        <div 
                          className="h-12 w-full rounded-lg border-2 border-gray-200 peer-checked:border-[#e6d281] peer-checked:ring-2 peer-checked:ring-[#e6d281]/20 transition-all duration-200" 
                          style={{ backgroundColor: color }}
                        >
                          <span className="sr-only">{color}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;