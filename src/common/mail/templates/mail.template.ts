export const emailTemplate = (username: string, content: string) => `
  <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
    <p>Dear ${username},</p>
    <p>${content}</p>
    <p>Best regards,</p>
    <p>Your Company</p>
  </div>
`;

export const verifyEmailTemplate = (
  username: string,
  verificationLink: string,
) => `
  <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
    <h2>Verify Your Email</h2>
    <p>Hi ${username},</p>
    <p>Thank you for registering. Please click the link below to verify your email address:</p>
    <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not register, you can safely ignore this email.</p>
    <p>Best regards,<br>Your Company</p>
  </div>
`;

export const forgotPasswordTemplateWithCode = (
  username: string,
  verificationLink: string,
) => `
  <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
    <h2>Verify Your Email</h2>
    <p>Hi ${username},</p>
    <p>Thank you for registering. Please click the link below to verify your email address:</p>
    <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not register, you can safely ignore this email.</p>
    <p>Best regards,<br>Your Company</p>
  </div>
`;
