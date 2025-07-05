Tiêu chí thăng cấp (mỗi chu kỳ lên 1 cấp)
- SA trong vòng 30 ngày tính từ ngày hiện tại nếu doanh thu đạt 20.000.000 => SM
- SM trong vòng 180 ngày tính từ ngày hiện tại nếu doanh thu đạt 1.200.000.000 => CASA
- CASA trong vòng 360 ngày tính từ ngày hiện tại nếu doanh thu đạt  10.200.000.000 => SD
- Lưu ý: BDA chỉ hỗ trợ lên tới SM còn CASA hỗ trợ lên tới SD

Tiêu chí hạ cấp (mỗi chu kỳ hạ 1 cấp)
- SD trong vòng 90 ngày tính từ ngày thăng cấp nếu không đạt doanh thu 2.000.000.000 => CASA
- CASA trong vòng 90 ngày tính từ ngày thăng cấp nếu không đạt doanh thu 500.000.000 => SM

Flow tách cây khi thăng hoặc hạ cấp
- Thăng cấp => user con cao hơn cấp cha thì tách lên cha gần nhất của User đó và log lại trong bảng tracking upgrade
- Hạ cấp => lấy toàn bộ user con dưới cây, check user con nào có cấp cao hơn user bị hạ cấp thì tách user đó lên cấp trên của user cha bị hạ cấp

Cron chạy hằng ngày
- levelUp Review thăng cấp theo tiêu chí ở trên => 0h30
- levelDown Review hạ cấp theo tiêu chí ở trên => 1h30
- Change Parent Review thăng cấp nếu vượt level của user cha hiện tại thì tách cây lên user cha gần nhất của user cha hiện tại => 2h30
- level review notify => 8h00