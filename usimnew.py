import json
import requests
from bs4 import BeautifulSoup
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def get_data_codes():
    # Đọc dữ liệu từ file mapping
    try:
        with open('comprehensive-mapping-data.json', 'r', encoding='utf-8') as f:
            mapping_data = json.load(f)
            return mapping_data['mapping']
    except FileNotFoundError:
        print("❌ Không tìm thấy file mapping. Vui lòng tạo file trước.")
        return {}

def update_web_data_codes():
    # Cài đặt Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Chạy ẩn
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Truy cập trang admin
        driver.get("https://daily.telebox.vn/products")
        
        # Lấy dữ liệu mapping
        data_codes = get_data_codes()
        
        # Tìm tất cả các dòng sản phẩm
        products = driver.find_elements(By.CSS_SELECTOR, "table tr.product-row")
        
        updated_count = 0
        for product in products:
            try:
                # Lấy tên sản phẩm
                product_name = product.find_element(By.CSS_SELECTOR, ".product-name").text
                product_name_with_esim = f"{product_name} (esim)"
                
                # Kiểm tra xem có data code cho sản phẩm này không
                if product_name_with_esim in data_codes:
                    data_code = data_codes[product_name_with_esim]
                    
                    # Tìm ô input data code
                    data_code_input = product.find_element(By.CSS_SELECTOR, ".data-code-input")
                    
                    # Cập nhật data code
                    driver.execute_script(
                        "arguments[0].value = arguments[1]", 
                        data_code_input, 
                        data_code
                    )
                    
                    # Click nút lưu
                    save_button = product.find_element(By.CSS_SELECTOR, ".save-button")
                    save_button.click()
                    
                    # Đợi thông báo thành công
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".success-message"))
                    )
                    
                    updated_count += 1
                    print(f"✅ Đã cập nhật {product_name}: {data_code}")
                
            except Exception as e:
                print(f"❌ Lỗi khi cập nhật {product_name}: {str(e)}")
                continue
        
        print(f"\n✨ Đã cập nhật thành công {updated_count} sản phẩm")
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
    
    finally:
        driver.quit()

def export_to_excel():
    data_codes = get_data_codes()
    
    # Chuyển đổi sang DataFrame
    df = pd.DataFrame([
        {
            'Tên sản phẩm': name.replace(' (esim)', ''),
            'Data Code': code
        }
        for name, code in data_codes.items()
    ])
    
    # Lưu ra file Excel
    excel_path = 'data_codes.xlsx'
    df.to_excel(excel_path, index=False)
    print(f"✨ Đã xuất data codes ra file {excel_path}")

if __name__ == "__main__":
    print("🚀 Bắt đầu quá trình cập nhật data code...")
    
    # Cập nhật data codes trên web
    update_web_data_codes()
    
    # Xuất ra file Excel để backup
    export_to_excel()