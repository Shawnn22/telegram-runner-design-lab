# Telegram Runner — Running UI/UX Design Benchmark

Ngày: 2026-09-03

## Mục tiêu

Đưa Telegram Runner từ một demo nhiều lớp UI thành một foreground running companion đáng tin: mở app, biết GPS đã sẵn sàng chưa, bấm Start, đọc số liệu khi đang chạy, Pause/Finish bằng một thao tác rõ ràng.

## Những gì benchmark cho thấy

### 1. Record screen phải ghép map và chỉ số, không bắt runner chọn một trong hai

Strava công bố Record experience mới ngày 16/07/2025 với map và stats xuất hiện cùng lúc; họ nói người dùng không cần chuyển màn hình trong lúc tập, đồng thời splits được cập nhật theo thời gian thực.

Áp dụng: map chỉ là background/context (khoảng 35–40% chiều cao), phần metrics là trung tâm. Không dùng map trống như hero page khi GPS chưa có fix.

Nguồn: Strava, “Strava Launches Redesigned Record Experience”, 2025-07-16.
https://press.strava.com/articles/strava-launches-redesigned-record-experience

### 2. Active run là chế độ chuyên biệt, không phải dashboard thu nhỏ

Apple hướng dẫn workout apps phải ưu tiên elapsed time, distance, pace và các điều khiển liên quan; tránh điều hướng/nội dung không cần thiết. Màn active cần có diện mạo khác hẳn để người dùng nhận ra session đang chạy. Text phải lớn, high-contrast và đọc được khi chuyển động.

Áp dụng: dark active screen; distance là số lớn nhất; elapsed + pace đứng dưới; Run/Activity/Rewards navigation bị ẩn khi session đang active.

Nguồn: Apple Human Interface Guidelines, “Workouts”.
https://developer.apple.com/design/human-interface-guidelines/workouts

### 3. Pause, Resume và Finish là controls chính, phải tách rủi ro

Apple yêu cầu controls trong workout phải dễ tìm/dễ tap và có feedback rõ ràng khi session bắt đầu/dừng. Screenshots Strava cũng đặt Resume và Finish thành hai controls nổi bật khi run đã pause.

Áp dụng: Pause là nút secondary; Finish & save là nút chính nhưng chỉ xuất hiện sau khi user dừng/confirm hoặc sử dụng thao tác giữ để tránh kết thúc nhầm. Status “Paused” phải đổi màu amber và đóng GPS watcher.

Nguồn: Apple HIG Workouts; Strava record screenshots qua Strava Support.
https://support.strava.com/hc/en-us/articles/216917397-Recording-an-Activity

### 4. GPS phải có state machine minh bạch, không spinner vô hạn

Apple nói progress indicator nên có mô tả ngắn, chính xác, nhất quán; khi biết được trạng thái thì nên dùng progress xác định thay vì spinner vô định. Trong bối cảnh GPS, “Locating…” thiếu actionable state.

Áp dụng state machine 4 trạng thái:

- Ready: “GPS ready · ±12 m” → Start.
- Searching: tối đa 6 giây, hiển thị “Finding a precise signal” + “Move outdoors”.
- Fallback: “Telegram GPS didn’t respond. Using device GPS.”
- Blocked: “Allow Location” + mở Settings Telegram.

Không bắt đầu timer/đếm distance cho tới fix đầu tiên đạt accuracy threshold.

Nguồn: Apple HIG, “Progress indicators”.
https://developer.apple.com/design/human-interface-guidelines/progress-indicators

### 5. Reward là after-run, không chen vào active screen

Apple khuyên workout screen bỏ nội dung không liên quan; Live Activity cũng ưu tiên thông tin glanceable liên quan trực tiếp đến activity đang diễn ra.

Áp dụng: trong active run chỉ thể hiện progress 5K rất nhỏ (“0.84 / 5 km”). Pool/reward, wallet và campaign được chuyển về màn summary sau khi lưu run. Đây cũng phù hợp với product rule của Runner: run trước, rewards match sau.

Nguồn: Apple HIG Workouts; Apple HIG Live Activities.
https://developer.apple.com/design/human-interface-guidelines/live-activities

## Design direction đề xuất: “Runner Instrument Panel”

- **Pre-run**: light surface; chỉ một card “GPS ready” và CTA Start live run; Demo mode là link phụ, không phải lựa chọn ngang hàng.
- **Active run**: navy/ink background (#071B33), accent mint cho GPS valid, amber cho pause/searching, coral chỉ cho destructive finish. Không dùng gradient pastel/map trống.
- **Hierarchy**: distance 72–88px → elapsed và pace 24–32px → GPS quality/progress text 12px.
- **Map**: khi chưa có fix hiển thị status panel có 2 hành động (Retry device GPS / Open settings), không spinner ở giữa một vùng map lớn. Khi có fix, map là lớp nền subdued.
- **Controls**: full-width Pause/Resume; Finish phải là secondary hoặc “hold to finish” trong production.
- **After-run**: summary trước (distance, time, pace, receipt), sau đó một CTA “Check rewards”; không tự đưa user vào claim flow.

## Ưu tiên build

P0 — đã/đang triển khai: timeout Telegram LocationManager → device GPS fallback; pause/resume; auto-pause khi app bị ẩn; minimum receipt threshold.

P1 — nên làm tiếp: pre-run GPS readiness gate, Finish-hold confirmation, run summary riêng, split mỗi km, haptic Telegram feedback nếu API hỗ trợ.

P2 — khi có backend: local encrypted receipt persistence, anti-cheat review state, signed reward eligibility.

## Giới hạn

Không có Mini App web API nào bảo đảm tracking liên tục trong background/lock screen như native running app. V1 cần ghi rõ foreground only và thử trên thiết bị thật (iOS/Android Telegram) trước khi hứa production-grade tracking.
