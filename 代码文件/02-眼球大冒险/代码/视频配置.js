// 所有路径相对于本文件所在的“代码”文件夹。保存后刷新页面生效。
// src: '' 表示尚未提供视频；替换为 '../视频/文件名.mp4' 即可接入。
window.EYE_VIDEO_CONFIG = {
  // 完整地图作为背景，五张独立建筑图片叠在上方负责交互。
  mapImage: '../配图/眼球大冒险地图背景.jpg',
  chapters: [
    { id: '01', title: '角膜基地', subtitle: '眼睛的保护罩', src: '../视频/角膜基地.mp4', poster: '', captions: '' },
    { id: '02', title: '瞳孔黑洞', subtitle: '光线的入口', src: '../视频/瞳孔科普.mp4', poster: '', captions: '' },
    { id: '03', title: '晶状体水晶宫', subtitle: '调节焦点的小帮手', src: '../视频/晶状体水晶宫.mp4', poster: '', captions: '' },
    { id: '04', title: '视网膜星云', subtitle: '接收光线的地方', src: '../视频/视网膜星云.mp4', poster: '', captions: '' },
    { id: '05', title: '视神经传输站', subtitle: '把信息送给大脑', src: '../视频/视神经传输站.mp4', poster: '', captions: '' }
  ]
};
