import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from 'livekit-client';
import { Phone, Video, VideoOff, Mic, MicOff, X, PhoneOff } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

/* ─── helpers ─── */
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const avatar = (u) => u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.username}`;

/* ────────────────────────────────────────────────────────────────────────────
   CallModal
   Props:
     state      : 'idle' | 'outgoing' | 'incoming' | 'connected'
     callType   : 'audio' | 'video'
     roomName   : string   (LiveKit room name)
     other      : { _id, username, nickname, avatar }
     localUser  : current logged-in user object
     onEnd      : () => void   — tear down and go idle
     onAccept   : () => void   — callee accepts
     onReject   : () => void   — callee rejects
────────────────────────────────────────────────────────────────────────────── */
const CallModal = ({ state, callType, roomName, other, localUser, onEnd, onAccept, onReject }) => {
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [localTracksPub, setLocalTracksPub] = useState(false);

  /* ── duration timer ── */
  useEffect(() => {
    if (state !== 'connected') { setDuration(0); return; }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  /* ── connect to LiveKit room when state becomes 'connected' ── */
  useEffect(() => {
    if (state !== 'connected' || !roomName) return;

    let room;
    let localAudio;
    let localVideo;
    let cancelled = false;

    const connect = async () => {
      try {
        const { data } = await axiosInstance.post('/livekit/token', { roomName });
        if (cancelled) return;

        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        /* remote participant events */
        room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
          setRemoteConnected(true);
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
          setRemoteConnected(false);
          onEnd?.();
        });

        await room.connect(data.url, data.token);
        if (cancelled) { room.disconnect(); return; }

        /* publish local audio */
        localAudio = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
        await room.localParticipant.publishTrack(localAudio);

        /* publish local video if video call */
        if (callType === 'video') {
          localVideo = await createLocalVideoTrack({ resolution: { width: 640, height: 480 } });
          await room.localParticipant.publishTrack(localVideo);
          if (localVideoRef.current) localVideo.attach(localVideoRef.current);
        }

        setLocalTracksPub(true);
      } catch (err) {
        console.error('LiveKit connect error:', err);
        onEnd?.();
      }
    };

    connect();

    return () => {
      cancelled = true;
      localAudio?.stop();
      localVideo?.stop();
      room?.disconnect();
      roomRef.current = null;
      setLocalTracksPub(false);
      setRemoteConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, roomName, callType]);

  /* ── toggle mute ── */
  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const audioTracks = [...room.localParticipant.audioTrackPublications.values()];
    audioTracks.forEach((pub) => {
      if (pub.track) {
        isMuted ? pub.track.unmute() : pub.track.mute();
      }
    });
    setIsMuted((m) => !m);
  }, [isMuted]);

  /* ── toggle camera ── */
  const toggleCam = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const videoTracks = [...room.localParticipant.videoTrackPublications.values()];
    videoTracks.forEach((pub) => {
      if (pub.track) {
        isCamOff ? pub.track.unmute() : pub.track.mute();
      }
    });
    setIsCamOff((c) => !c);
  }, [isCamOff]);

  if (state === 'idle') return null;

  /* ─────────────── INCOMING CALL SCREEN ─────────────── */
  if (state === 'incoming') {
    return (
      <div className="call-overlay" style={overlayStyle}>
        <div style={ambientGlow} />
        <div style={cardStyle}>
          {/* Pulsing avatar */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={pingRing1} />
            <div style={pingRing2} />
            <img src={avatar(other)} alt="" style={avatarLg} />
          </div>
          <p style={callLabelStyle}>
            {callType === 'video' ? '🎥 Incoming Video Call' : '📞 Incoming Voice Call'}
          </p>
          <h2 style={nameStyle}>{other?.nickname || other?.username}</h2>
          <p style={subtitleStyle}>is calling you...</p>

          <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
            {/* Reject */}
            <button onClick={onReject} style={btnRed} title="Decline">
              <PhoneOff size={22} />
            </button>
            {/* Accept */}
            <button onClick={onAccept} style={btnGreen} title="Accept">
              <Phone size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── OUTGOING / CONNECTED SCREEN ─────────────── */
  return (
    <div className="call-overlay" style={overlayStyle}>
      <div style={ambientGlow} />

      <div style={{ ...cardStyle, width: callType === 'video' && state === 'connected' ? 520 : 340 }}>

        {/* Header */}
        <div style={{ marginBottom: 4 }}>
          <p style={callLabelStyle}>
            {callType === 'video' ? '🎥 Video Call' : '🎙️ Voice Call'}
          </p>
          <h2 style={nameStyle}>{other?.nickname || other?.username}</h2>
          <p style={subtitleStyle}>
            {state === 'outgoing'
              ? 'Ringing...'
              : state === 'connected'
              ? remoteConnected ? `Connected · ${fmt(duration)}` : `Joining · ${fmt(duration)}`
              : ''}
          </p>
        </div>

        {/* Video area */}
        {callType === 'video' && state === 'connected' ? (
          <div style={videoWrap}>
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
            />
            {!remoteConnected && (
              <div style={videoPlaceholder}>
                <img src={avatar(other)} alt="" style={{ width: 80, height: 80, borderRadius: 16, opacity: 0.7 }} />
                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10 }}>Waiting for {other?.nickname || other?.username}…</p>
              </div>
            )}
            {/* Local pip */}
            <div style={pipBox}>
              {isCamOff ? (
                <div style={{ ...pipBox, background: '#161622', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'static' }}>
                  <VideoOff size={18} color="#64748b" />
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, transform: 'scaleX(-1)' }} />
              )}
            </div>
          </div>
        ) : (
          /* Audio-only avatar */
          <div style={{ position: 'relative', margin: '24px auto', width: 100 }}>
            {state === 'outgoing' && (
              <>
                <div style={{ ...pingRing1, width: 100, height: 100 }} />
                <div style={{ ...pingRing2, width: 120, height: 120 }} />
              </>
            )}
            <img src={avatar(other)} alt="" style={{ width: 100, height: 100, borderRadius: 24, border: '2px solid rgba(124,109,250,0.4)', position: 'relative', zIndex: 2 }} />
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, justifyContent: 'center' }}>
          {/* Mute */}
          <button
            onClick={toggleMute}
            style={isMuted ? btnIconActive : btnIcon}
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={state !== 'connected'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End call */}
          <button onClick={onEnd} style={btnRed} title="End Call">
            <PhoneOff size={22} />
          </button>

          {/* Camera (video only) */}
          {callType === 'video' && (
            <button
              onClick={toggleCam}
              style={isCamOff ? btnIconActive : btnIcon}
              title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
              disabled={state !== 'connected'}
            >
              {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes callPing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes callFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .call-overlay { animation: callFadeIn 0.25s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
    </div>
  );
};

/* ─── Styles ─── */
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(6,6,10,0.88)', backdropFilter: 'blur(16px)',
  fontFamily: '"Inter", -apple-system, sans-serif',
};

const ambientGlow = {
  position: 'absolute', width: 320, height: 320, borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(124,109,250,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const cardStyle = {
  position: 'relative', zIndex: 1,
  background: 'rgba(17,17,26,0.9)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 24,
  padding: '32px 28px',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  width: 340,
  boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
};

const avatarLg = { width: 96, height: 96, borderRadius: 22, objectFit: 'cover', border: '2px solid rgba(124,109,250,0.4)', position: 'relative', zIndex: 2 };
const callLabelStyle = { fontSize: 11, letterSpacing: 2, color: '#7c6dfa', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'monospace' };
const nameStyle = { margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#ffffff' };
const subtitleStyle = { margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'monospace' };

const pingRing1 = {
  position: 'absolute', top: '50%', left: '50%',
  width: 96, height: 96, borderRadius: '50%',
  border: '1px solid rgba(124,109,250,0.35)',
  animation: 'callPing 1.8s ease-out infinite',
};
const pingRing2 = {
  ...pingRing1,
  border: '1px solid rgba(250,109,155,0.2)',
  animationDelay: '0.7s',
};

const videoWrap = {
  position: 'relative', width: '100%', height: 280,
  background: '#0e0e15', borderRadius: 16, overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.06)',
};

const videoPlaceholder = {
  position: 'absolute', inset: 0, display: 'flex',
  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
};

const pipBox = {
  position: 'absolute', bottom: 10, right: 10,
  width: 80, height: 110, borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  overflow: 'hidden', background: '#0e0e15',
};

const btnBase = {
  width: 52, height: 52, borderRadius: '50%', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'all 0.18s',
};

const btnRed = { ...btnBase, background: '#ef4444', color: '#fff', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' };
const btnGreen = { ...btnBase, background: '#22c55e', color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' };
const btnIcon = { ...btnBase, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' };
const btnIconActive = { ...btnBase, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' };

export default CallModal;
