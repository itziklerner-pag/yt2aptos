# AptosFS Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using AptosFS.

## Table of Contents

- [Connection Issues](#connection-issues)
- [File Upload Problems](#file-upload-problems)
- [File Download Problems](#file-download-problems)
- [Performance Issues](#performance-issues)
- [Account and Authentication](#account-and-authentication)
- [Blockchain Integration](#blockchain-integration)
- [Sharing and Collaboration](#sharing-and-collaboration)
- [Mobile Access](#mobile-access)
- [Common Error Messages](#common-error-messages)
- [Getting Additional Help](#getting-additional-help)

## Connection Issues

### Application Won't Load

**Symptoms:** Blank screen, loading spinner that never completes, or error message about connection failure.

**Solutions:**
1. Check your internet connection by visiting another website
2. Clear your browser cache and cookies
3. Try using a different web browser
4. Check if there's a service outage on [AptosFS Status Page](https://status.aptosfs.com)
5. Disable browser extensions, especially ad blockers or privacy tools

### Frequent Disconnections

**Symptoms:** You're repeatedly disconnected while using AptosFS.

**Solutions:**
1. Check for a stable internet connection
2. Try a wired connection instead of Wi-Fi if possible
3. Close other applications that may be using bandwidth
4. Clear browser cache and temporary files
5. Check for browser updates

### Sync Issues

**Symptoms:** Changes made on one device aren't appearing on another device.

**Solutions:**
1. Click the "Sync Now" button in the account menu
2. Verify both devices have an active internet connection
3. Check that you're signed in with the same account on both devices
4. Wait a few minutes as sync may have a delay
5. Restart the application on both devices

## File Upload Problems

### Failed Uploads

**Symptoms:** Upload progress stops, or you receive error messages during upload.

**Solutions:**
1. Check your internet connection stability
2. For large files (>1GB), try using the desktop app instead of the web interface
3. Break large uploads into smaller files
4. Check if you have sufficient storage quota remaining
5. Try uploading to a different folder
6. Try a different browser or clear browser cache

### Upload Appears Stuck

**Symptoms:** Upload progress bar stops moving but doesn't show an error.

**Solutions:**
1. For large files, wait a bit longer as processing may take time
2. Try refreshing the page (you may need to restart the upload)
3. Check your browser's developer console for error messages
4. Try uploading the file in smaller chunks
5. Check if your antivirus software is blocking the upload

### File Size Limit Exceeded

**Symptoms:** Error message about file size limits.

**Solutions:**
1. Check your account plan's file size limits
2. Consider upgrading your account for higher limits
3. Compress the file before uploading
4. Split large files into smaller parts
5. Use the chunked upload feature in the desktop app

## File Download Problems

### Downloads Fail to Start

**Symptoms:** Nothing happens when you click download, or download fails immediately.

**Solutions:**
1. Check browser download settings
2. Ensure you have sufficient disk space
3. Verify that you haven't blocked downloads in your browser
4. Try using the "Save As" option by right-clicking
5. Check if your browser needs to be updated

### Incomplete or Corrupted Downloads

**Symptoms:** Downloaded file is incomplete or won't open properly.

**Solutions:**
1. Delete the partial download and try again
2. Use the "Download as ZIP" option for folders
3. Try downloading with a different browser
4. Check if the original file is intact by previewing it first
5. Use the desktop app which has better resume capabilities

### Can't Find Downloaded Files

**Symptoms:** Download completes but you can't find the file.

**Solutions:**
1. Check your browser's default download location
2. Look in your Downloads folder
3. Check if your browser shows a download bar at the bottom
4. Search your computer for the filename
5. Check if your security software quarantined the file

## Performance Issues

### Slow Navigation

**Symptoms:** Interface feels sluggish, takes a long time to open folders.

**Solutions:**
1. Close unused browser tabs and applications
2. Clear browser cache and temporary files
3. Disable browser extensions you don't need
4. Try using the "List View" instead of "Grid View" for folders with many files
5. Check your computer's resource usage (CPU, memory)

### Search Takes Too Long

**Symptoms:** Searching for files takes an excessive amount of time.

**Solutions:**
1. Use more specific search terms
2. Limit your search to specific folders rather than all files
3. Use file type filters to narrow results
4. Try using the desktop app for faster searching
5. If searching by content, use filename search instead which is faster

### Slow File Previews

**Symptoms:** Previewing files takes a long time or fails.

**Solutions:**
1. Check your internet connection speed
2. Try smaller files first
3. Disable high-resolution previews in settings
4. Use the desktop app for more efficient previews
5. Download the file to view it locally instead

## Account and Authentication

### Can't Log In

**Symptoms:** Login fails despite using correct credentials.

**Solutions:**
1. Check if Caps Lock is enabled
2. Reset your password using the "Forgot Password" link
3. Clear browser cookies and cache
4. Try logging in with a different browser
5. Check if you're using the correct email address
6. Contact support if your account might be locked

### Wallet Connection Issues

**Symptoms:** Unable to connect your crypto wallet to AptosFS.

**Solutions:**
1. Ensure your wallet extension is installed and updated
2. Unlock your wallet before attempting to connect
3. Check if you're using a supported wallet (Petra, Martian, Pontem, etc.)
4. Try connecting in a private/incognito window
5. Check that your wallet is connected to the correct Aptos network
6. Verify your wallet has the necessary permissions enabled

### Two-Factor Authentication Problems

**Symptoms:** Not receiving 2FA codes or unable to use 2FA.

**Solutions:**
1. Check if your authentication app time is synchronized
2. Verify your phone has an internet connection for SMS/email codes
3. Check if your phone number or email is correct in account settings
4. Use backup codes if you've saved them previously
5. Contact support with identity verification to regain access

## Blockchain Integration

### Transaction Failures

**Symptoms:** Blockchain verification or registration fails.

**Solutions:**
1. Check your wallet has sufficient APT for gas fees
2. Verify you're connected to the correct Aptos network
3. Try again later as the blockchain may be congested
4. Check the transaction status on an Aptos explorer
5. Ensure your wallet is properly connected and authenticated

### Missing Blockchain Verification

**Symptoms:** File shows as unverified despite blockchain registration.

**Solutions:**
1. Wait for blockchain confirmation (may take a few minutes)
2. Click "Refresh Verification Status" on the file
3. Check blockchain explorer for transaction confirmation
4. Try re-registering the file
5. Verify you're using the same wallet that registered the file

### Smart Contract Interaction Failures

**Symptoms:** Unable to interact with AptosFS smart contracts.

**Solutions:**
1. Ensure your wallet has the correct permissions
2. Check for blockchain network congestion
3. Verify contract addresses in advanced settings
4. Update to the latest version of your wallet
5. Check if the smart contract has been upgraded recently

## Sharing and Collaboration

### Shared Link Not Working

**Symptoms:** Recipients get errors when using shared links.

**Solutions:**
1. Verify the share hasn't expired
2. Check if you've set a password and provided it to the recipient
3. Ensure the recipient has the necessary permissions
4. Create a new share link
5. Check if the file or folder still exists and hasn't been moved

### Collaboration Conflicts

**Symptoms:** Changes from multiple users cause conflicts.

**Solutions:**
1. Implement a check-out system where only one person edits at a time
2. Communicate with collaborators about who is editing what
3. Use version history to restore previous versions if needed
4. Consider using file locking for sensitive documents
5. Set clear permissions (view vs. edit) for collaborators

### Notifications Not Received

**Symptoms:** You or collaborators aren't receiving share notifications.

**Solutions:**
1. Check spam/junk email folders
2. Verify email addresses are correct
3. Check notification settings in your account
4. Add notification@aptosfs.com to your contacts
5. Try resending the invitation

## Mobile Access

### Mobile App Not Installing

**Symptoms:** Unable to install or update the AptosFS mobile app.

**Solutions:**
1. Check if your device meets the minimum requirements
2. Ensure you have sufficient storage space
3. Update your device's operating system
4. Clear app store cache
5. Restart your device and try again

### Mobile App Crashes

**Symptoms:** App closes unexpectedly or freezes.

**Solutions:**
1. Force close the app and restart it
2. Update to the latest version of the app
3. Restart your device
4. Clear the app cache in device settings
5. Reinstall the app

### Mobile View Limitations

**Symptoms:** Certain features not available or working differently on mobile.

**Solutions:**
1. Check if the feature is supported on mobile
2. Try using the "Request Desktop Site" option in your mobile browser
3. Consider using the mobile app instead of the browser version
4. Some administrative features may require desktop access
5. Update to the latest app version for new features

## Common Error Messages

### "Insufficient Storage Space"

**Cause:** Your account has reached its storage limit.

**Solutions:**
1. Delete unnecessary files or move them to local storage
2. Empty the trash
3. Upgrade your storage plan
4. Compress large files before uploading
5. Archive older files to free up space

### "File Format Not Supported"

**Cause:** The system doesn't recognize or support the file type.

**Solutions:**
1. Convert the file to a supported format
2. Check file extension is correct for the file type
3. Try uploading a different file to isolate the issue
4. Use the "Upload as Binary" option for unusual file types
5. Check if the file is corrupted by opening it locally first

### "Permission Denied"

**Cause:** You don't have the necessary permissions for the action.

**Solutions:**
1. Request access from the file owner
2. Check if your share link has expired
3. Verify you're logged in with the correct account
4. Check if the file owner has restricted certain operations
5. Contact the administrator if you should have access

### "Network Error"

**Cause:** Connection issues between your device and AptosFS.

**Solutions:**
1. Check your internet connection
2. Try again later as it might be a temporary issue
3. Switch to a more stable network
4. Try accessing from a different device
5. Clear browser cache and cookies

### "Blockchain Verification Failed"

**Cause:** Issues with the blockchain transaction or verification.

**Solutions:**
1. Check wallet connection and permissions
2. Ensure sufficient APT for transaction fees
3. Try again later when network congestion decreases
4. Verify file hasn't been modified since registration
5. Check transaction status on Aptos explorer

## Getting Additional Help

If you're still experiencing issues after trying the solutions in this guide:

1. **Check Documentation:** Visit the [AptosFS Knowledge Base](https://help.aptosfs.com) for detailed articles

2. **Community Forums:** Ask questions and search for similar issues on the [AptosFS Community Forum](https://community.aptosfs.com)

3. **Live Chat Support:** Click the "Help" icon in the bottom-right corner of the AptosFS interface for live chat support during business hours

4. **Email Support:** Contact our support team at support@aptosfs.com with:
   - A detailed description of the issue
   - Screenshots of any error messages
   - Steps to reproduce the problem
   - Your account information (email address)
   - Device and browser information

5. **Video Tutorials:** Check our [YouTube channel](https://youtube.com/aptosfs) for visual guides to common tasks

6. **Developer Support:** For API and integration issues, visit our [Developer Portal](https://developers.aptosfs.com)