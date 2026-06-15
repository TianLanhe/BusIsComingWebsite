# 快速验证：Android APK 下载

## 前置条件

- 当前仓库位于 `/Users/jianglijie/Documents/BusIsCommingWebsite`。
- Android 主项目 APK 存在：`/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk`。
- 本机可用工具：Go 1.26、Node.js、npm、curl、shasum。
- 实现阶段已把当前 APK 复制到 `backend/downloads/android/BusIsComing.apk`，并更新 `backend/downloads/android/current.json`。

## 1. 校验 APK 文件

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
ls -lh backend/downloads/android/BusIsComing.apk
shasum -a 256 backend/downloads/android/BusIsComing.apk
```

期望：

- 文件存在。
- SHA-256 为 `93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`。

## 2. 后端测试

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/backend
go test ./...
```

期望：

- 下载成功测试通过。
- 文件缺失测试通过。
- SHA-256 不一致测试通过。
- 响应头测试通过，至少覆盖 `Content-Type`、`Content-Disposition`、`Content-Length` 和 `X-APK-SHA256`。

## 3. DDD 目录与依赖方向检查

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
test -d backend/internal/downloads/domain
test -d backend/internal/downloads/application
test -d backend/internal/downloads/infrastructure
test -d backend/internal/downloads/interfaces
if rg -n '"github.com/gin-gonic/gin"|os\\.|net/http|frontend|shared/contracts' backend/internal/downloads/domain; then
  echo "domain layer has forbidden dependencies"
  exit 1
fi
```

期望：

- `downloads` bounded context 至少包含 `domain`、`application`、`infrastructure`、`interfaces` 四层。
- `domain` 层不依赖 Gin、文件系统、HTTP 包、前端代码或共享前端契约。
- 下载校验规则可以通过 Go 单元测试独立验证，不需要启动 HTTP 服务。

## 4. 启动后端并直接下载

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/backend
go run ./cmd/server
```

另开终端：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
mkdir -p /tmp/busiscoming-download-check
curl -fL -D /tmp/busiscoming-download-check/headers.txt \
  -o /tmp/busiscoming-download-check/BusIsComing.apk \
  http://127.0.0.1:8080/api/downloads/android/latest
shasum -a 256 /tmp/busiscoming-download-check/BusIsComing.apk
```

期望：

- HTTP 状态为 `200`。
- 下载文件名语义为 `BusIsComing.apk`。
- SHA-256 为 `93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`。
- 响应不包含 Android 主项目本机路径。

## 5. 前端测试

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run test
npm run build
```

期望：

- 下载 manifest schema 校验通过。
- Android 可下载状态和三语文案测试通过。
- iPhone 不下载测试通过。
- 构建成功。

## 6. 浏览器端到端验证

实现阶段需要让 Playwright 同时可访问 Vite 前端和 Go 后端。推荐开发模式：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/backend
go run ./cmd/server
```

另开终端：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run test:e2e
```

期望：

- 桌面 1440px 和手机 390px 下，Android 下载入口可见可操作。
- Android 点击后下载 APK，且哈希匹配。
- iPhone 点击后不触发下载。
- 截图保存到 `specs/002-android-apk-download/visual-review/`。

## 7. 失败状态验证

临时移动受管 APK 后运行后端测试或手动请求：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
mv backend/downloads/android/BusIsComing.apk backend/downloads/android/BusIsComing.apk.bak
curl -i http://127.0.0.1:8080/api/downloads/android/latest
mv backend/downloads/android/BusIsComing.apk.bak backend/downloads/android/BusIsComing.apk
```

期望：

- 服务端返回非 2xx 状态和 JSON 错误。
- 前端不得表现为成功下载。
- 恢复 APK 后下载能力恢复。
