# BÀI LÀM – ĐÁNH GIÁ NĂNG LỰC FRONTEND (K24)

- **Mã đề:** 01
- **Họ tên:**
- **Lớp:**
- **Link repository:**
- **Hệ điều hành (Windows/macOS):**
- **Mã commit P2 đã nộp trước phút 90 (gõ `git log --oneline -1`):**
- **Phiên bản Node.js (gõ `node -v`):**

## 4.1. Giao diện danh sách sản phẩm

> Pha 1 – mức AI-0 (không dùng AI).

> Chấm trực tiếp trên mã nguồn thư mục officemart_admin. Đánh dấu `[x]` vào các mục đã làm để tự kiểm tra.

- [x] 4.1.1. Bố cục trang
- [x] 4.1.2. Bảng sản phẩm
- [x] 4.1.3. Định dạng dữ liệu
- [x] 4.1.4. Hiển thị trên điện thoại

## 4.2. Thêm, sửa, xoá sản phẩm qua API

> Pha 1 – mức AI-0 (không dùng AI).

> Chấm trực tiếp trên mã nguồn thư mục officemart_admin.

- [x] 4.2.1. Tải danh sách
- [x] 4.2.2. Form thêm sản phẩm
- [x] 4.2.3. Gửi form
- [x] 4.2.4. Sửa sản phẩm
- [x] 4.2.5. Xoá sản phẩm

## 4.3. Tìm kiếm, lọc và phân trang

> Pha 2 – mức AI-2 (được dùng AI, ghi nhật ký ở Mục 4.3.5).

> Mục 4.3.1 đến 4.3.3 và ý c của Mục 4.3.4 chấm trực tiếp trên mã nguồn.

- [x] 4.3.1. Tìm kiếm và lọc
- [x] 4.3.2. Phân trang
- [x] 4.3.3. Đồng bộ URL

### 4.3.4. Phản biện mã do AI sinh

#### a) Thao tác làm danh sách hiển thị sai

Các bước thao tác:

```text
1. Chạy API ở chế độ mạng chậm bằng lệnh: npm run api:cham (request GET /api/products có từ khoá bắt đầu bằng "ban" sẽ trễ 2,5 giây; các request khác chỉ trễ 0,1 giây).
2. Mở trang /products đang dùng hook src/ai/useProductSearch_ai.js.
3. Gõ từ khoá "ban" vào ô tìm kiếm và chờ khoảng 0,5 giây (để hết debounce 400ms và request ?q=ban được gửi đi, đang chờ phản hồi 2,5 giây).
4. Ngay lập tức đổi nội dung ô tìm kiếm thành "chuot" và chờ khoảng 3 giây.
```

Kết quả hiển thị:

```text
Sau khi đổi sang "chuot", bảng sản phẩm ban đầu hiện đúng danh sách các sản phẩm chuột (do request ?q=chuot trả về sau 0,1 giây). Tuy nhiên khoảng 1,5 - 2 giây sau, danh sách bất ngờ bị ghi đè thành các sản phẩm "Bàn phím" và "Bàn làm việc", trong khi ô tìm kiếm vẫn đang hiển thị chữ "chuot".
```

Kết quả đúng:

```text
Khi đổi từ khoá sang "chuot", request cũ (?q=ban) phải bị huỷ (status Canceled trong tab Network) và bảng sản phẩm phải luôn giữ nguyên danh sách các sản phẩm khớp với từ khoá mới nhất "chuot".
```

#### b) Vì sao hook hiển thị sai

Hook `useProductSearch_ai.js` không huỷ request cũ bằng `AbortController` trong hàm cleanup của `useEffect` và cũng không kiểm tra xem response trả về có còn tương ứng với lần gọi mới nhất hay không (lỗi race condition). Khi request gửi trước (`?q=ban`, trễ 2,5s) trả về sau request gửi sau (`?q=chuot`, trễ 0,1s), kết quả cũ đã gọi `setData` và ghi đè lên kết quả mới.

