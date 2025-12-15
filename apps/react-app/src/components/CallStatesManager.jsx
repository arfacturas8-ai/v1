import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Phone, PhoneOff, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react'

// Call states
export const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  ENDED: 'ended'
}

// Call types
export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video',
  SCREEN_SHARE: 'screen_share'
}

// Action types
const ACTION_TYPES = {
  START_CONNECTING: 'START_CONNECTING',
  CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
  CONNECTION_LOST: 'CONNECTION_LOST',
  RECONNECTION_ATTEMPT: 'RECONNECTION_ATTEMPT',
  RECONNECTION_SUCCESS: 'RECONNECTION_SUCCESS',
  RECONNECTION_FAILED: 'RECONNECTION_FAILED',
  START_DISCONNECTING: 'START_DISCONNECTING',
  CALL_ENDED: 'CALL_ENDED',
  CALL_FAILED: 'CALL_FAILED',
  UPDATE_PARTICIPANTS: 'UPDATE_PARTICIPANTS',
  UPDATE_QUALITY: 'UPDATE_QUALITY',
  SET_CALL_TYPE: 'SET_CALL_TYPE',
  UPDATE_DURATION: 'UPDATE_DURATION'
}

// Initial state
const initialState = {
  state: CALL_STATES.IDLE,
  callType: null,
  participants: [],
  startTime: null,
  duration: 0,
  connectionQuality: 'good',
  reconnectionAttempts: 0,
  maxReconnectionAttempts: 5,
  error: null,
  isHost: false,
  roomId: null
}

// Reducer
function callStateReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.START_CONNECTING:
      return {
        ...state,
        state: CALL_STATES.CONNECTING,
        callType: action.payload.callType,
        roomId: action.payload.roomId,
        isHost: action.payload.isHost || false,
        error: null,
        reconnectionAttempts: 0
      }

    case ACTION_TYPES.CONNECTION_ESTABLISHED:
      return {
        ...state,
        state: CALL_STATES.CONNECTED,
        startTime: action.payload.startTime || Date.now(),
        participants: action.payload.participants || [],
        error: null,
        reconnectionAttempts: 0
      }

    case ACTION_TYPES.CONNECTION_LOST:
      return {
        ...state,
        state: CALL_STATES.RECONNECTING,
        connectionQuality: 'poor',
        error: action.payload.error
      }

    case ACTION_TYPES.RECONNECTION_ATTEMPT:
      return {
        ...state,
        reconnectionAttempts: state.reconnectionAttempts + 1
      }

    case ACTION_TYPES.RECONNECTION_SUCCESS:
      return {
        ...state,
        state: CALL_STATES.CONNECTED,
        connectionQuality: 'good',
        error: null,
        reconnectionAttempts: 0
      }

    case ACTION_TYPES.RECONNECTION_FAILED:
      return {
        ...state,
        state: state.reconnectionAttempts >= state.maxReconnectionAttempts 
          ? CALL_STATES.FAILED 
          : CALL_STATES.RECONNECTING,
        error: action.payload.error
      }

    case ACTION_TYPES.START_DISCONNECTING:
      return {
        ...state,
        state: CALL_STATES.DISCONNECTING
      }

    case ACTION_TYPES.CALL_ENDED:
      return {
        ...initialState,
        state: CALL_STATES.ENDED,
        duration: state.duration
      }

    case ACTION_TYPES.CALL_FAILED:
      return {
        ...initialState,
        state: CALL_STATES.FAILED,
        error: action.payload.error
      }

    case ACTION_TYPES.UPDATE_PARTICIPANTS:
      return {
        ...state,
        participants: action.payload.participants
      }

    case ACTION_TYPES.UPDATE_QUALITY:
      return {
        ...state,
        connectionQuality: action.payload.quality
      }

    case ACTION_TYPES.SET_CALL_TYPE:
      return {
        ...state,
        callType: action.payload.callType
      }

    case ACTION_TYPES.UPDATE_DURATION:
      return {
        ...state,
        duration: action.payload.duration
      }

    default:
      return state
  }
}

// Context
const CallStatesContext = createContext()

