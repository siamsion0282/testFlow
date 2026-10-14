# Photo Studio · TestFlow

Web chỉnh sửa ảnh tiếng Việt trên Cloudflare Workers. Ảnh xử lý trong trình duyệt, không upload lên máy chủ.

## Tính năng

Mở/kéo thả JPG, PNG, WebP (20 MB, 24 megapixel); xoay, lật, cắt giữa theo tỉ lệ; chỉnh sáng, tương phản, bão hòa; bộ lọc; so sánh/khôi phục ảnh gốc; ảnh mẫu; xuất PNG/JPG/WebP. Giao diện responsive, không watermark.

Cắt áp dụng các chỉnh sửa hiện tại vào ảnh. Khôi phục trả về ảnh ban đầu. Cần trình duyệt hỗ trợ Canvas 2D filter (Chrome/Edge/Firefox hoặc Safari mới).

## Chạy local

Node.js 22 trở lên:

```bash
npm ci
npm run dev
```

Mở http://localhost:8787. Worker phục vụ trực tiếp các file trong `public/`.

## Deploy từ GitHub

1. Cloudflare → Workers & Pages → Create → Import a repository (hoặc Connect Git).
2. Kết nối GitHub, chọn siamsion0282/testFlow, nhánh main.
3. Tên Worker: testflow-photo-studio, trùng name trong wrangler.jsonc.
4. Root: gốc repo. Build command: để trống (nếu Cloudflare yêu cầu, dùng `npm run build`). Deploy command: `npx wrangler deploy`.
5. Deploy. Cloudflare cấp URL workers.dev và tự deploy mỗi lần push lên main.

Workers Builds cài dependencies từ package-lock.json; nếu có install command, dùng `npm ci`. Chọn Workers vì cấu hình có Worker và Static Assets. Static Assets trỏ thẳng tới `public/`, nên lệnh deploy chạy được dù không có bước build.

## Deploy CLI

```bash
npm ci
npx wrangler login
npm run deploy
```

CI không tương tác dùng secret CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID. Không commit token. Workers Builds quản lý xác thực khi kết nối repo trong Cloudflare.

## Kiểm tra

`npm run check`: kiểm tra cú pháp, unit tests và đóng gói thử Worker mà không deploy.

`public/` chứa giao diện/Canvas; `src/worker.js` phục vụ assets và security headers; `tests/` kiểm tra lõi chỉnh sửa/Worker. `npm run build` chỉ tạo bản sao `dist/` để dùng khi cần, không ảnh hưởng tới triển khai Workers.
