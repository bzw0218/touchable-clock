(function() {
  function rpx2px (number) {
    // return number/750*window.innerHeight
    return number
  }

  function imgReady (src) {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        resolve(img)
      }
    })
  }

  function Clock() {
    this.clockImg = 'https://gw.alicdn.com/imgextra/i3/O1CN01lMLYGh1tpblBLd3Vr_!!6000000005951-2-tps-483-476.png'
    this.hourHandImg = 'https://gw.alicdn.com/imgextra/i4/O1CN01nSOh3e1vh1ZBwZimV_!!6000000006203-2-tps-78-160.png'
    this.minuteHandImg = 'https://gw.alicdn.com/imgextra/i4/O1CN01pt6xkf1dQqUaybgxz_!!6000000003731-2-tps-37-332.png'

    this.clockDom = null
    this.hourPointerDom = null
    this.minutePointerDom = null
    this.ctx = null
    this.originX = 0
    this.originY = 0
    this.radius = 0

    this.speed = 1
    this.scaleRate = 1 // 图片缩放比例

    this.timer = null

    this.availableTouch = false // 触摸是否有效 从start判断

    // 钟表刻度时间
    this.time = null
    this.previousPos = null
    this.hourDeg = 0
    this.minuteDeg = 0
    this.moveingHand = ''  // hour minute

    // 随机的时间
    this.randomTime = null

    this.ready = () => {
      return Promise.all([
        imgReady(this.clockImg),
        imgReady(this.hourHandImg),
        imgReady(this.minuteHandImg)
      ])
    }

    this.onRandomTimeShow = () =>{

    }

    this.onCorrect = () => {
      this.showRight()
      this.refreshRandomTime()
      this.rightAudio.play()
    }

    this.onError = () => {
      this.wrongAudio.play()
    }

    this.initEvent = () => {
      this.canvas.addEventListener('touchstart', this.handleTouchStart, false)
      this.canvas.addEventListener('touchmove', this.handleTouchMove, false)
      this.canvas.addEventListener('touchend', this.handleTouchEnd, false)
      this.canvas.addEventListener('touchcancel', this.handleTouchEnd, false)
    }

    this.refreshRandomTime = () => {

      const hour = parseInt(Math.random()*13)
      const minute = Math.random() < 0.75 ? 0 : 30
      // const hour =  12
      // const minute = 30

      this.randomTime = {
        hour,
        minute,
      }

      document.querySelector('.show-time').innerHTML = hour + ':' + (minute < 10 ? '0' + minute : minute)
      
      return this.randomTime
    }

    this.checkRandomTime = () => {
      const { hour, minute } = this.randomTime

      const date = new Date(this.time)

      const h = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
      const m = date.getMinutes()

      if(((h%12) === (hour%12) && (m - minute < 2)) 
       || ((h%12) === (hour%12) - 1 && (m -minute) > 58)) {
        this.onCorrect()
      } else {
        this.onError()
      }
      
    }

    this.showRight = () => {
      document.querySelector('.show-right').setAttribute('style',  'display: block;')

      setTimeout(() => {
        document.querySelector('.show-right').setAttribute('style',  'display: none;')
      }, 1500);
    }

    this.getRelativePosition = e => {
      const { clientX: x, clientY: y } = e.touches[0]

      return {
        x: x - this.originX,
        y: this.originY - y
      }
    }

    this.getAngle = ({x, y}) => {
      let angle = Math.atan(Math.pow(y, 2)/Math.pow(x, 2)) * 180/Math.PI

      let delta = 1

      if(x > 0 && y > 0) angle = 360 - angle

      if(x < 0 && y < 0) angle = 180 - angle

      if(x < 0 && y > 0) angle = 180 + angle

      return angle * delta
    }

    this.isPointerInClock = ({x, y}) => {
      const distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
      return distance <= this.radius
    }

    this.handleTouchStart = (e) => {
      // 检测是否命中 时钟 分针  秒针
      const pointer = this.getRelativePosition(e)
      const isInClock = this.isPointerInClock(pointer)

      if(!isInClock) return 

      const angle = (this.getAngle(pointer) + 90) % 360

      const hourDeg = this.hourDeg % 360
      const minuteDeg = this.minuteDeg % 360

      if(Math.abs(angle - minuteDeg < 10)) this.moveingHand = 'minute'
      else if(Math.abs(angle - hourDeg < 10)) this.moveingHand = 'hour'

      this.previousPos = pointer
    
    }

    this.handleTouchMove = e => {
      if(!this.moveingHand) return

      const pos = this.getRelativePosition(e)

      // is in hand
      // 计算角度

      const angle = this.getAngle(pos)

      const preAngle = this.getAngle(this.previousPos)

      let preFixAngle = 0

      // 过了 0 0 线
      if(Math.abs(Math.abs(angle) - Math.abs(preAngle)) > 270) {
        if(angle < preAngle) preFixAngle = 360
        else preFixAngle = -360
      }

      const deltaAngle = angle + preFixAngle - preAngle 

      this.previousPos = pos

      const rate = this.moveingHand === 'minute' ? 10000 : 10000 * 12

      this.drawTime(this.time + deltaAngle * rate)


    }

    this.handleTouchEnd = e => {
      // const { clientX: x, clientY: y } = e.touches[0]
      this.moveingHand = ''

      this.checkRandomTime()
    }

    this.init = () => {
      return this.ready().then(([img1, img2, img3]) => {
        this.clockDom = img1
        this.hourPointerDom =  img2
        this.minutePointerDom = img3

        const canvas = document.getElementById('canvas')
        const { x, y, width, height } = canvas.getBoundingClientRect()

        canvas.setAttribute('width', width)
        canvas.setAttribute('height', height)

        this.canvas = canvas
        this.ctx = canvas.getContext('2d');
        this.originX = x + width / 2
        this.originY = y + height / 2
        this.radius = width / 2

        this.scaleRate = width/483

        this.ctx.translate(width/2, height/2)

        this.initEvent()

        this.rightAudio = document.getElementById('rightAudio')

        this.wrongAudio = document.getElementById('wrongAudio')

      })
    }

    this.rotateDraw = (deg) => {
      this.ctx.rotate(Math.PI / 180 * deg)
    }

    this.start = () => {
      let time = Date.now()
      if(this.timer) clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.drawTime(time++)
        time += 10 * this.speed
      }, 10)
    }

    this.stop = () => {
      this.clearInterval(this.timer)
    }

    this.drawTime = (time = Date.now()) => {

      this.time = time

      const date = new Date(time)

      const hours = date.getHours()
      const minutes = date.getMinutes()
      const secounds = date.getSeconds() + date.getMinutes()/1000

      const hourDeg = (hours * 3600 + minutes * 60 + secounds) / (12 * 60 * 60) * 360
      const minuteDeg = (minutes * 60 + secounds) / (60 * 60) * 360
      const secoundDeg = secounds/60 * 360

      this.hourDeg = hourDeg
      this.minuteDeg = minuteDeg

      this.drawBg()
      this.drawHour(hourDeg)
      this.drawMinute(minuteDeg)
    }

    this.drawBg = () => {
      const width = rpx2px(483 * this.scaleRate)
      const height = rpx2px(476 * this.scaleRate)
      this.ctx.drawImage(this.clockDom, -width/2, -height/2, width, height)
    }

    this.drawHour = (deg = 0) => {
      const width = rpx2px(78 * this.scaleRate)/2
      const height = rpx2px(160 * this.scaleRate)/2
      
      this.rotateDraw(deg)
      this.ctx.drawImage(this.hourPointerDom, -width/2, -height*1.5/2, width, height)
      this.rotateDraw(-deg)
    }

    this.drawMinute = (deg = 0) => {
      const width = rpx2px(37 * this.scaleRate)/1.8
      const height = rpx2px(332 * this.scaleRate)/1.8

      this.rotateDraw(deg)
      this.ctx.drawImage(this.minutePointerDom, -width/2, -height*1.5/2, width, height)
      this.rotateDraw(-deg)
    }
  }

  const clockInst = new Clock()
  clockInst.init().then(() => {
    // clockInst.start()
    clockInst.drawTime()
    clockInst.refreshRandomTime()
  })



})();
