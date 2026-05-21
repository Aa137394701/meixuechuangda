Component({
  properties: {
    energyValues: {
      type: Object,
      value: {
        metal: 70,
        wood: 70,
        water: 70,
        fire: 70,
        earth: 70
      },
      observer: 'drawRadar'
    },
    summary: {
      type: String,
      value: ''
    }
  },

  data: {
    canvas: null,
    ctx: null
  },

  lifetimes: {
    attached() {
      this.initCanvas()
    }
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery()
      query.select('#radarCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            
            // 设置 canvas 尺寸
            const dpr = wx.getSystemInfoSync().pixelRatio
            canvas.width = 400 * dpr
            canvas.height = 400 * dpr
            
            this.setData({ canvas, ctx })
            
            // 绘制雷达图
            this.drawRadar()
          }
        })
    },

    drawRadar() {
      const { canvas, ctx } = this.data
      if (!ctx) return

      const dpr = wx.getSystemInfoSync().pixelRatio
      const width = 400 * dpr
      const height = 400 * dpr
      const centerX = width / 2
      const centerY = height / 2
      const radius = 140 * dpr

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 五行标签位置（从顶部开始顺时针）
      const labels = ['金', '木', '水', '火', '土']
      const elements = ['metal', 'wood', 'water', 'fire', 'earth']
      const colorLabels = ['白', '绿', '黑', '红', '黄'] // 每个五行对应的颜色字
      
      // 绘制背景网格（三层五边形）
      const gridSizes = [0.33, 0.66, 1.0]
      gridSizes.forEach((size, index) => {
        const r = radius * size
        this.drawPentagon(ctx, centerX, centerY, r, index === 0)
      })

      // 绘制中心轴线（顺时针方向，与标签位置一致）
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) - (i * 2 * Math.PI / 5)
        const x = centerX + radius * Math.cos(angle)
        const y = centerY - radius * Math.sin(angle)
        
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = 'rgba(46, 88, 235, 0.2)'
        ctx.lineWidth = 1.5 * dpr
        ctx.stroke()
      }

      // 计算数据点（顺时针方向，与标签位置一致）
      const dataPoints = []
      const valueLabels = []
      
      elements.forEach((element, index) => {
        const value = this.data.energyValues[element] || 70
        const ratio = Math.max(0.1, value / 100)
        const angle = (Math.PI / 2) - (index * 2 * Math.PI / 5)
        
        const r = radius * ratio
        const x = centerX + r * Math.cos(angle)
        const y = centerY - r * Math.sin(angle)
        
        dataPoints.push({ x, y })
        
        // 值标签位置
        const labelR = r * 0.6
        const labelX = centerX + labelR * Math.cos(angle)
        const labelY = centerY - labelR * Math.sin(angle)
        valueLabels.push({ x: labelX, y: labelY, value })
      })

      // 绘制数据区域
      if (dataPoints.length > 0) {
        ctx.beginPath()
        ctx.moveTo(dataPoints[0].x, dataPoints[0].y)
        for (let i = 1; i < dataPoints.length; i++) {
          ctx.lineTo(dataPoints[i].x, dataPoints[i].y)
        }
        ctx.closePath()
        
        // 渐变填充
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        gradient.addColorStop(0, 'rgba(46, 88, 235, 0.15)')
        gradient.addColorStop(1, 'rgba(46, 88, 235, 0.05)')
        ctx.fillStyle = gradient
        ctx.fill()
        
        // 边框
        ctx.strokeStyle = '#2E58EB'
        ctx.lineWidth = 3 * dpr
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      // 绘制数据点
      dataPoints.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6 * dpr, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = '#2E58EB'
        ctx.lineWidth = 3 * dpr
        ctx.stroke()
      })

      // 绘制值标签
      ctx.font = `${24 * dpr}px sans-serif`
      ctx.fillStyle = '#2E58EB'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      valueLabels.forEach(label => {
        ctx.fillText(String(label.value), label.x, label.y)
      })

      // 绘制五行标签
      ctx.font = `bold ${28 * dpr}px sans-serif`
      ctx.fillStyle = '#1E293B'
      const labelPositions = [
        { x: centerX, y: centerY - radius - 20 * dpr },
        { x: centerX + radius * 0.95 + 25 * dpr, y: centerY - radius * 0.31 },
        { x: centerX + radius * 0.59, y: centerY + radius * 0.81 + 25 * dpr },
        { x: centerX - radius * 0.59, y: centerY + radius * 0.81 + 25 * dpr },
        { x: centerX - radius * 0.95 - 25 * dpr, y: centerY - radius * 0.31 }
      ]
      
      labels.forEach((label, index) => {
        const pos = labelPositions[index]
        const colorLabel = colorLabels[index]
        
        // 绘制主标签（金木水火土）
        ctx.fillText(label, pos.x, pos.y)
        
        // 绘制颜色字（小字，在主标签下方）
        ctx.font = `${16 * dpr}px sans-serif`
        ctx.fillStyle = '#64748B'
        ctx.fillText(colorLabel, pos.x, pos.y + (20 * dpr))
        
        // 恢复字体设置
        ctx.font = `bold ${28 * dpr}px sans-serif`
        ctx.fillStyle = '#1E293B'
      })
    },

    drawPentagon(ctx, centerX, centerY, radius, fill) {
      const points = []
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) + (i * 2 * Math.PI / 5)
        const x = centerX + radius * Math.cos(angle)
        const y = centerY - radius * Math.sin(angle)
        points.push({ x, y })
      }

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()
      
      if (fill) {
        ctx.fillStyle = 'rgba(46, 88, 235, 0.03)'
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(46, 88, 235, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
})
