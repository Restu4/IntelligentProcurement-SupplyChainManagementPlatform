"use client";

import { useState } from "react";
import { Settings, User, Bell, Shield, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileFields = { fullName: string; email: string; role: string };
type NotificationFields = { emailNotifications: boolean; pushNotifications: boolean; weeklyDigest: boolean };
type SecurityFields = { twoFactorAuth: boolean; sessionTimeout: string; apiAccess: string };

export default function SettingsPage() {
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState(false);

  const [profile, setProfile] = useState<ProfileFields>({ fullName: "Restu", email: "restu@smartprocure.co.id", role: "Procurement Manager" });
  const [profileDraft, setProfileDraft] = useState<ProfileFields>(profile);

  const [notifications, setNotifications] = useState<NotificationFields>({ emailNotifications: true, pushNotifications: true, weeklyDigest: false });
  const [notifSaved, setNotifSaved] = useState(false);

  const [security, setSecurity] = useState<SecurityFields>({ twoFactorAuth: false, sessionTimeout: "30 minutes", apiAccess: "Active" });
  const [securityDraft, setSecurityDraft] = useState<SecurityFields>(security);

  const toggleNotification = (key: keyof NotificationFields) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your account and platform preferences</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Profile */}
        <div className="widget-card">
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">Profile</h3>
              <p className="text-xs md:text-sm text-gray-500">Manage your account information</p>
            </div>
            {!editingProfile && (
              <button onClick={() => { setProfileDraft(profile); setEditingProfile(true); }} className="text-xs text-accent-500 hover:text-accent-600 font-medium shrink-0">Edit</button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</span>
              {editingProfile ? (
                <input type="text" value={profileDraft.fullName} onChange={(e) => setProfileDraft({ ...profileDraft, fullName: e.target.value })} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-primary-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 w-full sm:w-auto" />
              ) : <span className="text-sm text-gray-500">{profile.fullName}</span>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
              {editingProfile ? (
                <input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-primary-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 w-full sm:w-auto" />
              ) : <span className="text-sm text-gray-500">{profile.email}</span>}
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
              <span className="text-sm text-gray-500">{profile.role}</span>
            </div>
          </div>
          {editingProfile && (
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button onClick={() => { setProfileDraft(profile); setEditingProfile(false); }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={() => { setProfile(profileDraft); setEditingProfile(false); }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="widget-card">
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">Notifications</h3>
              <p className="text-xs md:text-sm text-gray-500">Configure your notification preferences</p>
            </div>
            <span className={cn("text-xs font-medium transition-opacity duration-300 shrink-0", notifSaved ? "opacity-100 text-green-500" : "opacity-0")}>Saved!</span>
          </div>
          <div className="space-y-3">
            {([["emailNotifications", "Email Notifications", "Receive procurement alerts via email"], ["pushNotifications", "Push Notifications", "Get real-time browser notifications"], ["weeklyDigest", "Weekly Digest", "Weekly summary of procurement activities"]] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button onClick={() => toggleNotification(key)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0", notifications[key] ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")}>
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm", notifications[key] ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="widget-card">
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">Security</h3>
              <p className="text-xs md:text-sm text-gray-500">Manage security settings</p>
            </div>
            {!editingSecurity && (
              <button onClick={() => { setSecurityDraft(security); setEditingSecurity(true); }} className="text-xs text-accent-500 hover:text-accent-600 font-medium shrink-0">Edit</button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-Factor Auth</span>
              {editingSecurity ? (
                <button onClick={() => setSecurityDraft({ ...securityDraft, twoFactorAuth: !securityDraft.twoFactorAuth })} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0", securityDraft.twoFactorAuth ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")}>
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm", securityDraft.twoFactorAuth ? "translate-x-6" : "translate-x-1")} />
                </button>
              ) : <span className={cn("text-sm font-medium", security.twoFactorAuth ? "text-green-500" : "text-gray-500")}>{security.twoFactorAuth ? "Enabled" : "Disabled"}</span>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout</span>
              {editingSecurity ? (
                <select value={securityDraft.sessionTimeout} onChange={(e) => setSecurityDraft({ ...securityDraft, sessionTimeout: e.target.value })} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-primary-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 w-full sm:w-auto">
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                  <option value="4 hours">4 hours</option>
                </select>
              ) : <span className="text-sm text-gray-500">{security.sessionTimeout}</span>}
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Access</span>
              <span className="text-sm text-gray-500">{security.apiAccess}</span>
            </div>
          </div>
          {editingSecurity && (
            <div className="flex items-center gap-3 mt-4 justify-end">
              <button onClick={() => { setSecurityDraft(security); setEditingSecurity(false); }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={() => { setSecurity(securityDraft); setEditingSecurity(false); }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
