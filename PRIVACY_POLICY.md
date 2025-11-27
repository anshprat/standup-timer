# Privacy Policy for Standup Timer

**Last Updated:** December 2024

## Overview

Standup Timer is a Chrome extension that displays an embedded timer for team standup meetings with participant rotation. This privacy policy explains our data practices and commitment to user privacy.

## Data Collection and Usage

**We do not collect, store on external servers, or transmit any user data to third parties.**

This extension:
- Does NOT collect any personal information
- Does NOT track user behavior or browsing history
- Does NOT transmit any data to external servers
- Does NOT use analytics or telemetry services
- Does NOT communicate with any third-party services
- Does NOT use cookies

### Local Data Storage

The extension stores the following settings locally in your browser using Chrome's sync storage:
- **Participants list**: Names of meeting participants (entered by you)
- **Total time**: Total meeting time in minutes (configured by you)
- **Timer mode**: Your preference for countdown or count up mode
- **Host URL**: The website domain where you want the timer to appear
- **Show timer preference**: Whether the timer should be visible on the page
- **Timer visibility state**: Whether the timer is currently hidden or visible

All of this data is stored locally in your browser and synchronized across your Chrome browsers (if you have Chrome sync enabled). This data is never transmitted to external servers or shared with third parties.

## Permissions

The extension requests the following permissions:

### storage
This permission allows the extension to save your timer settings (participants, time preferences, etc.) locally in your browser. The extension uses Chrome's sync storage, which means your settings are synchronized across your Chrome browsers if you have Chrome sync enabled. No data is transmitted to external servers.

### activeTab
This permission allows the extension to access the currently active tab only when you interact with the extension (clicking the extension icon). The extension uses this permission solely to:
- Display the timer widget on the current page
- Inject the timer UI into the page

### host_permissions (<all_urls>)
This permission allows the extension to run on any website. The extension uses this permission to:
- Display the timer widget on web pages where you choose to use it
- Only activates on pages matching your configured host URL setting

The extension only injects the timer UI into pages. It does not read, collect, or transmit any content from the pages you visit.

## What the Extension Does

The extension performs only the following operations:
1. Stores your timer settings locally in your browser
2. Displays a timer widget on web pages matching your configured host URL
3. Tracks time locally for standup meeting participants
4. Provides a summary report of time usage for participants

All operations occur locally in your browser. No data leaves your device except for Chrome's built-in sync functionality (if enabled), which synchronizes your settings across your own Chrome browsers.

## Third-Party Services

This extension does not integrate with, communicate with, or share data with any third-party services.

## Data Security

All data is stored locally in your browser using Chrome's secure storage APIs. Since the extension does not transmit any data to external servers, there are no data security concerns related to external data storage or transmission.

If you have Chrome sync enabled, your settings are synchronized across your Chrome browsers using Google's secure sync service, which is subject to Google's privacy policy.

## Children's Privacy

This extension does not knowingly collect information from children under 13 years of age. Since no data is collected from any users beyond local settings storage, children's privacy is fully protected.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after such changes constitutes acceptance of the updated privacy policy.

## Contact Information

If you have any questions or concerns about this privacy policy, please open an issue on our GitHub repository:
https://github.com/anshprat/standup-timer

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable privacy regulations

## Your Rights

You have full control over your data:
- **Access**: All your data is stored locally in Chrome's sync storage. You can view it by checking Chrome's extension storage or by opening the extension's popup.
- **Modify**: You can modify or delete your settings at any time through the extension's popup interface.
- **Delete**: You can remove all extension data by uninstalling the extension, which will delete all locally stored settings.

## Summary

In simple terms: This extension stores your timer settings (participant names, time preferences, etc.) locally in your browser. It displays a timer widget on web pages where you choose to use it. It does not collect, transmit, or share any information with external servers or third parties. Your privacy is completely protected, and all data remains on your device.

