// 原生链接负责跳转，禁用 JavaScript 时三个入口依然可用。
const guide = document.getElementById('guide');
const greeting = guide.textContent;
document.querySelectorAll('.entrance').forEach(link => {
  const describe = () => { guide.textContent = '下一站：' + link.dataset.label + '。点击“进去看看”就能出发。'; };
  link.addEventListener('mouseenter', describe);
  link.addEventListener('focus', describe);
  link.addEventListener('mouseleave', () => { guide.textContent = greeting; });
  link.addEventListener('blur', () => { guide.textContent = greeting; });
});
