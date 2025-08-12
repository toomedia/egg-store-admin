"use client"
import { 
  Settings,
  User,
  Lock,
  Bell,
  Database,
  Palette,
  
} from 'lucide-react';
import React, { useState } from 'react';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('account');
  
  const settingsSections = [
    {
      id: 'account',
      title: 'Account',
      icon: <User size={16} />,
      description: 'Manage your profile information'
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock size={16} />,
      description: 'Password and authentication'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={16} />,
      description: 'Email and alert preferences'
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      icon: <Database size={16} />,
      description: 'Data export and privacy controls'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette size={16} />,
      description: 'Theme and display options'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Horizontal Navigation Tabs with Gold Color */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="text-[#e6d281] mr-2" size={20} />
              <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
            </div>
           
        
          </div>
          
          <nav className="flex space-x-8 overflow-x-auto py-2 hide-scrollbar">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`whitespace-nowrap flex items-center px-1 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'border-[#e6d281] text-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`mr-2 ${
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

      {/* Main Content Area with Gold Accents */}
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Content Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-3 text-[#e6d281]">
                  {settingsSections.find(s => s.id === activeSection)?.icon}
                </span>
                {settingsSections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-[#e6d281] hover:bg-[#d4c274] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e6d281]/50">
              Save Changes
            </button>
          </div>
          
          {/* Content Sections */}
          <div className="px-6 py-5 divide-y divide-gray-200">
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div className="pb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="example@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <div className="mt-1 flex items-center">
                        <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </span>
                        <button
                          type="button"
                          className="ml-5 bg-white py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e6d281]/50"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Contact Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea 
                        rows={3} 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="xyz, City, Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="pb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e6d281] focus:ring-[#e6d281]/50 sm:text-sm" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS Authentication</p>
                      <p className="text-sm text-gray-500">Use your phone to receive authentication codes</p>
                    </div>
                    <button
                      type="button"
                      className="ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-[#e6d281]"
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
              <div className="space-y-6">
                <div className="pb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="comments"
                          name="comments"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="comments" className="font-medium text-gray-700">
                          New messages
                        </label>
                        <p className="text-gray-500">Get notified when you receive new messages</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="candidates"
                          name="candidates"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="candidates" className="font-medium text-gray-700">
                          System updates
                        </label>
                        <p className="text-gray-500">Get notified about important system updates</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="offers"
                          name="offers"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#e6d281] focus:ring-[#e6d281]/50"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="offers" className="font-medium text-gray-700">
                          Promotional offers
                        </label>
                        <p className="text-gray-500">Get notified about special offers</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable push notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications on your device</p>
                      </div>
                      <button
                        type="button"
                        className="ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-gray-200"
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
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-6">
                <div className="pb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Data Export</h3>
                  <div className="rounded-md bg-gray-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Database className="h-5 w-5 text-[#e6d281]" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">Export your data</h3>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>
                            You can request an export of all your personal data stored in our systems. This may take up to 30 days to process.
                          </p>
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-transparent bg-[#e6d281]/20 px-3 py-2 text-sm font-medium leading-4 text-gray-700 hover:bg-[#e6d281]/30 focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2"
                          >
                            Request Data Export
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Public Profile</p>
                        <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                      </div>
                      <button
                        type="button"
                        className="ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-gray-200"
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Data Sharing</p>
                        <p className="text-sm text-gray-500">Allow us to share anonymized usage data</p>
                      </div>
                      <button
                        type="button"
                        className="ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:ring-offset-2 bg-[#e6d281]"
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
              <div className="space-y-6">
                <div className="pb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Theme Preferences</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" defaultChecked />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-1 peer-checked:ring-[#e6d281]">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Light</p>
                            <p className="text-xs text-gray-500">Default light theme</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-300 bg-gray-100"></div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-800 p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-1 peer-checked:ring-[#e6d281]">
                          <div>
                            <p className="text-sm font-medium text-white">Dark</p>
                            <p className="text-xs text-gray-300">Dark mode theme</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-600 bg-gray-700"></div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="relative block cursor-pointer">
                        <input type="radio" name="theme" className="peer sr-only" />
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-[#f3f4f6] p-4 hover:border-gray-300 peer-checked:border-[#e6d281] peer-checked:ring-1 peer-checked:ring-[#e6d281]">
                          <div>
                            <p className="text-sm font-medium text-gray-900">System</p>
                            <p className="text-xs text-gray-500">Follow system preference</p>
                          </div>
                          <div className="ml-3 h-4 w-4 rounded-full border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-800"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Accent Color</h3>
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
                          className="h-10 w-full rounded-lg border border-gray-200 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-[#e6d281]" 
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