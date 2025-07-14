FROM node:18

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json trước để cache layer cài đặt dependencies
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --production

# Copy toàn bộ source code vào container
COPY . .

# Expose port ứng dụng
EXPOSE 3000

# Lệnh chạy app (ưu tiên npm start, fallback node src/server.js)
CMD ["npm", "start"] 