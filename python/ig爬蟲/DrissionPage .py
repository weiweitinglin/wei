from DrissionPage import ChromiumPage, errors
import requests
import time
import os

class IG_Parser:
    def __init__(self,account):
        self.folder_name = 'result/'+account
        self.account = account
        self.post_idx = 0
        self.create_folder(account)

    def start_parse(self, download_num):
        url = 'https://www.instagram.com/' + account + '/'
        page = ChromiumPage()
        page.get(url)

        # click first photo
        first_post = page.ele('._aagw')
        first_post.click()

        pop_window_ele = page.ele('.x1cy8zhl x9f619 x78zum5 xl56j7k x2lwn1j xeuugli x47corl')
        for i in range(download_num):
            print('=== 第', i + 1, '個 Post ===')
            retry_count = 0
            img_url = ''
            post_text = ''
            while retry_count < 2:

                try:
                    post_text_ele = pop_window_ele.ele('._ap3a _aaco _aacu _aacx _aad7 _aade')
                    post_text = post_text_ele.text
                    print('post_text:', post_text)

                    img_url = self.get_img_url(pop_window_ele)
                    print('img_url:', img_url)
                    break
                except errors.ElementNotFoundError:
                    print('該 post 為影片')
                    self.post_idx += 1
                    break
                except errors.ElementLostError:
                    retry_count += 1
                    print('retry:', retry_count)
                    time.sleep(3)

            if (img_url != ''):
                parser.download_img(img_url)
                parser.download_text(post_text)

            self.post_idx += 1

            next_btm = pop_window_ele.ele('. _aaqg _aaqh')
            next_btm.click()

    def download_img(self, img_url):
        # 使用requests發送HTTP GET請求獲取圖片數據
        response = requests.get(img_url)
        if response.status_code == 200:
            # 構造保存圖片的文件名
            file_name = self.folder_name + '/' + self.account + '_' + str(self.post_idx) + '.jpg'
            with open(file_name, 'wb') as f:
                f.write(response.content)  # 將圖片數據寫入文件
            print(f"Image saved as {file_name}")
        else:
            print(f"Failed to download image from {img_url}")

    def download_text(self, text):
        file_name = self.folder_name + '/' + self.account + '_' + str(self.post_idx) + '.txt'
        with open(file_name, 'w') as f:
            f.write(text)
        print(f"Text saved as {file_name}")

    def create_folder(self,folder_name):
        if not os.path.exists(self.folder_name):
            os.makedirs(self.folder_name)

    def get_img_url(self,pop_window_ele):
        img_url = ''
        try:
            img = pop_window_ele.ele('.x5yr21d xu96u03 x10l6tqk x13vifvy x87ps6o xh8yej3', timeout=2)
            img_url = img.attr('src')
        except errors.ElementNotFoundError:
            print('找不到圖片 element')
        return img_url

if __name__ == '__main__':
    account = 'mrweifreelife'
    download_num = 10

    parser = IG_Parser(account)
    parser.start_parse(download_num)

    print('下載完成')