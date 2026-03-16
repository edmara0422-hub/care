import { useState, useEffect, useRef, useCallback } from 'react'

export type SensorStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'

// ─── Typing rhythm (passive — no permission needed, works on iOS too) ────────
export function useTypingRhythm() {
  const [metrics, setMetrics] = useState<{ burstScore: number; avgInterval: number; variance: number } | null>(null)
  const intervals = useRef<number[]>([])
  const lastKey = useRef(0)
  const lastEvent = useRef(0)

  useEffect(() => {
    const track = () => {
      const now = Date.now()
      // Deduplicar: keydown + input podem disparar juntos no desktop
      if (now - lastEvent.current < 50) return
      lastEvent.current = now
      if (lastKey.current > 0) {
        intervals.current.push(now - lastKey.current)
        if (intervals.current.length > 20) intervals.current.shift()
        if (intervals.current.length >= 5) {
          const avg = intervals.current.reduce((a, b) => a + b, 0) / intervals.current.length
          const variance = intervals.current.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.current.length
          setMetrics({
            burstScore: Math.round(Math.max(0, 100 - Math.min(100, avg / 3))),
            avgInterval: Math.round(avg),
            variance: Math.round(variance),
          })
        }
      }
      lastKey.current = now
    }
    // keydown: teclado físico e desktop
    window.addEventListener('keydown', track)
    // input: teclado virtual iOS/Android (evento borbulha até document)
    document.addEventListener('input', track)
    return () => {
      window.removeEventListener('keydown', track)
      document.removeEventListener('input', track)
    }
  }, [])

  return metrics
}

// ─── Accelerometer (passive once started) ───────────────────────────────────
export function useAccelerometer() {
  const [status, setStatus] = useState<SensorStatus>('idle')
  const [data, setData] = useState<{ x: number; y: number; z: number; agitation: number } | null>(null)
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null)

  const start = useCallback(async () => {
    if (!window.DeviceMotionEvent) { setStatus('unsupported'); return }
    setStatus('requesting')
    const handler = (e: DeviceMotionEvent) => {
      const a = e.acceleration
      if (!a) return
      const x = a.x ?? 0, y = a.y ?? 0, z = a.z ?? 0
      setData({ x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), agitation: Math.min(100, Math.round(Math.sqrt(x*x + y*y + z*z) * 8)) })
      setStatus('active')
    }
    handlerRef.current = handler
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (perm === 'granted') window.addEventListener('devicemotion', handler)
        else setStatus('denied')
      } catch { setStatus('denied') }
    } else {
      window.addEventListener('devicemotion', handler)
      setStatus('active')
    }
  }, [])

  const stop = useCallback(() => {
    if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current)
    handlerRef.current = null
    setStatus('idle')
    setData(null)
  }, [])

  return { status, data, start, stop }
}

// ─── Microphone level (passive bar) ─────────────────────────────────────────
export function useMicLevel() {
  const [status, setStatus] = useState<SensorStatus>('idle')
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()
  const streamRef = useRef<MediaStream>()

  const start = useCallback(async () => {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      setStatus('active')
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setLevel(Math.round(Math.min(100, avg * 2.5)))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { setStatus('denied') }
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('idle')
    setLevel(0)
  }, [])

  return { status, level, start, stop }
}

// ─── Camera rPPG (BPM from green channel) ───────────────────────────────────
export function useCameraRPPG() {
  const [status, setStatus] = useState<SensorStatus>('idle')
  const [bpm, setBpm] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const samplesRef = useRef<number[]>([])
  const timestampsRef = useRef<number[]>([])
  const streamRef = useRef<MediaStream>()

  const start = useCallback(async () => {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setStatus('active')
      const sample = () => {
        const v = videoRef.current, c = canvasRef.current
        if (!v || !c) { animRef.current = requestAnimationFrame(sample); return }
        const ctx = c.getContext('2d')!
        c.width = 40; c.height = 20
        ctx.drawImage(v, 80, 40, 40, 20, 0, 0, 40, 20)
        const d = ctx.getImageData(0, 0, 40, 20).data
        let g = 0
        for (let i = 0; i < d.length; i += 4) g += d[i + 1]
        const now = Date.now()
        samplesRef.current.push(g / (d.length / 4))
        timestampsRef.current.push(now)
        if (samplesRef.current.length > 90) samplesRef.current.shift()
        if (timestampsRef.current.length > 90) timestampsRef.current.shift()
        if (samplesRef.current.length >= 60) {
          const s = samplesRef.current
          const t = timestampsRef.current
          const mean = s.reduce((a, b) => a + b) / s.length
          const std = Math.sqrt(s.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / s.length)
          const threshold = mean + std * 0.25
          let peaks = 0
          for (let i = 1; i < s.length - 1; i++) {
            if (s[i] > threshold && s[i] > s[i-1] && s[i] > s[i+1]) peaks++
          }
          const durationSec = (t[t.length - 1] - t[0]) / 1000
          if (durationSec > 0.5 && peaks > 0) {
            const bpm = Math.round((peaks / durationSec) * 60)
            setBpm(Math.min(150, Math.max(40, bpm)))
          }
        }
        animRef.current = requestAnimationFrame(sample)
      }
      sample()
    } catch { setStatus('denied') }
  }, [])

  const stop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('idle')
    setBpm(null)
  }, [])

  return { status, bpm, videoRef, canvasRef, start, stop }
}
