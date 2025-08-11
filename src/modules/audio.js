export class AudioManager {
  constructor(tracks) {
    this.enabled = false
    this.sfxEnabled = true
    this.tracks = (tracks || []).map((t) => ({ ...t, el: null }))
    this.current = null
    this.currentId = null
    this.volume = 0.6
    this._actx = null
    try {
      const s = localStorage.getItem('sfx')
      if (s === '0') this.sfxEnabled = false
      const me = localStorage.getItem('musicEnabled')
      if (me === '1') this.enabled = true
    } catch {}
  }

  setEnabled(on) {
    this.enabled = on
    try { localStorage.setItem('musicEnabled', on ? '1' : '0') } catch {}
    if (!on) this.stop()
    else if (this.currentId) this.play(this.currentId)
  }

  setSfxEnabled(on) {
    this.sfxEnabled = !!on
    try { localStorage.setItem('sfx', this.sfxEnabled ? '1' : '0') } catch {}
  }

  setVolume(v) {
    const clamped = Math.max(0, Math.min(1, Number(v) || 0))
    this.volume = clamped
    for (const t of this.tracks) if (t.el) t.el.volume = clamped
    if (this.current) this.current.volume = clamped
    try { localStorage.setItem('volume', String(Math.round(clamped * 100))) } catch {}
  }

  getMusicTracks() {
    return this.tracks.filter((t) => t.type === 'music')
  }

  getCurrentTrackId() {
    return this.currentId
  }

  setCurrentId(id) {
    this.currentId = id
    try { localStorage.setItem('trackId', id) } catch {}
  }

  async ensureLoaded(track) {
    if (track.el) return track.el
    const audio = new Audio(track.src)
    audio.loop = track.type === 'music'
    audio.preload = this.enabled ? 'auto' : 'metadata'
    audio.volume = this.volume
    track.el = audio
    return audio
  }

  async playRandomBgm() {
    const mus = this.getMusicTracks()
    if (mus.length === 0) return
    const pick = mus[Math.floor(Math.random() * mus.length)]
    if (!this.enabled) {
      this.setCurrentId(pick.id)
      return
    }
    await this.play(pick.id)
  }

  async play(id) {
    const track = this.tracks.find((t) => t.id === id)
    if (!track) return
    this.currentId = id
    if (!this.enabled) {
      try { localStorage.setItem('trackId', id) } catch {}
      return
    }
    await this.ensureLoaded(track)
    this.stop()
    this.current = track.el
    this.current.volume = this.volume
    if (this.enabled) {
      try { await this.current.play() } catch {}
    }
    try { localStorage.setItem('trackId', id) } catch {}
  }

  async nextTrack() {
    const mus = this.getMusicTracks()
    if (mus.length === 0) return
    const idx = Math.max(0, mus.findIndex((t) => t.id === this.currentId))
    const next = mus[(idx + 1) % mus.length]
    await this.play(next.id)
  }

  async prevTrack() {
    const mus = this.getMusicTracks()
    if (mus.length === 0) return
    const idx = Math.max(0, mus.findIndex((t) => t.id === this.currentId))
    const prev = mus[(idx - 1 + mus.length) % mus.length]
    await this.play(prev.id)
  }

  stop() {
    if (this.current) {
      this.current.pause()
      this.current.currentTime = 0
      this.current = null
    }
  }

  playSfx(type) {
    if (!this.sfxEnabled) return
    try {
      if (!this._actx) this._actx = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._actx
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const now = ctx.currentTime
      const vol = Math.min(0.2, this.volume)
      let freq = 220
      if (type === 'merge') freq = 660
      else if (type === 'spawn') freq = 440
      else if (type === 'move') freq = 300
      o.type = 'sine'
      o.frequency.setValueAtTime(freq, now)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(vol, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      o.connect(g).connect(ctx.destination)
      o.start(now)
      o.stop(now + 0.13)
    } catch {}
  }
}