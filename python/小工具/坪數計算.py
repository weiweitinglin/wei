def calculate_ping(length_cm, width_cm):
    # 1公尺 = 100 公分，所以轉換為平方公尺
    area_square_meters = (length_cm / 100) * (width_cm / 100)
    # 1 坪 = 3.305785 平方公尺
    area_ping = area_square_meters / 3.305785
    return area_ping

# 主程式
def main():
    print("坪數計算程式")
    try:
        length_cm = float(input("請輸入長度 (公分): "))
        width_cm = float(input("請輸入寬度 (公分): "))
        
        if length_cm <= 0 or width_cm <= 0:
            print("長度和寬度必須是正數！")
            return

        area_ping = calculate_ping(length_cm, width_cm)
        print(f"該面積為: {area_ping:.2f} 坪")
    except ValueError:
        print("請輸入有效的數字！")

# 執行主程式
if __name__ == "__main__":
    main()
