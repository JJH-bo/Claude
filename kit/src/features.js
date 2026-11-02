// 暂时从页面上拿掉的功能。在 iPad 上试下来不好用（Notability 圈选「拷贝」的内容粘贴不上来，手写识别也不顺手），
// 先把入口全部收起来，问题解决后把对应的开关改回 true 就恢复（代码都还在）。
// 截图粘贴的原因查明并修好了（见 photo.js 的 onPaste），iPad 上实测通过，已经打开；手写识别还关着。
// 整页「板书」不受影响：它只在这台设备上画，不交给 Claude 识别。
export const FEATURES = {
  // ✎ 手写作答、手写猜想、想法框里的手写、助教面板的手写、草稿区「拿给 Claude 看」、课堂输入框的手写板
  handwriting: false,
  // 截图作答、粘贴框、把图拖进来（组件里的、课堂输入框里的）
  photo: true,
  // 作答以后问一句「有把握吗」（confidence.js）：只在作答会记下来的地方（课堂、实时黑板、学习台）出现
  confidence: true,
  // 课堂老师的教学计划（board plan，学生看不到；docs/learning-plan.md 第 5 节）：用验收尺子量过有用才留，关掉就是 false
  plan: true,
};
