'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer } from 'peerjs';

export default function Home() {
    const [role, setRole] = useState(null);
    const [myPressed, setMyPressed] = useState(false);
    const [partnerPressed, setPartnerPressed] = useState(false);

    const [myPeerId, setMyPeerId] = useState('');
    const [connected, setConnected] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [hearts, setHearts] = useState([]);

    const peerRef = useRef(null);
    const connRef = useRef(null);

    // Инициализация WebRTC
    useEffect(() => {
        if (!role) return;

        const peer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
            setMyPeerId(id);
            const baseLink = `${window.location.origin}${window.location.pathname}`;
            setShareLink(`${baseLink}?room=${id}&partnerRole=${role === 'danya' ? 'tanya' : 'danya'}`);

            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room');
            if (roomId) {
                const conn = peer.connect(roomId);
                connRef.current = conn;
                setupConnection(conn);
            }
        });

        peer.on('connection', (conn) => {
            connRef.current = conn;
            setupConnection(conn);
        });

        return () => {
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [role]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const partnerRole = urlParams.get('partnerRole');
        if (partnerRole) setRole(partnerRole);
    }, []);

    // Взрыв сердечек (35 штук, крупные, летят дальше)
    useEffect(() => {
        if (myPressed && partnerPressed) {
            const newHearts = Array.from({ length: 35 }).map((_, i) => ({
                id: Date.now() + i,
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * 280 + 140,
                size: Math.random() * 35 + 25,
                delay: Math.random() * 0.15,
            }));
            setHearts((prev) => [...prev, ...newHearts]);

            setTimeout(() => {
                setHearts((prev) => prev.filter(h => !newHearts.includes(h)));
            }, 1300);
        }
    }, [myPressed, partnerPressed]);

    const setupConnection = (conn) => {
        conn.on('open', () => setConnected(true));
        conn.on('data', (data) => {
            if (data.type === 'PRESS_STATE') {
                setPartnerPressed(data.pressed);
            }
        });
        conn.on('close', () => {
            setConnected(false);
            setPartnerPressed(false);
        });
    };

    const sendState = (pressed) => {
        setMyPressed(pressed);
        if (connRef.current && connRef.current.open) {
            connRef.current.send({ type: 'PRESS_STATE', pressed });
        }
    };

    const isDanyaPressed = role === 'danya' ? myPressed : partnerPressed;
    const isTanyaPressed = role === 'tanya' ? myPressed : partnerPressed;
    const isBothPressed = myPressed && partnerPressed;

    // Настройки drop-shadow фильтра прямо для тега img
    let imageFilter = 'grayscale(100%)'; // дефолтная чб картинка

    if (isBothPressed) {
        // Совместное нажатие — мощное розово-красное свечение по контуру
        imageFilter = 'drop-shadow(0 0 20px #f43f5e) drop-shadow(0 0 5px #f43f5e)';
    } else if (isDanyaPressed) {
        // Даня нажал — синее свечение
        imageFilter = 'drop-shadow(0 0 15px #3b82f6) drop-shadow(0 0 4px #3b82f6)';
    } else if (isTanyaPressed) {
        // Таня нажала — розовое свечение
        imageFilter = 'drop-shadow(0 0 15px #ec4899) drop-shadow(0 0 4px #ec4899)';
    }

    // Окно выбора роли
    if (!role) {
        return (
            <div className="h-screen w-screen bg-neutral-50 flex items-center justify-center font-sans">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200 max-w-sm w-full text-center mx-4">
                    <h2 className="text-xl font-light tracking-wide text-neutral-800 mb-6">Кто заходит?</h2>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setRole('danya')}
                            className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all active:scale-95"
                        >
                            Даня
                        </button>
                        <button
                            onClick={() => setRole('tanya')}
                            className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all active:scale-95"
                        >
                            Таня
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className={`h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden select-none transition-colors duration-1000 ${
            isBothPressed ? 'bg-rose-100' : 'bg-white'
        }`}>

            {/* Верхний статус подключения */}
            <div className="absolute top-8 text-center px-4 z-20 font-light tracking-wide text-neutral-400 text-xs uppercase">
                {connected ? (
                    <span className="text-neutral-400 bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100">
            Линия связи активна
          </span>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <span className="animate-pulse">Ожидание подключения...</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareLink);
                                alert('Ссылка скопирована!');
                            }}
                            className="bg-white hover:bg-neutral-50 text-neutral-600 px-4 py-2 rounded-full border border-neutral-200 shadow-sm active:scale-95 transition-all normal-case font-sans text-sm"
                        >
                            Поделиться ссылкой
                        </button>
                    </div>
                )}
            </div>

            {/* Центральная интерактивная зона с твоей картинкой */}
            <div className="relative flex items-center justify-center w-80 h-80">

                <motion.div
                    disabled={!connected}
                    onMouseDown={() => sendState(true)}
                    onMouseUp={() => sendState(false)}
                    onTouchStart={() => sendState(true)}
                    onTouchEnd={() => sendState(false)}
                    animate={{
                        scale: myPressed ? 0.95 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`w-64 h-64 flex items-center justify-center cursor-pointer relative z-10 transition-all duration-300 ${
                        !connected ? 'opacity-20 cursor-not-allowed' : ''
                    }`}
                >
                    {/* ТВОЯ КАРТИНКА (должна лежать в public/hand.png) */}
                    <img
                        src="/hand.png"
                        alt="Hand"
                        style={{ filter: imageFilter }}
                        className="w-full h-full object-contain pointer-events-none transition-all duration-300"
                        onError={(e) => {
                            // Если забыл закинуть картинку, покажет этот фолбек, чтобы код не упал
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<span class="text-8xl select-none">🤚</span>';
                        }}
                    />
                </motion.div>

                {/* Разлетающиеся большие сердца */}
                <AnimatePresence>
                    {hearts.map((heart) => (
                        <motion.div
                            key={heart.id}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 0.1 }}
                            animate={{
                                x: Math.cos(heart.angle) * heart.distance,
                                y: Math.sin(heart.angle) * heart.distance,
                                opacity: 0,
                                scale: [0.4, 1.8, 2.5],
                                rotate: Math.random() * 120 - 60
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.3, ease: 'easeOut', delay: heart.delay }}
                            style={{ position: 'absolute', fontSize: heart.size }}
                            className="pointer-events-none z-0 select-none text-rose-500"
                        >
                            ❤️
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Нижние индикаторы активности */}
            <div className="absolute bottom-8 flex gap-6 text-[10px] uppercase tracking-[0.2em] text-neutral-300 font-sans">
                <span className={isDanyaPressed ? 'text-blue-500 font-semibold' : ''}>Danya</span>
                <span className={isTanyaPressed ? 'text-pink-500 font-semibold' : ''}>Tanya</span>
            </div>

        </main>
    );
}