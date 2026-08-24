# US4 验收：手机路线交换布局

日期：2026-08-25

## 结论

通过。只重组手机端输入与交换按钮布局，没有改变地点选择、路线请求、结果保留、ETA、错误恢复或排序逻辑。

## 几何验收

- 390×844 与 320×844 下，起点/终点在左侧纵向 stack，交换按钮在右侧且保持 44×44 CSS px。
- 按钮中心固定对齐两块真实输入面的整体中心；default、candidate、selected、place error 四种状态不会把按钮推到下一行。
- listbox、field error 和 focus ring 不被交换按钮覆盖，页面无横向滚动。
- 路线卡继续使用文字“車費/耗時/步行/候車”，不显示直达/转乘标签。

## 回归证据

`online-query-demo.test.tsx` 与 `online-query-demo.spec.ts` 保留原有 request sequence、旧结果保留、长站名、缺失站点、ETA 合并和互换行为测试；几何断言独立于视觉像素阈值。
