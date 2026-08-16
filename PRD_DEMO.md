# Telegram Runner — Hybrid Fundraising Demo PRD

Ngày: 2026-08-15  
Ngôn ngữ sản phẩm: English  
Thị trường: Global TON community

## Problem statement

Web3 projects đang dùng social task để phân phối reward nhưng khó tạo engagement ngoài đời thật. Runner cần một cách tham gia campaign đơn giản, không phải mua NFT hoặc token đầu vào, trong khi sponsor cần chứng minh reward pool đã được fund và chỉ trả cho hoạt động hợp lệ.

## Demo goal

Chứng minh một flow hoàn chỉnh: project được duyệt → tạo campaign → fund pool → runner tham gia → lưu activity → kiểm tra reward riêng → challenge window → claim reward.

## Personas

- **Project operator:** muốn launch một healthy campaign cho cộng đồng TON mà không xây app chạy bộ và smart contract riêng.
- **Runner:** muốn tracking một phiên chạy và nhận reward đã được escrow mà không mua NFT.
- **Investor/demo viewer:** cần hiểu wedge, trust model và ranh giới demo/production trong vài phút.

## P0 requirements

### Project Admin

- Mock KYB/KYC provider screen có nhãn `Simulated integration`.
- Nút xác nhận demo cho phép auto-approve và đi tiếp.
- Campaign wizard: basics, duration, completion rule, TON reward, fee review.
- Funding screen thể hiện TON testnet/escrow flow và trạng thái funded.
- Campaign overview có participant, progress và lifecycle.

### Runner Mini App

- Browse và join campaign.
- Wallet connection state.
- Chọn `Live GPS` hoặc `Demo route` có nhãn rõ ràng.
- Start/Stop run, hiển thị time, distance, pace và GPS status.
- Activity history tách biệt với reward checking/claim state.
- Result checking, completion status, challenge window và claim state trong mục Rewards riêng.

### Trust model

- Smart contract giữ reward pool và payout theo result đã ký.
- Backend/oracle chịu trách nhiệm anti-cheat và ranking.
- Demo không tuyên bố KYB, anti-cheat hoặc payout production-grade.

## Acceptance criteria

- Given project chưa verified, when bấm approve demo KYB, then có thể vào campaign wizard.
- Given campaign draft, when hoàn thành các bước và fund demo pool, then campaign chuyển sang `Funded / Live`.
- Given runner đã join, when Start Run, then app bắt đầu session bằng GPS thật hoặc demo route được gắn nhãn.
- Given runner kết thúc run, when Stop Run, then activity được lưu và hiển thị trong Activity, không tự động chuyển thành reward.
- Given runner mở Rewards, when demo oracle check hoàn thành, then eligibility được hiển thị riêng khỏi activity record.
- Given challenge window được fast-forward trong demo, when claim, then reward chuyển sang claimed.
- Mọi integration mô phỏng đều có badge và giải thích, không được trình bày như production.

## Demo defaults

- Campaign: TON Global 5K Week.
- Duration: 7 days.
- Rule: complete 5 km total.
- Reward pool: 1,000 TON testnet demo units.
- Challenge window: 24 hours, time-compressed trong demo.
- Revenue: 50 TON setup fee + 5% pool fee.

## Non-goals

- Production KYB/KYC.
- Production-grade GPS anti-cheat.
- Mainnet payout hoặc audited contract.
- Multi-chain, NFT, app token, native mobile app.
- Custom arbitrary smart-contract rules.

## Success metrics cho demo

- Viewer hoàn thành cả Admin và Runner story trong dưới 5 phút.
- Viewer phân biệt được reward escrow với GPS/oracle verification.
- Live GPS Start/Stop hoạt động trên ít nhất một Telegram/mobile client.
- Không có màn cụt trong happy path.

## Build checkpoints

1. Shell + role switcher + product narrative.
2. Runner GPS/session happy path.
3. Admin KYB + campaign setup + funding happy path.
4. TON adapter/testnet contract path.
5. Full-story verification và publish.