// Provider component
export function CallStatesProvider({ children }) {
  const [state, dispatch] = useReducer(callStateReducer, initialState)

  // Auto-update duration when connected
  useEffect(() => {
    let interval = null
    
    if (state.state === CALL_STATES.CONNECTED && state.startTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - state.startTime) / 1000)
        dispatch({
          type: ACTION_TYPES.UPDATE_DURATION,
          payload: { duration }
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [state.state, state.startTime])

  // Actions
  const actions = {
    startCall: (callType, roomId, isHost = false) => {
      dispatch({
        type: ACTION_TYPES.START_CONNECTING,
        payload: { callType, roomId, isHost }
      })
    },

    connectionEstablished: (participants = [], startTime = null) => {
      dispatch({
        type: ACTION_TYPES.CONNECTION_ESTABLISHED,
        payload: { participants, startTime }
      })
    },

    connectionLost: (error = null) => {
      dispatch({
        type: ACTION_TYPES.CONNECTION_LOST,
        payload: { error }
      })
    },

    attemptReconnection: () => {
      dispatch({
        type: ACTION_TYPES.RECONNECTION_ATTEMPT
      })
    },

    reconnectionSuccess: () => {
      dispatch({
        type: ACTION_TYPES.RECONNECTION_SUCCESS
      })
    },

    reconnectionFailed: (error = null) => {
      dispatch({
        type: ACTION_TYPES.RECONNECTION_FAILED,
        payload: { error }
      })
    },

    endCall: () => {
      dispatch({
        type: ACTION_TYPES.START_DISCONNECTING
      })
      // Simulate disconnection delay
      setTimeout(() => {
        dispatch({
          type: ACTION_TYPES.CALL_ENDED
        })
      }, 1000)
    },

    callFailed: (error) => {
      dispatch({
        type: ACTION_TYPES.CALL_FAILED,
        payload: { error }
      })
    },

    updateParticipants: (participants) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_PARTICIPANTS,
        payload: { participants }
      })
    },

    updateConnectionQuality: (quality) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_QUALITY,
        payload: { quality }
      })
    },

    setCallType: (callType) => {
      dispatch({
        type: ACTION_TYPES.SET_CALL_TYPE,
        payload: { callType }
      })
    }
  }

  const value = {
    ...state,
    actions,
    // Computed properties
    isActive: [CALL_STATES.CONNECTING, CALL_STATES.CONNECTED, CALL_STATES.RECONNECTING].includes(state.state),
    isConnected: state.state === CALL_STATES.CONNECTED,
    isConnecting: state.state === CALL_STATES.CONNECTING,
    isReconnecting: state.state === CALL_STATES.RECONNECTING,
    isDisconnecting: state.state === CALL_STATES.DISCONNECTING,
    hasError: state.error !== null,
    shouldShowReconnecting: state.state === CALL_STATES.RECONNECTING,
    canReconnect: state.reconnectionAttempts < state.maxReconnectionAttempts
  }

  return (
    <CallStatesContext.Provider value={value}>
      {children}
    </CallStatesContext.Provider>
  )
}

// Hook to use call states
export function useCallStates() {
  const context = useContext(CallStatesContext)
  if (!context) {
    throw new Error('useCallStates must be used within a CallStatesProvider')
  }
  return context
}

// Call State Indicator Component
export function CallStateIndicator({ compact = false, showDetails = false }) {
  const callState = useCallStates()

  const getStateInfo = () => {
    switch (callState.state) {
      case CALL_STATES.IDLE:
        return {
          icon: Phone,
          color: 'text-white/40',
          bgColor: 'bg-white/5',
          label: 'Ready',
          description: 'Ready to make calls'
        }
      case CALL_STATES.CONNECTING:
        return {
          icon: Loader2,
          color: 'text-blue-400',
          bgColor: 'bg-[#58a6ff]/20',
          label: 'Connecting...',
          description: 'Establishing connection',
          animate: ''
        }
      case CALL_STATES.CONNECTED:
        return {
          icon: Phone,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          label: 'Connected',
          description: `Call active • ${callState.participants.length} participants`
        }
      case CALL_STATES.RECONNECTING:
        return {
          icon: WifiOff,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          label: 'Reconnecting...',
          description: `Attempt ${callState.reconnectionAttempts}/${callState.maxReconnectionAttempts}`,
          animate: ''
        }
      case CALL_STATES.DISCONNECTING:
        return {
          icon: PhoneOff,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          label: 'Ending call...',
          description: 'Disconnecting from call'
        }
      case CALL_STATES.FAILED:
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          label: 'Call failed',
          description: callState.error?.message || 'Connection failed'
        }
      case CALL_STATES.ENDED:
        return {
          icon: PhoneOff,
          color: 'text-white/60',
          bgColor: 'bg-white/10',
          label: 'Call ended',
          description: `Duration: ${Math.floor(callState.duration / 60)}m ${callState.duration % 60}s`
        }
      default:
        return {
          icon: Phone,
          color: 'text-white/40',
          bgColor: 'bg-white/5',
          label: 'Unknown',
          description: 'Unknown state'
        }
    }
  }

  const stateInfo = getStateInfo()
  const IconComponent = stateInfo.icon

  if (compact) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)'
}}>
        <IconComponent 
          size={12} 
          className={`${stateInfo.color} ${stateInfo.animate || ''}`} 
        />
        <span style={{
  fontWeight: '500'
}}>
          {stateInfo.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
          <IconComponent 
            size={16} 
            className={`${stateInfo.color} ${stateInfo.animate || ''}`} 
          />
        </div>
        <div style={{
  flex: '1'
}}>
          <div style={{
  fontWeight: '500'
}}>
            {stateInfo.label}
          </div>
          {showDetails && (
            <div style={{
  color: '#ffffff'
}}>
              {stateInfo.description}
            </div>
          )}
        </div>
      </div>
      
      {callState.shouldShowReconnecting && (
        <div className="mt-2">
          <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '4px'
}}>
            <div 
              style={{
  height: '4px',
  borderRadius: '50%'
}}
              style={{ 
                width: `${(callState.reconnectionAttempts / callState.maxReconnectionAttempts) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}



export default CallStatesProvider