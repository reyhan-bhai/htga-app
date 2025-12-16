# Password Management & Email System

## Overview
The evaluator management system now features automatic password generation and email credential delivery. Passwords are no longer manually entered but are automatically generated and sent to evaluators via email.

## Password Generation

### Auto-Generated Passwords
When creating a new evaluator, the system automatically generates a secure random password with the following characteristics:

- **Length**: 12 characters
- **Composition**:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- **Randomization**: Characters are shuffled for additional security

### Password Generation Function
```typescript
function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  // Ensures at least one of each character type
  // Then fills remaining length with random characters
  // Finally shuffles the result
}
```

### Example Generated Passwords
- `K3!mPx@9tL5w`
- `vR7@nQ2*hB9j`
- `E4%dF8!pW6yK`

## Email Credential Delivery

### When Emails Are Sent

1. **New Evaluator Creation**
   - Triggers automatically when admin creates a new evaluator
   - Contains: Evaluator ID, Email, and Generated Password
   
2. **Password Reset/Regeneration**
   - When admin explicitly requests password regeneration
   - Contains: Same information with new password

### Email Template

```
Subject: Your HTGA Evaluator Account Credentials

Dear [Evaluator Name],

Your evaluator account has been created successfully.

Login Credentials:
- Evaluator ID: JEVA01
- Email: evaluator@example.com
- Password: K3!mPx@9tL5w

Please keep these credentials safe and change your password after first login.

Best regards,
HTGA Team
```

### Email Implementation Status

**Current Status**: Email sending is prepared but not yet fully implemented.

The `sendCredentialsEmail()` function currently logs the email content to the console. To complete the implementation:

#### Option 1: Using SendGrid (Recommended)

1. **Install SendGrid SDK**
```bash
npm install @sendgrid/mail
```

2. **Set Environment Variable**
```bash
# .env.local
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@htga.com
```

3. **Update Function**
```typescript
import sgMail from '@sendgrid/mail';

async function sendCredentialsEmail(
  email: string, 
  name: string, 
  evaluatorId: string, 
  password: string
): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Your HTGA Evaluator Account Credentials',
    html: `
      <h2>Dear ${name},</h2>
      <p>Your evaluator account has been created successfully.</p>
      <h3>Login Credentials:</h3>
      <ul>
        <li><strong>Evaluator ID:</strong> ${evaluatorId}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please keep these credentials safe and change your password after first login.</p>
      <p>Best regards,<br/>HTGA Team</p>
    `
  };
  
  await sgMail.send(msg);
}
```

#### Option 2: Using Nodemailer (Self-Hosted SMTP)

1. **Install Nodemailer**
```bash
npm install nodemailer
```

2. **Set Environment Variables**
```bash
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@htga.com
```

3. **Update Function**
```typescript
import nodemailer from 'nodemailer';

async function sendCredentialsEmail(
  email: string, 
  name: string, 
  evaluatorId: string, 
  password: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your HTGA Evaluator Account Credentials',
    html: `
      <h2>Dear ${name},</h2>
      <p>Your evaluator account has been created successfully.</p>
      <h3>Login Credentials:</h3>
      <ul>
        <li><strong>Evaluator ID:</strong> ${evaluatorId}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please keep these credentials safe and change your password after first login.</p>
      <p>Best regards,<br/>HTGA Team</p>
    `
  });
}
```

#### Option 3: Using AWS SES

1. **Install AWS SDK**
```bash
npm install @aws-sdk/client-ses
```

2. **Set Environment Variables**
```bash
# .env.local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=noreply@htga.com
```

3. **Update Function**
```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

async function sendCredentialsEmail(
  email: string, 
  name: string, 
  evaluatorId: string, 
  password: string
): Promise<void> {
  const client = new SESClient({ region: process.env.AWS_REGION });
  
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Your HTGA Evaluator Account Credentials' },
      Body: {
        Html: {
          Data: `
            <h2>Dear ${name},</h2>
            <p>Your evaluator account has been created successfully.</p>
            <h3>Login Credentials:</h3>
            <ul>
              <li><strong>Evaluator ID:</strong> ${evaluatorId}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please keep these credentials safe and change your password after first login.</p>
            <p>Best regards,<br/>HTGA Team</p>
          `
        }
      }
    }
  });
  
  await client.send(command);
}
```

## API Behavior

### Creating Evaluator (POST /api/evaluators)

