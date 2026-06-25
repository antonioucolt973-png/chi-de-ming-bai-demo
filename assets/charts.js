/**
 * 吃得明白 - 图表可视化模块
 */

var Charts = (function() {
  var macroChart = null;

  function init() {
    var el = document.getElementById('chart-macro');
    if (el) {
      macroChart = echarts.init(el, null, { renderer: 'svg' });
      updateMacroChart(0, 0, 0, 0);
      window.addEventListener('resize', function() { macroChart && macroChart.resize(); });
    }
  }

  function updateMacroChart(protein, fat, carb, cal) {
    if (!macroChart) return;

    var hasData = (protein + fat + carb) > 0;

    macroChart.setOption({
      title: {
        text: hasData ? '三大营养素配比' : '等待记录...',
        left: 'center',
        top: 8,
        textStyle: { fontSize: 13, fontWeight: 600, color: '#2D2A24' }
      },
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: function(p) {
          return '<strong>' + p.name + '</strong><br/>' +
                 p.value + 'g (' + p.percent + '%)';
        }
      },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '58%'],
        avoidLabelOverlap: true,
        padAngle: 3,
        itemStyle: { borderRadius: 6 },
        label: {
          show: hasData,
          formatter: '{b}\n{d}%',
          fontSize: 11,
          fontWeight: 600,
          color: '#2D2A24',
          lineHeight: 16
        },
        labelLine: {
          lineStyle: { color: '#E6DDD3' }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
          }
        },
        data: hasData ? [
          { value: protein, name: '蛋白质', itemStyle: { color: '#5BA06B' } },
          { value: fat, name: '脂肪', itemStyle: { color: '#D4875A' } },
          { value: carb, name: '碳水化合物', itemStyle: { color: '#5B8CA0' } }
        ] : [
          { value: 1, name: '蛋白质', itemStyle: { color: '#E6DDD3' } },
          { value: 1, name: '脂肪', itemStyle: { color: '#E6DDD3' } },
          { value: 1, name: '碳水化合物', itemStyle: { color: '#E6DDD3' } }
        ],
        animation: false
      }]
    });
  }

  return {
    init: init,
    updateMacroChart: updateMacroChart
  };
})();