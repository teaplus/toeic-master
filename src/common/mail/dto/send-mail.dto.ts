export class SendMailDto {
  to: string; // Địa chỉ email người nhận
  subject: string; // Chủ đề email
  content: string; // Nội dung email
  isHtml?: boolean; // Định dạng nội dung (mặc định là HTML)
}