**Request Body** (password removed from requirements):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "position": "Senior Chef",
  "company": "ABC Restaurant",
  "specialties": "Italian, Bakery",
  "maxAssignments": 5
}
```

**Response**:
```json
{
  "message": "Evaluator created successfully. Credentials have been sent to their email.",
  "evaluator": {
    "id": "JEVA01",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "position": "Senior Chef",
    "company": "ABC Restaurant",
    "specialties": ["Italian", "Bakery"],
    "maxAssignments": 5,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Note**: Password is NOT returned in the response for security reasons.

### Updating Evaluator (PUT /api/evaluators)

**Request Body** (with optional password regeneration):
```json
{
  "id": "JEVA01",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "regeneratePassword": true
}
```

**Response**:
```json
{
  "message": "Evaluator updated successfully. New credentials have been sent to their email.",
  "evaluator": {
    "id": "JEVA01",
    "name": "John Smith",
    "email": "john.smith@example.com",
    ...
  }
}
```

## Security Features

### 1. Email Uniqueness Validation
- System checks if email already exists before creating evaluator
- Prevents duplicate accounts
- Returns clear error message if email is taken

### 2. Password Storage
- Passwords are hashed before storage (using `hashPassword()`)
- **⚠️ TODO**: Implement bcrypt for production-grade hashing
- Passwords never returned in API responses

### 3. Secure Password Generation
- 12-character minimum length
- Mixed character types ensure complexity
- Random generation prevents predictability

### 4. Email Validation
- Validates email format before account creation
- Uses regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

## Future Enhancements

### Immediate TODOs
1. **Implement Email Service**: Choose and implement one of the email providers (SendGrid/Nodemailer/AWS SES)
2. **Password Hashing**: Implement bcrypt for secure password storage
3. **Email Templates**: Create professional HTML email templates
4. **Error Handling**: Add email delivery failure handling and retry logic

### Advanced Features
1. **Password Regeneration UI**: Add button in admin panel to regenerate evaluator password
2. **Email Status Tracking**: Log email delivery status in database
3. **Welcome Email**: Send separate welcome email with onboarding instructions
4. **Email Verification**: Require evaluators to verify email before first login
5. **Password Change on First Login**: Force password change after first login
6. **Email Delivery Queue**: Use queue system (Bull/Redis) for reliable email delivery
7. **Email Templates**: Use template engine (Handlebars) for customizable emails
8. **Multi-language Support**: Send emails in evaluator's preferred language

## Testing

### Test Email Sending (Development)
```typescript
// In route.ts, the console.log shows what would be emailed:
console.log(`
  ========================================
  EMAIL TO BE SENT:
  To: john@example.com
  Subject: Your HTGA Evaluator Account Credentials
  
  Dear John Doe,
  
  Your evaluator account has been created successfully.
  
  Login Credentials:
  - Evaluator ID: JEVA01
  - Email: john@example.com
  - Password: K3!mPx@9tL5w
  
  Please keep these credentials safe and change your password after first login.
  
  Best regards,
  HTGA Team
  ========================================
`);
```

### Testing Checklist
- [ ] Create evaluator and verify email content in console
- [ ] Verify password meets complexity requirements
- [ ] Test email uniqueness validation
- [ ] Test password regeneration on update
- [ ] Verify password is never exposed in API responses
- [ ] Test with invalid email formats
- [ ] Test with duplicate emails
- [ ] Implement actual email sending and test delivery
- [ ] Test email delivery failures
- [ ] Verify email content is correctly formatted

## Troubleshooting

### Email Not Sending
1. Check console logs for email preview
2. Verify email service credentials in environment variables
3. Check email service provider status/limits
4. Review error logs in console

### Password Not Generated
1. Check `generatePassword()` function implementation
2. Verify random number generation is working
3. Check for console errors during evaluator creation

### Email Format Issues
1. Verify email validation regex
2. Check for whitespace in email input
3. Test with various email formats

## Configuration Summary

### Environment Variables Needed (Choose based on email provider)

**SendGrid**:
```
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@htga.com
```

**Nodemailer (SMTP)**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@htga.com
```

**AWS SES**:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=noreply@htga.com
```

## Migration from Manual Password Entry

### What Changed
1. **Removed**: Password field from evaluator creation modal
2. **Added**: Automatic password generation in API
3. **Added**: Email credential delivery system
4. **Added**: Email uniqueness validation
5. **Updated**: Success messages to inform about email delivery

### Backward Compatibility
- Existing evaluators in database are unaffected
- Update functionality works with both old and new evaluators
- Password regeneration available through update API

## Workflow Diagram

```
Admin Creates Evaluator
        ↓
System Generates:
  - Custom ID (JEVA01)
  - Random Password (K3!mPx@9tL5w)
        ↓
Data Saved to Firebase
        ↓
Email Sent to Evaluator
  (Currently: Console Log)
  (Future: Actual Email)
        ↓
Evaluator Receives:
  - ID
  - Email
  - Password
        ↓
Evaluator Can Login
```
