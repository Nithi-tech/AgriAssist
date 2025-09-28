import jsPDF from 'jspdf';
import { SettingsBundle } from '../types';

export async function exportFarmReport(bundle: SettingsBundle): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Farm Profile & Settings Report', pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated on: ${timestamp}`, pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Profile Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Profile', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const profileData = [
    ['Name:', bundle.profile.name || 'Not provided'],
    ['Mobile:', bundle.profile.mobileNumber || 'Not provided'],
    ['Village:', bundle.profile.village || 'Not provided'],
    ['District:', bundle.profile.district || 'Not provided'],
    ['State:', bundle.profile.state || 'Not provided'],
    ['Farm Area:', bundle.profile.farmAreaAcres ? `${bundle.profile.farmAreaAcres} acres` : 'Not provided'],
    ['Primary Crop:', bundle.profile.primaryCrop || 'Not provided'],
    ['Soil Type:', bundle.profile.soilType || 'Not provided'],
  ];

  profileData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 8;
  });

  y += 10;

  // App Settings Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('App Settings', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const appData = [
    ['Language:', bundle.app.language.toUpperCase()],
    ['Theme:', bundle.app.theme],
    ['Offline Mode:', bundle.app.offlineMode ? 'Enabled' : 'Disabled'],
    ['Auto-sync Schemes:', bundle.app.autoSyncSchemes ? 'Enabled' : 'Disabled'],
  ];

  appData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 8;
  });

  y += 10;

  // Notifications Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Notification Preferences', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const notificationData = [
    ['Price Alerts:', bundle.notifications.priceAlerts ? 'Enabled' : 'Disabled'],
    ['Weather Warnings:', bundle.notifications.weatherWarnings ? 'Enabled' : 'Disabled'],
    ['Scheme Updates:', bundle.notifications.schemeUpdates ? 'Enabled' : 'Disabled'],
    ['Crop Reminders:', bundle.notifications.cropReminders ? 'Enabled' : 'Disabled'],
    ['Expert Advice:', bundle.notifications.expertAdvice ? 'Enabled' : 'Disabled'],
    ['Channels:', bundle.notifications.channels.join(', ') || 'None'],
    ['Family Contacts:', bundle.notifications.familyContacts.length.toString()],
  ];

  notificationData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 8;
  });

  y += 10;

  // Check if we need a new page
  if (y > doc.internal.pageSize.height - 60) {
    doc.addPage();
    y = margin;
  }

  // Farming Reminders Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Farming Reminders', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // Irrigation
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Irrigation:', margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const irrigationData = [
    ['  Enabled:', bundle.reminders.irrigation.enabled ? 'Yes' : 'No'],
    ['  Frequency:', bundle.reminders.irrigation.frequencyDays ? `${bundle.reminders.irrigation.frequencyDays} days` : 'Not set'],
    ['  Best Time:', bundle.reminders.irrigation.bestTimeOfDay || 'Not set'],
  ];

  irrigationData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 6;
  });

  y += 5;

  // Fertilizer
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fertilizer:', margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const fertilizerData = [
    ['  Enabled:', bundle.reminders.fertilizer.enabled ? 'Yes' : 'No'],
    ['  Next Date:', bundle.reminders.fertilizer.nextDate ? new Date(bundle.reminders.fertilizer.nextDate).toLocaleDateString() : 'Not set'],
  ];

  fertilizerData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 6;
  });

  y += 5;

  // Pesticide
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pesticide:', margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const pesticideData = [
    ['  Enabled:', bundle.reminders.pesticide.enabled ? 'Yes' : 'No'],
    ['  Next Date:', bundle.reminders.pesticide.nextDate ? new Date(bundle.reminders.pesticide.nextDate).toLocaleDateString() : 'Not set'],
  ];

  pesticideData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 6;
  });

  y += 10;

  // Privacy Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Privacy Settings', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const privacyData = [
    ['Share Production Data:', bundle.privacy.shareProductionData ? 'Yes' : 'No'],
    ['Allow Expert Contact:', bundle.privacy.expertContact ? 'Yes' : 'No'],
  ];

  privacyData.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, margin + 60, y);
    y += 8;
  });

  // Footer
  y = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated by AgriAssist Settings', pageWidth / 2, y, { align: 'center' });

  // Save the PDF
  doc.save('Farm_Report.pdf');
}
