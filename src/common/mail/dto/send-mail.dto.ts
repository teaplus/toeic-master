export class SendMailDto {
  to: string; // Địa chỉ email người nhận
  subject: string; // Chủ đề email
  templateName: string; // Tên template
  context: any; // Dữ liệu để thay thế trong template
}
