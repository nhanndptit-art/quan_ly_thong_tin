import json
import os
from datetime import datetime

# TUYỆT ĐỐI KHÔNG THAY ĐỔI CÁC THÔNG SỐ BAN ĐẦU NÀY
GOC_BAN_DAU = 14050000
LAI_BAN_DAU = 301000
PHAN_TRAM_LAI_HANG_THANG = 0.005 # 0.5%

DATA_FILE = 'data_no.json'

class QuanLiTienLai:
    def __init__(self):
        self.load_data()
        self.tinh_lai_tu_dong()

    def load_data(self):
        """Tải dữ liệu từ file JSON, nếu chưa có thì khởi tạo với con số gốc/lãi yêu cầu."""
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.tien_goc = data['tien_goc']
                self.tien_lai = data['tien_lai']
                self.lich_su = data['lich_su']
                self.thang_cap_nhat_cuoi = data.get('thang_cap_nhat_cuoi', datetime.now().strftime("%Y-%m"))
        else:
            self.tien_goc = GOC_BAN_DAU
            self.tien_lai = LAI_BAN_DAU
            self.lich_su = []
            self.thang_cap_nhat_cuoi = datetime.now().strftime("%Y-%m")
            self.ghi_lich_su("Khởi tạo hệ thống theo dõi nợ", 0)
            self.save_data()

    def save_data(self):
        """Lưu toàn bộ thay đổi vào file JSON."""
        data = {
            'tien_goc': self.tien_goc,
            'tien_lai': self.tien_lai,
            'lich_su': self.lich_su,
            'thang_cap_nhat_cuoi': self.thang_cap_nhat_cuoi
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    def tinh_lai_tu_dong(self):
        """Tự động kiểm tra xem đã qua tháng mới chưa để cộng lãi (0.5% gốc hiện tại)"""
        thang_hien_tai = datetime.now().strftime("%Y-%m")
        
        if thang_hien_tai > self.thang_cap_nhat_cuoi:
            # Tính số tháng chênh lệch phòng trường hợp lâu ngày không mở ứng dụng
            y1, m1 = map(int, self.thang_cap_nhat_cuoi.split('-'))
            y2, m2 = map(int, thang_hien_tai.split('-'))
            so_thang_chua_tinh = (y2 - y1) * 12 + (m2 - m1)
            
            if so_thang_chua_tinh > 0:
                for _ in range(so_thang_chua_tinh):
                    lai_sinh_ra = self.tien_goc * PHAN_TRAM_LAI_HANG_THANG
                    self.tien_lai += lai_sinh_ra
                
                self.thang_cap_nhat_cuoi = thang_hien_tai
                self.ghi_lich_su(f"Hệ thống tự động cộng tiền lãi cho {so_thang_chua_tinh} tháng", lai_sinh_ra * so_thang_chua_tinh)
                self.save_data()
                print(f"\n[!] THÔNG BÁO: Đã tự động cập nhật tiền lãi của {so_thang_chua_tinh} tháng mới.")

    def ghi_lich_su(self, hanh_dong, so_tien):
        """Ghi nhận lại lịch sử mọi giao dịch/biến động."""
        thoi_gian_thuc = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        self.lich_su.append({
            "thoi_gian": thoi_gian_thuc,
            "hanh_dong": hanh_dong,
            "so_tien": so_tien,
            "goc_hien_tai": self.tien_goc,
            "lai_hien_tai": self.tien_lai
        })

    def xem_chi_tiet(self):
        print("\n" + "="*35)
        print(" THÔNG TIN CHI TIẾT KHOẢN NỢ")
        print("="*35)
        print(f"[-] TIỀN GỐC CÒN LẠI : {self.tien_goc:,.0f} VNĐ".replace(',', '.'))
        print(f"[-] TIỀN LÃI CỘNG DỒN : {self.tien_lai:,.0f} VNĐ".replace(',', '.'))
        print("-" * 35)
        print(f"[=] TỔNG NỢ CẦN TRẢ   : {(self.tien_goc + self.tien_lai):,.0f} VNĐ".replace(',', '.'))
        print("="*35)

    def tru_tien_goc(self, so_tien):
        if so_tien <= 0:
            print("\n[Lỗi] Số tiền trả phải lớn hơn 0.")
            return
        if so_tien > self.tien_goc:
            print("\n[Lỗi] Số tiền bạn nhập lớn hơn số tiền gốc hiện tại!")
            return
            
        self.tien_goc -= so_tien
        self.ghi_lich_su("Thanh toán trừ vào TIỀN GỐC", so_tien)
        self.save_data()
        print(f"\n[Thành công] Đã trừ {so_tien:,.0f} VNĐ vào tiền gốc.".replace(',', '.'))

    def tru_tien_lai(self, so_tien):
        if so_tien <= 0:
            print("\n[Lỗi] Số tiền trả phải lớn hơn 0.")
            return
        if so_tien > self.tien_lai:
            print("\n[Lỗi] Số tiền bạn nhập lớn hơn số tiền lãi hiện tại!")
            return
            
        self.tien_lai -= so_tien
        self.ghi_lich_su("Thanh toán trừ vào TIỀN LÃI", so_tien)
        self.save_data()
        print(f"\n[Thành công] Đã trừ {so_tien:,.0f} VNĐ vào tiền lãi.".replace(',', '.'))

    def xem_lich_su(self):
        print("\n" + "="*50)
        print(" LỊCH SỬ GIAO DỊCH & BIẾN ĐỘNG")
        print("="*50)
        if not self.lich_su:
            print("Chưa có dữ liệu lịch sử.")
        else:
            for gd in self.lich_su:
                tien_str = f" ({gd['so_tien']:,.0f} VNĐ)".replace(',', '.') if gd['so_tien'] > 0 else ""
                print(f"[{gd['thoi_gian']}] {gd['hanh_dong']}{tien_str}")
                print(f"  --> Gốc còn: {gd['goc_hien_tai']:,.0f} VNĐ | Lãi còn: {gd['lai_hien_tai']:,.0f} VNĐ".replace(',', '.'))
                print("-" * 50)


def main():
    app = QuanLiTienLai()
    
    while True:
        print("\n" + "*"*30)
        print(" HỆ THỐNG QUẢN LÝ TIỀN LÃI")
        print("*"*30)
        print("1. Xem thông tin chi tiết khoản nợ")
        print("2. Trừ tiền GỐC")
        print("3. Trừ tiền LÃI")
        print("4. Xem lịch sử trừ tiền/biến động")
        print("0. Thoát phần mềm")
        print("*"*30)
        
        chon = input("Vui lòng chọn chức năng (0-4): ")
        
        if chon == '1':
            app.xem_chi_tiet()
        elif chon == '2':
            try:
                so_tien = float(input("Nhập số tiền GỐC muốn trừ (VNĐ): "))
                app.tru_tien_goc(so_tien)
            except ValueError:
                print("\n[Lỗi] Vui lòng chỉ nhập số!")
        elif chon == '3':
            try:
                so_tien = float(input("Nhập số tiền LÃI muốn trừ (VNĐ): "))
                app.tru_tien_lai(so_tien)
            except ValueError:
                print("\n[Lỗi] Vui lòng chỉ nhập số!")
        elif chon == '4':
            app.xem_lich_su()
        elif chon == '0':
            print("\nĐã lưu dữ liệu. Hẹn gặp lại!")
            break
        else:
            print("\n[Lỗi] Lựa chọn không hợp lệ, vui lòng chọn lại.")

if __name__ == "__main__":
    main()