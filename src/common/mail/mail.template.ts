export const emailTemplate = (username: string, content: string) => `
  <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
    <p>Dear ${username},</p>
    <p>${content}</p>
    <p>Best regards,</p>
    <p>Your Company</p>
  </div>
`;
