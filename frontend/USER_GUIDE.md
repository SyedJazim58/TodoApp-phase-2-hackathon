# Todo App - User Guide

**Version**: 1.0.0
**Last Updated**: 2026-02-09
**Feature**: 003-frontend-fullstack-integration
**Task**: T075

Welcome to the Todo App! This guide will help you get started with managing your tasks efficiently.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating an Account](#creating-an-account)
3. [Logging In](#logging-in)
4. [Managing Tasks](#managing-tasks)
   - [Creating a Task](#creating-a-task)
   - [Viewing Tasks](#viewing-tasks)
   - [Editing a Task](#editing-a-task)
   - [Completing a Task](#completing-a-task)
   - [Deleting a Task](#deleting-a-task)
5. [Session Management](#session-management)
6. [Troubleshooting](#troubleshooting)
7. [Privacy & Security](#privacy--security)
8. [FAQ](#faq)

---

## Getting Started

The Todo App is a secure, multi-user task management application that helps you organize your work. Each user has their own private task list that only they can access.

### Key Features

- **Secure Authentication**: JWT-based authentication keeps your data safe
- **Private Task Lists**: Your tasks are only visible to you
- **Real-time Updates**: Changes are instantly reflected across all your devices
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface**: Easy-to-use interface for quick task management

---

## Creating an Account

### Step-by-Step Instructions

1. **Navigate to Signup Page**
   - Visit the application homepage
   - Click the "Sign Up" button in the navigation bar

2. **Fill in Registration Form**
   - **Name**: Enter your full name (minimum 2 characters)
   - **Email**: Enter a valid email address
   - **Password**: Create a secure password (minimum 8 characters)
   - **Confirm Password**: Re-enter your password to confirm

3. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

4. **Submit Registration**
   - Click the "Create Account" button
   - Wait for account creation (usually takes 1-2 seconds)

5. **Automatic Login**
   - After successful registration, you'll be automatically logged in
   - You'll be redirected to your dashboard with an empty task list

### Registration Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email already exists" | Use a different email or try logging in |
| "Password too weak" | Ensure password meets all requirements |
| "Network error" | Check your internet connection and try again |
| Form won't submit | Check that all fields are filled correctly |

---

## Logging In

### Step-by-Step Instructions

1. **Navigate to Login Page**
   - Visit the application homepage
   - Click the "Login" button in the navigation bar

2. **Enter Credentials**
   - **Email**: Enter the email you registered with
   - **Password**: Enter your password

3. **Submit Login**
   - Click the "Sign In" button
   - Wait for authentication (usually takes 1-2 seconds)

4. **Access Dashboard**
   - After successful login, you'll be redirected to your dashboard
   - Your task list will load automatically

### Session Behavior

- **Session Duration**: Your session remains active for 24 hours of activity
- **Multiple Tabs**: You can use the app in multiple browser tabs simultaneously
- **Multiple Devices**: You can log in on multiple devices at the same time
- **Automatic Logout**: You'll be logged out after 24 hours of inactivity

### Login Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Double-check your email and password |
| "Session expired" message | Your previous session timed out - just log in again |
| Can't remember password | Contact support for password reset assistance |
| Network error | Check your internet connection |

---

## Managing Tasks

### Creating a Task

#### From Empty Dashboard

1. Click the "Create Task" button in the center of the empty dashboard

#### From Task List

1. Click the "New Task" button in the top-right corner of the dashboard

#### Fill in Task Details

1. **Title** (Required)
   - Maximum 255 characters
   - Describes what needs to be done
   - Examples: "Buy groceries", "Finish project report"

2. **Description** (Optional)
   - Maximum 10,000 characters
   - Provides additional details or notes
   - Supports multiple lines

3. **Submit**
   - Click "Create Task" button
   - Task appears at the top of your list
   - Success notification confirms creation

#### Task Creation Tips

- Keep titles concise and actionable
- Use descriptions for detailed requirements or notes
- Create tasks as they come to mind - you can always edit later
- Break large tasks into smaller, manageable sub-tasks

---

### Viewing Tasks

#### Dashboard Layout

Your dashboard displays all your tasks in a clean, organized list:

- **Task Checkbox**: Shows completion status
- **Task Title**: Main task description (bold text)
- **Task Description**: Additional details (if provided)
- **Timestamps**: Shows when task was created and last updated
- **Action Buttons**: Edit and Delete icons on the right

#### Task Organization

- **Newest First**: Tasks appear with most recent at the top
- **Completion Status**: Completed tasks show with strikethrough text
- **Empty State**: When you have no tasks, you'll see a helpful "Get started" message

#### Loading Experience

- **Initial Load**: Smooth loading animation while tasks are fetched
- **Background Updates**: Changes appear instantly with optimistic updates

---

### Editing a Task

#### Step-by-Step Instructions

1. **Open Edit Form**
   - Find the task you want to edit
   - Click the "Edit" (pencil) icon on the right side

2. **Modify Task Details**
   - **Title**: Update the task title
   - **Description**: Add, modify, or remove description
   - **Completion Status**: Check/uncheck "Mark as completed" checkbox

3. **Save Changes**
   - Click "Save Changes" button
   - Success notification confirms update
   - Changes appear immediately in the task list

4. **Cancel Editing**
   - Click "Cancel" button to discard changes
   - Click the X in the top-right corner
   - Press Escape key on keyboard

#### Edit Form Features

- **Auto-fill**: Form pre-populates with current task details
- **Character Counter**: Shows remaining characters for title/description
- **Validation**: Real-time validation prevents invalid inputs
- **Keyboard Shortcuts**: Escape key closes form

---

### Completing a Task

#### Quick Toggle Method

1. Click the checkbox next to any task title
2. Task title gets strikethrough styling
3. Task remains in your list for reference
4. Click checkbox again to mark as incomplete

#### Edit Form Method

1. Click the Edit (pencil) icon
2. Check the "Mark as completed" checkbox
3. Click "Save Changes"

#### Completion Behavior

- **Visual Feedback**: Completed tasks show with strikethrough text
- **Instant Update**: Changes appear immediately (optimistic update)
- **Reversible**: Click checkbox again to mark task as incomplete
- **Preserved**: Completed tasks remain in your list until you delete them

---

### Deleting a Task

#### Step-by-Step Instructions

1. **Initiate Delete**
   - Find the task you want to delete
   - Click the "Delete" (trash can) icon on the right side

2. **Confirm Deletion**
   - A confirmation dialog appears
   - Shows task title to confirm you're deleting the right task
   - Warns that action cannot be undone

3. **Complete Deletion**
   - Click "OK" to confirm deletion
   - Click "Cancel" to keep the task
   - Success notification confirms deletion
   - Task is removed from your list immediately

#### Important Notes

- **Permanent Action**: Deletion cannot be undone
- **Confirmation Required**: Always asks for confirmation before deleting
- **Instant Update**: Task disappears immediately upon confirmation

---

## Session Management

### Session Expiry

If your session expires while using the app:

1. **Automatic Detection**: App detects expired session
2. **Session Cleared**: Your session is automatically cleared
3. **Redirect to Login**: You're redirected to the login page
4. **Clear Message**: Explanation that your session expired
5. **Easy Return**: After logging in, you're returned to your dashboard

### Logging Out

#### Manual Logout

1. Click your profile picture or name in the top-right corner
2. Select "Logout" from the menu
3. You'll be redirected to the homepage

#### What Happens on Logout

- Your session is terminated on the server
- Your browser's session data is cleared
- You must log in again to access your tasks
- Your tasks remain safely stored - nothing is deleted

### Multi-Device Usage

- **Same Account, Multiple Devices**: Log in on phone, tablet, and computer
- **Synchronized Data**: Tasks sync automatically across all devices
- **Independent Sessions**: Each device maintains its own session
- **Logout from One**: Logging out on one device doesn't affect others

---

## Troubleshooting

### Common Issues and Solutions

#### "Authentication Failed" or "Invalid Token"

**Cause**: Session expired or configuration mismatch

**Solutions**:
1. Log out and log in again
2. Clear browser cache and cookies
3. Ensure you're using the correct credentials
4. Contact support if issue persists

#### "Network Error" or "Failed to Fetch"

**Cause**: Cannot connect to the server

**Solutions**:
1. Check your internet connection
2. Verify the server is running (if self-hosted)
3. Try refreshing the page
4. Clear browser cache
5. Try a different browser

#### "Access Denied" Message

**Cause**: Attempting to access another user's data (shouldn't happen normally)

**Solutions**:
1. Click "Return to Dashboard"
2. If issue persists, log out and log in again
3. Contact support if you see this repeatedly

#### Tasks Not Loading

**Cause**: API connection issue or session problem

**Solutions**:
1. Refresh the page
2. Check browser console for error messages
3. Log out and log in again
4. Verify internet connection
5. Contact support with error details

#### Form Won't Submit

**Cause**: Validation errors or rapid submission

**Solutions**:
1. Check for red error messages under form fields
2. Ensure all required fields are filled
3. Wait a moment before clicking submit again
4. Check character limits for title/description
5. Try refreshing the page if form is frozen

#### Session Expired During Task Edit

**Cause**: Session expired while editing

**Solutions**:
1. Log in again on the login page
2. Your edit will be preserved and can be retried
3. After login, you may see your previous edit form
4. Complete your edit and save

### Browser Compatibility

The app works best on modern browsers:

- **Google Chrome**: Version 90+ (Recommended)
- **Mozilla Firefox**: Version 88+
- **Safari**: Version 14+
- **Microsoft Edge**: Version 90+

If you experience issues:
1. Update your browser to the latest version
2. Clear browser cache and cookies
3. Disable browser extensions temporarily
4. Try a different browser

### Getting Help

If you continue experiencing issues:

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for red error messages
   - Copy any error messages

2. **Take Screenshots**: Capture the issue for support

3. **Contact Support**: Provide:
   - Description of the problem
   - Steps to reproduce
   - Browser and version
   - Screenshots or error messages
   - Your email address

---

## Privacy & Security

### Data Privacy

- **Your Data is Yours**: Only you can access your tasks
- **User Isolation**: Complete separation between user accounts
- **No Data Sharing**: We never share your data with third parties
- **Encrypted Communication**: All data transmitted over HTTPS in production

### Security Features

- **JWT Authentication**: Industry-standard token-based security
- **Password Hashing**: Passwords are never stored in plain text
- **Session Expiry**: Automatic logout after inactivity
- **HTTPS Required**: Encrypted connections in production
- **Security Headers**: CSP, XSS protection, and more

### Best Practices

1. **Strong Passwords**:
   - Use unique passwords for each account
   - Include uppercase, lowercase, numbers, and symbols
   - Minimum 12 characters recommended
   - Consider using a password manager

2. **Session Security**:
   - Log out when using shared computers
   - Don't save passwords on public computers
   - Use private/incognito mode on shared devices

3. **Account Protection**:
   - Never share your password
   - Watch for phishing attempts
   - Keep your email secure
   - Report suspicious activity immediately

---

## FAQ

### General Questions

**Q: Is the app free to use?**
A: Yes, the Todo App is free to use.

**Q: Do I need to install anything?**
A: No, it's a web application accessible through your browser.

**Q: Can I use it on my phone?**
A: Yes! The app is fully responsive and works on all devices.

**Q: Is my data backed up?**
A: Yes, all data is stored securely in a cloud database with automatic backups.

### Account Questions

**Q: Can I change my email address?**
A: Contact support to change your registered email address.

**Q: How do I reset my password?**
A: Contact support for password reset assistance.

**Q: Can I delete my account?**
A: Yes, contact support to request account deletion.

**Q: Can I have multiple accounts?**
A: Yes, you can create multiple accounts with different email addresses.

### Task Management Questions

**Q: Is there a limit on the number of tasks?**
A: No, you can create unlimited tasks.

**Q: Can I share tasks with other users?**
A: Not in the current version. Task sharing may be added in future updates.

**Q: Can I organize tasks into categories?**
A: Not currently. Categories and tags are planned for future releases.

**Q: Can I set due dates for tasks?**
A: Not in the current version. Due dates are planned for a future update.

**Q: Can I attach files to tasks?**
A: Not currently. File attachments may be added in future versions.

### Technical Questions

**Q: Which browsers are supported?**
A: Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+.

**Q: Does the app work offline?**
A: No, an internet connection is required.

**Q: Where is my data stored?**
A: Data is stored in a secure Neon PostgreSQL database.

**Q: How long are sessions active?**
A: Sessions remain active for 24 hours of activity.

**Q: Can I export my tasks?**
A: Not currently. Export functionality is planned for future releases.

---

## Keyboard Shortcuts

Enhance your productivity with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Escape` | Close modal dialogs (task form, etc.) |
| `Tab` | Navigate between form fields |
| `Enter` | Submit forms (when button is focused) |
| `Space` | Toggle checkboxes (when focused) |

---

## Tips & Best Practices

### Productivity Tips

1. **Daily Review**: Check your task list at the start of each day
2. **Quick Capture**: Add tasks as soon as you think of them
3. **Descriptive Titles**: Use clear, action-oriented task titles
4. **Detailed Descriptions**: Add context in descriptions for complex tasks
5. **Regular Cleanup**: Delete or complete old tasks regularly
6. **Break It Down**: Split large tasks into smaller, manageable pieces

### Task Writing Best Practices

**Good Task Titles**:
- ✅ "Call dentist to schedule appointment"
- ✅ "Review Q4 budget report by Friday"
- ✅ "Buy milk, eggs, and bread"

**Less Effective Task Titles**:
- ❌ "Stuff"
- ❌ "Do things"
- ❌ "Remember"

**Use Descriptions For**:
- Detailed requirements
- Reference links or notes
- Step-by-step instructions
- Context you might forget later

---

## Support & Feedback

### Getting Support

- **Email**: support@todoapp.com (if available)
- **Documentation**: Review this guide and quickstart.md
- **Issues**: Report bugs or issues to your system administrator

### Providing Feedback

We value your feedback! Let us know:
- Features you'd like to see
- Issues you encounter
- Suggestions for improvements
- Overall experience feedback

---

## What's Next?

### Planned Features (Future Releases)

- Due dates and reminders
- Task categories and tags
- Task search and filtering
- Dark mode theme
- Task export/import
- Mobile apps (iOS and Android)
- Collaborative task sharing
- File attachments
- Recurring tasks
- Task priorities

Stay tuned for updates!

---

## Version History

**Version 1.0.0** (2026-02-09)
- Initial release
- User registration and authentication
- Task CRUD operations
- Session management
- Responsive design
- Security features

---

**Thank you for using Todo App!**
We hope this guide helps you stay organized and productive.

For technical documentation, see:
- [Quickstart Guide](./specs/003-frontend-fullstack-integration/quickstart.md)
- [API Documentation](./backend/README.md)
- [Environment Configuration](./.env.example)