#### c) Hook đã sửa

> Chấm trực tiếp trên file src/hooks/useProductSearch.js và trang danh sách.

### 4.3.5. Nhật ký dùng AI (giữ – sửa – loại bỏ)

> Ghi ít nhất 2 lần dùng AI có ảnh hưởng đến mã nộp. Không dùng AI trong Pha 2 thì xoá bảng và ghi "Không sử dụng AI trong Pha 2".

| Lần | Câu lệnh chính gửi cho AI | Đoạn mã hoặc ý AI đưa ra (file) | Quyết định (giữ/sửa/loại bỏ) | Lý do | Bằng chứng kiểm chứng (chạy thử gì, kết quả) |
|---|---|---|---|---|---|
| 1 | Viết custom hook `useProductSearch` gọi `GET /api/products` có huỷ request cũ bằng `AbortController` khi tham số thay đổi. | Tạo `AbortController` trong `useEffect`, truyền `signal` vào `api.get`, gọi `controller.abort()` trong cleanup và bỏ qua lỗi `axios.isCancel(err)` (`src/hooks/useProductSearch.js`). | Sửa | Bản đầu cần bổ sung kiểm tra `!controller.signal.aborted` trong `finally` (tránh request cũ bị huỷ làm tắt `loading` của request mới) và lấy `err.response?.data?.message` thay vì chỉ `err.message`, đồng thời hỗ trợ `reloadKey` cho nút Thử lại. | Chạy `npm run api:cham`, gõ `"ban"` rồi đổi sang `"chuot"`: tab Network hiện request `?q=ban` bị `canceled`, bảng luôn giữ kết quả `"chuot"`. Chạy `npm run api:loi`: hiển thị đúng thông báo lỗi từ server và nút Thử lại hoạt động. |
| 2 | Cách đồng bộ ô tìm kiếm debounce 400ms, bộ lọc danh mục/trạng thái và phân trang với `useSearchParams` hỗ trợ nút Back/Forward. | Lưu `q`, `category`, `status`, `page` trên URL bằng `useSearchParams`, tách state `searchInput` có `setTimeout` 400ms và đồng bộ `searchInput` theo `urlQ` (`src/pages/ProductListPage.jsx`). | Sửa | Bổ sung kiểm tra `if (trimmed === urlQ) return` trong `useEffect` debounce để khi bấm Back/Forward không gọi `setSearchParams` đè lại history, đồng thời xử lý các trường hợp biên như `page=-3`, `page=999`, `q` chỉ có khoảng trắng. | Mở trực tiếp `/products?q=chuot&category=mouse&status=active&page=2`, kiểm tra ô tìm kiếm, bộ lọc, số trang khớp URL; bấm Back/Forward thấy dữ liệu và bộ lọc đồng bộ đúng; gõ liền `"ban"` chỉ gửi 1 request trên tab Network. |

## Ghi chú (không tính điểm)

- **Từ khoá chỉ có khoảng trắng (`q="   "`):** chuẩn hoá bằng `.trim()` trước khi ghi lên URL và gửi API để tránh gửi tham số rỗng vô nghĩa.
- **Số trang không hợp lệ (`page=-3`, `page=0`, `page=abc`, `page=1.5`):** hàm `parsePage` kiểm tra `Number.isInteger(num) && num >= 1`, nếu sai sẽ mặc định về trang `1`.
- **Số trang vượt quá tổng số trang (`page=999`):** sau khi nhận `total` từ API, nếu `total > 0 && urlPage > totalPages` thì tự động chuyển về trang cuối hợp lệ (`totalPages`) bằng `setSearchParams(..., { replace: true })` để không làm kẹt nút Back.
- **Trạng thái không hợp lệ trên URL (`status=xyz`):** chỉ chấp nhận `'active'` hoặc `'inactive'`, giá trị khác tự chuẩn hoá về `''` (Tất cả).
