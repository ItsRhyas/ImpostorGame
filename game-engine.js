import { CONCEPTS } from './data.js';

const STORAGE_KEY = 'impostor-game-save-v1';
const HOLD_MS = 0;
const INTRO_SECONDS = 30;

while (CONCEPTS.length < 200) {
  CONCEPTS.push({
    word: `Concepto ${CONCEPTS.length + 1}`,
    clues: [
      'Pista genérica de apoyo',
      'Segunda pista para orientar',
      'Tercera pista para cerrar'
    ]
  });
}

const state = {
      phase: 'config',
      players: [],
      timeMinutes: 5,
      impostorCount: 1,
      concept: null,
      roles: [],
      revealIndex: 0,
      viewedCount: 0,
      timer: {
        total: 0,
        remaining: 0,
        introRemaining: INTRO_SECONDS,
        interval: null,
        paused: false,
        active: false,
        introActive: false
      },
      startingPlayerId: null,
      selectedVoteId: null,
      voteResultId: null,
      winner: null,
      eliminatedIds: [],
      cachedClueIndex: 0,
      message: ''
    }

    const el = {
      views: {
        config: document.getElementById('view-config'),
        reveal: document.getElementById('view-reveal'),
        game: document.getElementById('view-game'),
        voting: document.getElementById('view-voting'),
        results: document.getElementById('view-results')
      },
      playerName: document.getElementById('playerName'),
      addPlayerBtn: document.getElementById('addPlayerBtn'),
      playersList: document.getElementById('playersList'),
      gameMinutes: document.getElementById('gameMinutes'),
      gameMinutesLabel: document.getElementById('gameMinutesLabel'),
      impostorsCount: document.getElementById('impostorsCount'),
      configNotice: document.getElementById('configNotice'),
      startGameBtn: document.getElementById('startGameBtn'),
      resetStorageBtn: document.getElementById('resetStorageBtn'),
      revealIntro: document.getElementById('revealIntro'),
      revealCounter: document.getElementById('revealCounter'),
      revealPlayerName: document.getElementById('revealPlayerName'),
      holdZone: document.getElementById('holdZone'),
      roleCardDisplay: document.getElementById('roleCardDisplay'),
      nextRevealBtn: document.getElementById('nextRevealBtn'),
      abortToConfigBtn: document.getElementById('abortToConfigBtn'),
      gamePhaseNotice: document.getElementById('gamePhaseNotice'),
      timerRing: document.getElementById('timerRing'),
      startingPlayerBadge: document.getElementById('startingPlayerBadge'),
      aliveBadge: document.getElementById('aliveBadge'),
      impostorBadge: document.getElementById('impostorBadge'),
      currentClue: document.getElementById('currentClue'),
      goVotingBtn: document.getElementById('goVotingBtn'),
      pauseTimerBtn: document.getElementById('pauseTimerBtn'),
      voteGrid: document.getElementById('voteGrid'),
      confirmVoteBtn: document.getElementById('confirmVoteBtn'),
      skipVoteBtn: document.getElementById('skipVoteBtn'),
      winnerBadge: document.getElementById('winnerBadge'),
      resultTitle: document.getElementById('resultTitle'),
      resultMessage: document.getElementById('resultMessage'),
      resultDetails: document.getElementById('resultDetails'),
      resultVoteInfo: document.getElementById('resultVoteInfo'),
      playAgainBtn: document.getElementById('playAgainBtn'),
      backToConfigBtn: document.getElementById('backToConfigBtn')
    }

    class GameEngine {
      constructor() {
        this.load()
        this.syncUI()
      }

      save() {
        const payload = {
          players: state.players,
          timeMinutes: state.timeMinutes,
          impostorCount: state.impostorCount
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      }

      load() {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            state.players = Array.isArray(parsed.players) && parsed.players.length ? parsed.players : this.defaultPlayers()
            state.timeMinutes = Number(parsed.timeMinutes) || 5
            state.impostorCount = Number(parsed.impostorCount) || 1
            return
          } catch (_) {}
        }
        state.players = this.defaultPlayers()
        state.timeMinutes = 5
        state.impostorCount = 1
        this.save()
      }

      defaultPlayers() {
        return [
          { id: crypto.randomUUID(), name: 'Jugador 1' },
          { id: crypto.randomUUID(), name: 'Jugador 2' },
          { id: crypto.randomUUID(), name: 'Jugador 3' }
        ]
      }

      syncUI() {
        el.gameMinutes.value = state.timeMinutes
        el.gameMinutesLabel.textContent = state.timeMinutes
        this.renderPlayers()
        this.renderImpostorOptions()
        this.validateConfig()
      }

      setPhase(phase) {
        state.phase = phase
        Object.values(el.views).forEach(view => view.classList.remove('active'))
        el.views[phase].classList.add('active')
      }

      renderPlayers() {
        el.playersList.innerHTML = ''
        state.players.forEach((player, index) => {
          const item = document.createElement('div')
          item.className = 'player-item'
          item.innerHTML = `
            <div class="field" style="margin:0">
              <label class="small">Jugador ${index + 1}</label>
              <input type="text" value="${escapeHtml(player.name)}" data-player-name="${player.id}" maxlength="18" />
            </div>
            <div class="mini">
              <span class="badge">#${index + 1}</span>
              <button class="btn ghost" type="button" data-remove-player="${player.id}">Eliminar</button>
            </div>
          `
          el.playersList.appendChild(item)
        })
      }

      renderImpostorOptions() {
        const maxImpostors = this.maxImpostors()
        el.impostorsCount.innerHTML = ''
        for (let i = 0; i <= maxImpostors; i++) {
          const option = document.createElement('option')
          option.value = String(i)
          option.textContent = `${i} impostor${i === 1 ? '' : 'es'}`
          el.impostorsCount.appendChild(option)
        }
        state.impostorCount = clamp(state.impostorCount, 0, maxImpostors)
        el.impostorsCount.value = String(state.impostorCount)
      }

      maxImpostors() {
        return Math.max(0, Math.floor((state.players.length - 1) / 2))
      }

      validateConfig() {
        const validNames = state.players.filter(p => p.name.trim()).length
        const canHaveImpostors = this.maxImpostors() >= 1
        const startAllowed = validNames >= 3 && state.impostorCount >= 1 && canHaveImpostors
        el.startGameBtn.disabled = !startAllowed
        el.configNotice.innerHTML = canHaveImpostors
          ? `<strong>Listo:</strong> ${state.players.length} jugadores, máximo ${this.maxImpostors()} impostor${this.maxImpostors() === 1 ? '' : 'es'}.`
          : `<strong>Faltan jugadores:</strong> necesitas al menos 3 jugadores para jugar.`
      }

      addPlayer(name) {
        const trimmed = name.trim()
        if (!trimmed) return
        state.players.push({ id: crypto.randomUUID(), name: trimmed })
        this.save()
        this.syncUI()
      }

      updatePlayer(id, name) {
        const player = state.players.find(p => p.id === id)
        if (!player) return
        player.name = name.trim() || player.name
        this.save()
        this.validateConfig()
      }

      removePlayer(id) {
        if (state.players.length <= 3) {
          toast('Mínimo 3 jugadores.')
          return
        }
        state.players = state.players.filter(p => p.id !== id)
        if (state.impostorCount > this.maxImpostors()) state.impostorCount = this.maxImpostors()
        this.save()
        this.syncUI()
      }

      startGame() {
        if (state.players.length < 3 || state.impostorCount < 1 || this.maxImpostors() < 1) {
          toast('Agrega al menos 3 jugadores para jugar.')
          return
        }
        state.concept = randomItem(CONCEPTS)
        const shuffled = shuffle([...state.players])
        const impostors = new Set(shuffled.slice(0, state.impostorCount).map(p => p.id))
        state.roles = state.players.map(player => ({
          ...player,
          role: impostors.has(player.id) ? 'impostor' : 'civil',
          clue: impostors.has(player.id) ? pickOne(state.concept.clues) : state.concept.word,
          viewed: false,
          alive: true
        }))
        state.revealIndex = 0
        state.viewedCount = 0
        state.eliminatedIds = []
        state.selectedVoteId = null
        state.voteResultId = null
        state.winner = null
        state.cachedClueIndex = 0
        state.timer.total = state.timeMinutes * 60
        state.timer.remaining = state.timer.total
        state.timer.introRemaining = INTRO_SECONDS
        state.timer.active = false
        state.timer.paused = false
        state.timer.introActive = false
        state.startingPlayerId = null
        this.setPhase('reveal')
        this.renderReveal()
      }

      renderReveal() {
        const player = state.roles[state.revealIndex]
        el.revealCounter.textContent = `${state.revealIndex + 1} / ${state.roles.length}`
        el.revealPlayerName.textContent = player ? player.name : 'Todos listos'
        el.nextRevealBtn.disabled = true
        el.roleCardDisplay.innerHTML = ''
        el.holdZone.textContent = 'Mantén presionado para revelar'
        el.holdZone.classList.remove('revealed')
        el.revealIntro.textContent = player
          ? `Turno de ${player.name}. Mantén presionado para ver su rol.`
          : 'Toda la mesa ya vio su rol.'
      }

      revealCurrentPlayer() {
        const player = state.roles[state.revealIndex]
        if (!player) return
        // Only count the first time they view their role
        if (!player.viewed) {
          player.viewed = true
          state.viewedCount += 1
        }
        const isImpostor = player.role === 'impostor'
        el.roleCardDisplay.innerHTML = `
          <div class="role-box" style="width:100%;margin:0">
            <div class="badge ${isImpostor ? 'warn' : 'ok'}">${isImpostor ? 'Impostor' : 'Civil'}</div>
            <div class="role-big ${isImpostor ? 'impostor' : 'civil'}">${isImpostor ? 'PISTA' : 'PALABRA'}</div>
            <h3>${isImpostor ? player.clue : state.concept.word}</h3>
            <p class="small">${isImpostor ? 'Solo una pista. No digas nada.' : 'Tu misión: proteger la palabra.'}</p>
          </div>
        `
        el.holdZone.classList.add('revealed')
        el.holdZone.textContent = 'Soltar para ocultar'
        el.nextRevealBtn.disabled = false
        pulse()
        this.validateRevealProgress()
      }

      validateRevealProgress() {
        el.revealCounter.textContent = `${state.viewedCount} / ${state.roles.length}`
        if (state.viewedCount >= state.roles.length) {
          el.nextRevealBtn.textContent = 'Iniciar partida'
        } else {
          el.nextRevealBtn.textContent = 'Siguiente jugador'
        }
      }

      nextReveal() {
        state.revealIndex += 1
        if (state.revealIndex >= state.roles.length) {
          this.startIntroPhase()
          return
        }
        this.renderReveal()
      }

      startIntroPhase() {
        this.setPhase('game')
        state.timer.introActive = true
        state.timer.active = false
        state.timer.paused = false
        state.startingPlayerId = pickOne(state.players).id
        el.startingPlayerBadge.textContent = `Jugador inicial: ${this.playerNameById(state.startingPlayerId)}`
        el.currentClue.textContent = 'La partida comienza en breve.'
        el.gamePhaseNotice.textContent = `Preparación: ${INTRO_SECONDS} segundos para que la mesa se organice.`
        this.updateHUD()
        this.tickIntro()
        this.startTicker()
      }

      startTicker() {
        clearInterval(state.timer.interval)
        state.timer.interval = setInterval(() => this.tick(), 1000)
      }

      tick() {
        if (state.timer.introActive) {
          this.tickIntro()
          return
        }
        if (!state.timer.active || state.timer.paused) return
        state.timer.remaining = Math.max(0, state.timer.remaining - 1)
        this.updateHUD()
        if (state.timer.remaining <= 0) {
          this.finish('impostor', 'El tiempo se agotó.')
        }
      }

      tickIntro() {
        if (!state.timer.introActive) return
        if (state.timer.introRemaining <= 0) {
          state.timer.introActive = false
          state.timer.active = true
          el.gamePhaseNotice.textContent = 'Juego activo: discute, investiga y acusa.'
          el.currentClue.textContent = this.nextClue()
          this.updateHUD()
          return
        }
        el.gamePhaseNotice.textContent = `Jugador inicial: ${this.playerNameById(state.startingPlayerId)} — empieza en ${state.timer.introRemaining}s`
        state.timer.introRemaining -= 1
        this.updateHUD()
      }

      nextClue() {
        state.cachedClueIndex = (state.cachedClueIndex + 1) % state.concept.clues.length
        return state.concept.clues[state.cachedClueIndex]
      }

      updateHUD() {
        const remaining = state.timer.introActive ? state.timer.introRemaining : state.timer.remaining
        el.timerRing.textContent = state.timer.introActive ? `${pad(remaining)}s` : formatTime(remaining)
        const percent = state.timer.total ? ((state.timer.total - state.timer.remaining) / state.timer.total) * 100 : 0
        el.timerRing.style.setProperty('--progress', `${Math.min(100, Math.max(0, percent))}%`)
        el.aliveBadge.textContent = `Vivos: ${state.roles.filter(p => p.alive).length}`
        el.impostorBadge.textContent = `Impostores: ${state.roles.filter(p => p.alive && p.role === 'impostor').length}`
      }

      pauseTimer() {
        if (!state.timer.active) return
        state.timer.paused = !state.timer.paused
        el.pauseTimerBtn.textContent = state.timer.paused ? 'Reanudar' : 'Pausar'
        el.gamePhaseNotice.textContent = state.timer.paused ? 'Partida pausada.' : 'Juego activo: discute, investiga y acusa.'
      }

      openVoting() {
        clearInterval(state.timer.interval)
        state.timer.active = false
        state.timer.introActive = false
        this.setPhase('voting')
        state.selectedVoteId = null
        this.renderVoteGrid()
      }

      resumeGame(message) {
        this.setPhase('game')
        state.timer.active = true
        state.timer.paused = false
        el.pauseTimerBtn.textContent = 'Pausar'
        el.gamePhaseNotice.textContent = message || 'Juego activo: discute, investiga y acusa.'
        this.updateHUD()
        this.startTicker()
      }

      renderVoteGrid() {
        el.voteGrid.innerHTML = '';
        const alivePlayers = state.roles.filter(p => p.alive);
        alivePlayers.forEach(player => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'player-chip';
          btn.textContent = player.name;
          btn.dataset.voteId = player.id;
          btn.addEventListener('click', () => {
            state.selectedVoteId = player.id;
            [...el.voteGrid.querySelectorAll('.player-chip')].forEach(x => x.classList.toggle('selected', x.dataset.voteId === player.id));
            el.confirmVoteBtn.disabled = false;
            pulse();
          });
          el.voteGrid.appendChild(btn);
        });
        el.confirmVoteBtn.disabled = true;
      }

      confirmVote(skip = false) {
        let target = null
        if (!skip) {
          target = state.roles.find(p => p.id === state.selectedVoteId && p.alive)
          if (!target) {
            toast('Selecciona un jugador.')
            return
          }
        }
        if (target) {
          target.alive = false
          state.eliminatedIds.push(target.id)
          state.voteResultId = target.id
        }
        const remainingImpostors = state.roles.filter(p => p.alive && p.role === 'impostor').length
        const remainingCivils = state.roles.filter(p => p.alive && p.role === 'civil').length
        if (remainingImpostors === 0 && state.impostorCount > 0) {
          this.finish('civil', target ? `${target.name} era impostor.` : 'La mesa expulsó al último impostor.')
          return
        }
        if (remainingImpostors >= remainingCivils) {
          this.finish('impostor', 'Los impostores igualaron o superaron a los civiles.')
          return
        }
        this.resumeGame(target ? `Se expulsó a ${target.name}. La partida continúa.` : 'La votación terminó sin expulsión decisiva. La partida continúa.')
      }

      finish(winner, reason) {
        clearInterval(state.timer.interval)
        state.winner = winner
        this.setPhase('results')
        const civils = state.roles.filter(p => p.role === 'civil').length
        const impostors = state.roles.filter(p => p.role === 'impostor')
        const impostorNames = impostors.map(p => p.name).join(', ')
        const alive = state.roles.filter(p => p.alive)
        el.winnerBadge.className = `badge ${winner === 'civil' ? 'ok' : 'danger'}`
        el.winnerBadge.textContent = winner === 'civil' ? 'Victoria civil' : 'Victoria impostora'
        el.resultTitle.textContent = winner === 'civil' ? 'GANARON LOS CIVILES' : 'GANARON LOS IMPOSTORES'
        el.resultTitle.className = `role-big ${winner === 'civil' ? 'civil' : 'impostor'}`
        el.resultMessage.textContent = reason
        el.resultDetails.innerHTML = `
          <strong>Concepto:</strong> ${escapeHtml(state.concept.word)}<br>
          <strong>Impostor${impostors.length > 1 ? 'es' : ''}:</strong> ${impostorNames}<br>
          <strong>Jugadores vivos:</strong> ${alive.map(p => p.name).join(', ') || 'Ninguno'}<br>
          <strong>Civiles:</strong> ${civils} · <strong>Impostores:</strong> ${impostors.length}
        `
        el.resultVoteInfo.textContent = state.voteResultId ? `Última expulsión: ${this.playerNameById(state.voteResultId)}` : 'No hubo expulsión final.'
        pulse(40)
      }

      restart(toConfig = false) {
        clearInterval(state.timer.interval)
        state.phase = 'config'
        state.concept = null
        state.roles = []
        state.selectedVoteId = null
        state.voteResultId = null
        state.winner = null
        state.eliminatedIds = []
        state.timer.active = false
        state.timer.introActive = false
        state.timer.paused = false
        state.timer.remaining = 0
        state.timer.introRemaining = INTRO_SECONDS
        el.pauseTimerBtn.textContent = 'Pausar'
        if (toConfig) this.setPhase('config')
        this.syncUI()
      }

      playerNameById(id) {
        return state.players.find(p => p.id === id)?.name || 'Jugador'
      }

      getCurrentClue() {
        return state.concept?.clues?.[state.cachedClueIndex] || '-'
      }
    }

    const engine = new GameEngine();

