# Bắt đầu từ một image Node.js chính thức
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt các phụ thuộc của dự án
RUN npm install --production

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Build ứng dụng NestJS (nếu sử dụng TypeScript)
RUN npm run build

# Chạy ứng dụng trong container (cấu hình default cho NestJS)
CMD ["npm", "run", "start:prod"]

# Mở cổng mà ứng dụng NestJS đang chạy (mặc định là 3000)
EXPOSE 3000
