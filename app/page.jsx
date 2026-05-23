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

    // Функция настройки логики дата-канала
    const setupConnection = (conn) => {
        conn.on('open', () => setConnected(true));
        conn.on('data', (data) => {
            if (data.type === 'PRESS_STATE') {
                setPartnerPressed(data.pressed);
            }
        });
        conn.on('close', () => setConnected(false));
    };

    // 1. Читаем роль из ссылки при первой загрузке
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const partnerRole = urlParams.get('partnerRole');
        if (partnerRole) setRole(partnerRole);
    }, []);

    // 2. Инициализация WebRTC с твоими TURN-серверами Metered
    useEffect(() => {
        if (!role) return;

        let peer = null;

        async function initWebRTC() {
            try {
                // Подтягиваем сервера через твой созданный API-ключ
                const response = await fetch(
                    "https://lovetanya.metered.live/api/v1/turn/credentials?apiKey=0ffab0d2935ee255e62b4274db1ab6adc0c4"
                );
                const iceServers = await response.json();

                peer = new Peer({
                    config: {
                        iceServers: iceServers,
                    },
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

            } catch (error) {
                console.error("Ошибка инициализации TURN серверов:", error);
            }
        }

        initWebRTC();

        return () => {
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [role]);

    // 3. Взрыв сердечек при совместном нажатии
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

    // Обработчики нажатий
    const handlePressStart = () => {
        setMyPressed(true);
        if (connRef.current && connected) {
            connRef.current.send({ type: 'PRESS_STATE', pressed: true });
        }
    };

    const handlePressEnd = () => {
        setMyPressed(false);
        if (connRef.current && connected) {
            connRef.current.send({ type: 'PRESS_STATE', pressed: false });
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink);
        alert('Ссылка скопирована! Отправь её Тане.');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white font-sans overflow-hidden select-none touch-none">
            {!role ? (
                <div className="flex flex-col items-center gap-6 p-4 text-center">
                    <h1 className="text-3xl font-bold tracking-wide">Кто ты?</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setRole('danya')}
                            className="px-8 py-4 bg-blue-600 rounded-2xl font-semibold text-lg active:scale-95 transition-transform"
                        >
                            Даня
                        </button>
                        <button
                            onClick={() => setRole('tanya')}
                            className="px-8 py-4 bg-pink-600 rounded-2xl font-semibold text-lg active:scale-95 transition-transform"
                        >
                            Таня
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-between w-full h-screen py-12 px-6">
                    <div className="text-center z-10">
                        <p className="text-sm text-neutral-400 uppercase tracking-widest">Статус</p>
                        <p className={`text-lg font-semibold mt-1 ${connected ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`}>
                            {connected ? 'Связь установлена' : 'Ожидание подключения...'}
                        </p>
                    </div>

                    {/* Главная кнопка-сердце */}
                    <div className="relative flex items-center justify-center w-full my-auto">
                        <AnimatePresence>
                            {hearts.map((heart) => (
                                <motion.div
                                    key={heart.id}
                                    initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                                    animate={{
                                        x: Math.cos(heart.angle) * heart.distance,
                                        y: Math.sin(heart.angle) * heart.distance,
                                        scale: [0.5, 1.2, 0],
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: heart.delay }}
                                    style={{ position: 'absolute', fontSize: heart.size, pointerEvents: 'none' }}
                                >
                                    ❤️
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <motion.button
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onTouchStart={handlePressStart}
                            onTouchEnd={handlePressEnd}
                            animate={{
                                scale: myPressed ? 0.9 : 1,
                                boxShadow: myPressed || partnerPressed
                                    ? "0 0 60px 20px rgba(236, 72, 153, 0.6)"
                                    : "0 0 20px 0px rgba(0,0,0,0)"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`w-44 h-44 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-colors duration-300 ${
                                partnerPressed ? 'bg-pink-500' : 'bg-neutral-900 border-2 border-neutral-800'
                            }`}
                        >
                            ❤️
                        </motion.button>
                    </div>

                    {/* Кнопка отправки ссылки */}
                    {!connected && shareLink && (
                        <button
                            onClick={copyLink}
                            className="z-10 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all text-neutral-300"
                        >
                            🔗 Скопировать ссылку для Тани
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}