// Make engine accessible for debugging
window.engine = engine;

    function escapeHtml(str) {
      return String(str).replace(/[&<>"]+/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]))
    }

    function randomItem(arr) {
      return arr[Math.floor(Math.random() * arr.length)]
    }

    function pickOne(arr) {
      return randomItem(arr)
    }

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }

    function clamp(n, min, max) {
      return Math.min(max, Math.max(min, n))
    }

    function formatTime(totalSeconds) {
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      return `${pad(mins)}:${pad(secs)}`
    }

    function pad(num) {
      return String(num).padStart(2, '0')
    }

    function toast(message) {
      el.configNotice.innerHTML = `<strong>Atención:</strong> ${message}`
    }

    function pulse(duration = 20) {
      try { navigator.vibrate?.(duration) } catch (_) {}
    }

    let holdTimer = null
    let holding = false

    function stopHold() {
      holding = false
      clearTimeout(holdTimer)
      el.holdZone.classList.remove('revealed')
      el.roleCardDisplay.innerHTML = ''
      // Hide the secret info when releasing, but keep "Next player" button enabled
      const player = state.roles[state.revealIndex]
      if (player && player.viewed) {
        // Player already viewed their role - show hidden message
        el.holdZone.textContent = 'Ya viste tu rol. Presiona "Siguiente jugador" para continuar.'
      } else if (player) {
        // Player never completed the hold - restore original message
        el.holdZone.textContent = 'Mantén presionado para revelar'
      }
    }

    el.addPlayerBtn.addEventListener('click', () => {
      engine.addPlayer(el.playerName.value)
      el.playerName.value = ''
      el.playerName.focus()
    })

    el.playerName.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        engine.addPlayer(el.playerName.value)
        el.playerName.value = ''
      }
    })

    el.playersList.addEventListener('input', event => {
      const input = event.target.closest('input[data-player-name]')
      if (!input) return
      engine.updatePlayer(input.dataset.playerName, input.value)
    })

    el.playersList.addEventListener('click', event => {
      const btn = event.target.closest('[data-remove-player]')
      if (!btn) return
      engine.removePlayer(btn.dataset.removePlayer)
    })

    el.gameMinutes.addEventListener('input', () => {
      state.timeMinutes = Number(el.gameMinutes.value)
      el.gameMinutesLabel.textContent = state.timeMinutes
      engine.save()
    })

    el.impostorsCount.addEventListener('change', () => {
      state.impostorCount = Number(el.impostorsCount.value)
      engine.save()
      engine.validateConfig()
    })

    el.startGameBtn.addEventListener('click', () => engine.startGame())
    el.resetStorageBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY)
      state.players = engine.defaultPlayers()
      state.timeMinutes = 5
      state.impostorCount = 1
      engine.save()
      engine.syncUI()
      toast('Guardado eliminado.')
    })

    el.holdZone.addEventListener('pointerdown', event => {
      event.preventDefault()
      if (holding) return
      holding = true
      el.holdZone.classList.add('revealed')
      holdTimer = setTimeout(() => {
        if (!holding) return
        engine.revealCurrentPlayer()
      }, HOLD_MS)
    })

    ;['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(type => {
      el.holdZone.addEventListener(type, stopHold)
    })

    el.nextRevealBtn.addEventListener('click', () => engine.nextReveal())
    el.abortToConfigBtn.addEventListener('click', () => engine.restart(true))
    el.goVotingBtn.addEventListener('click', () => engine.openVoting())
    el.pauseTimerBtn.addEventListener('click', () => engine.pauseTimer())
    el.confirmVoteBtn.addEventListener('click', () => engine.confirmVote(false))
    el.skipVoteBtn.addEventListener('click', () => engine.confirmVote(true))
    el.playAgainBtn.addEventListener('click', () => engine.restart(true))
    el.backToConfigBtn.addEventListener('click', () => engine.restart(true))

    window.addEventListener('beforeunload', () => engine.save())

    engine.setPhase('config')
    engine.updateHUD()
    engine.renderPlayers()
    engine.renderImpostorOptions()
