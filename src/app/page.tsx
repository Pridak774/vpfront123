"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const BACKEND_URL = "https://vpback.onrender.com";

// Add Poll type for poll state
interface Poll {
  id: number;
  title: string;
  question: string;
  source: string;
  date: string;
  options: any[];
  results: Array<{
    id: number;
    candidate: string;
    percentage: number;
    highlighted?: boolean;
    votes: number;
  }>;
  totalVotes: number;
  averageRating: number;
  expireDate: number;
}

export default function Home() {
  // Wallet state
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [txMessage, setTxMessage] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [loginKey, setLoginKey] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- React state pentru PONTA AI ---
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Intro animation state
  const [showIntro, setShowIntro] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Registration handler: only send { username }
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Te rugăm să introduci un username valid.");
      return;
    }
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.success) {
      setRegistered(true);
      setError("");
      setTxMessage("Înregistrare și airdrop reușite!");
      setWalletInfo({ address: data.address, privateKey: data.privateKey });
      fetchBalance(username);
    } else {
      setError(data.message);
      if (data.address && data.privateKey) {
        setWalletInfo({ address: data.address, privateKey: data.privateKey });
      }
    }
  };

  // Login with private key
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginKey.trim()) {
      setLoginError("Introdu cheia privată pentru acces la portofel.");
      return;
    const data = await res.json();
    if (data.success) {
      setWalletInfo({ address: data.publicKey, privateKey: loginKey });
      // Set username based on address (if exists in users list)
      const foundUser = users.find((u) => u.address === data.publicKey);
      setUsername(foundUser ? foundUser.username : data.publicKey);
      setRegistered(true);
      fetchBalance(data.publicKey);
    } else {
      setLoginError("Cheie privată invalidă sau portofel inexistent.");
    }
  };

  // Mining
  const handleMine = async () => {
    const miner = walletInfo?.address ?? username;
    if (!miner) return;
    const res = await fetch(`${BACKEND_URL}/mine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miner }),
    });
    const data = await res.json();
    setTxMessage(data.message);
    fetchBalance(miner);
  };

  // Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !transferTo || !transferAmount) return;
    const res = await fetch(`${BACKEND_URL}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: username,
        to: transferTo,
        amount: Number(transferAmount),
      }),
    });
    const data = await res.json();
    setTxMessage(data.message);
    setTransferTo("");
    setTransferAmount("");
    fetchBalance(username);
  };

  // Fetch balance
  const fetchBalance = async (user: string) => {
    const res = await fetch(`${BACKEND_URL}/balance/${user}`);
    const data = await res.json();
    if (data.success) setBalance(data.balance);
    else setBalance(null);
  };

  // Auto-fetch balance after registration
  useEffect(() => {
    if (registered && username) fetchBalance(username);
  }, [registered, username]);

  // --- Poll State and Logic Restoration ---
  const [polls, setPolls] = useState<Poll[]>([]);

  // --- Lista utilizatori blockchain ---
  const [users, setUsers] = useState<
    { username: string; address: string; registeredAt: number }[]
  >([]);
  useEffect(() => {
    fetch(`${BACKEND_URL}/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      });
  }, []);

  // Load saved poll votes and initialize polls
  useEffect(() => {
    // Sociopol poll data for display
    const initialPolls: Poll[] = [
      {
        id: 1,
        title:
          "Sondaj Sociopol: Cine sunt candidații care ar intra în turul 2 la prezidențiale 2025",
        question: "Intenția de vot pentru funcția de Președinte al României",
        source: "Sociopol",
        date: "27 aprilie 2025",
        options: [],
        results: [
          { id: 1, candidate: "George Simion", percentage: 35, votes: 0 },
          {
            id: 2,
            candidate: "Victor Ponta",
            percentage: 23,
            highlighted: true,
            votes: 0,
          },
          { id: 3, candidate: "Crin Antonescu", percentage: 17, votes: 0 },
          { id: 4, candidate: "Nicușor Dan", percentage: 16, votes: 0 },
          { id: 5, candidate: "Elena Lasconi", percentage: 8, votes: 0 },
          { id: 6, candidate: "Alți candidați", percentage: 1, votes: 0 },
        ],
        totalVotes: 0,
        averageRating: 0,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week from now
      },
    ];
    const savedPolls = localStorage.getItem("ponta_polls");
    // Remove the try/catch block, just setPolls(initialPolls) if parsing fails
    if (savedPolls) {
      let parsedPolls: Poll[] | null = null;
      try {
        parsedPolls = JSON.parse(savedPolls);
      } catch {
        // ignore
      }
      setPolls(parsedPolls ?? initialPolls);
    } else {
      setPolls(initialPolls);
    }
  }, []);

  // Add this function inside your Home component to handle client-side only rendering
  const ClientOnly = ({ children }: { children: React.ReactNode }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return (
        <div className="animate-pulse bg-black bg-opacity-30 h-64 w-full rounded-xl"></div>
      );
    }

    return <>{children}</>;
  };

  // Add countdown state and logic at the top of Home
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRound, setCurrentRound] = useState<
    "first" | "second" | "ended"
  >("first");
  const FIRST_ROUND = new Date("2025-05-04T23:59:59+03:00").getTime();
  const SECOND_ROUND = new Date("2025-05-18T23:59:59+03:00").getTime();
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < FIRST_ROUND) {
        setTimeLeft(FIRST_ROUND - now);
        setCurrentRound("first");
      } else if (now < SECOND_ROUND) {
        setTimeLeft(SECOND_ROUND - now);
        setCurrentRound("second");
      } else {
        setTimeLeft(0);
        setCurrentRound("ended");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function getRoundText(currentRound: "first" | "second" | "ended") {
    if (currentRound === "first") return "Primul tur: 4 Mai 2025";
    if (currentRound === "second") return "Al doilea tur: 18 Mai 2025";
    return "Alegerile s-au încheiat!";
  }

  function formatTimeLeft(ms: number) {
    if (ms <= 0) return "Alegerile s-au încheiat!";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days} zile, ${hours} ore, ${minutes} minute, ${seconds} secunde`;
  }

  return (
    <div className="main-ponta-container">
      {/* Legal Banner - Required by law */}
      <div className="bg-white text-black py-3 text-center shadow-md border-b-2 border-[#c00]">
        <div className="font-extrabold text-lg">
          MATERIAL PUBLICITAR POLITIC VICTOR VIOREL PONTA Candidat independent
        </div>
        <div className="text-sm mt-1">
          victorponta25@gmail.com, strada Gina Patrichi nr. 10
        </div>
        <div className="text-sm mt-1">
          CMF 34250002 &nbsp;&nbsp; CPP A1B1C1D1E1
        </div>
      </div>

      {/* Hero Section */}
      <header className="flex flex-col items-center py-12 bg-white shadow-2xl border-b-[12px] border-[#c00] relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="rounded-full overflow-hidden border-8 border-[#c00] w-52 h-52 mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 bg-white">
            <Image
              src="/481125071_1199302274874671_3006654431470991853_n.jpg"
              alt="Victor Viorel Ponta"
              width={208}
              height={208}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <h1 className="text-6xl font-black text-[#c00] mb-2 uppercase tracking-widest drop-shadow-lg text-center">
            Victor Viorel Ponta
          </h1>
          <h2 className="text-2xl font-extrabold text-[#003366] mb-6 uppercase tracking-wider text-center">
            Candidat Independent la Președinția României
          </h2>
          <div className="mb-4 px-6 py-3 bg-[#fff200] text-[#18181b] rounded-md font-black shadow-lg border-4 border-[#c00] text-xl text-center transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
            POZIȚIA 6 PE BULETINUL DE VOT
          </div>
          <p className="text-3xl font-extrabold text-[#003366] bg-[#fff200] px-8 py-3 rounded-md shadow-lg mb-6 uppercase tracking-wider border-4 border-[#c00] transform hover:scale-105 transition-transform duration-300 text-center">
            ROMÂNIA PE PRIMUL LOC
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a
              href="#token"
              className="px-8 py-4 bg-[#c00] text-white rounded-md font-black shadow-lg hover:bg-[#a00] text-lg transition transform hover:translate-y-[-2px] text-center uppercase tracking-wider"
            >
              PONTA Blockchain
            </a>
            <a
              href="#campanie"
              className="px-8 py-4 bg-[#003366] text-white rounded-md font-black shadow-lg hover:bg-[#002244] text-lg transition transform hover:translate-y-[-2px] text-center uppercase tracking-wider"
            >
              Alătură-te acum
            </a>
          </div>
          <div className="mt-8 px-8 py-4 bg-[#003366] text-[#fff200] rounded-md font-black shadow-lg border-4 border-[#c00] text-lg text-center">
            <span className="block text-white text-xl mb-1">
              NUMĂRĂTOAREA INVERSĂ {getRoundText(currentRound)}
            </span>
            <span className="text-3xl">{formatTimeLeft(timeLeft)}</span>
            <span className="block text-white text-sm mt-2">
              {getRoundText("first")}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* About Section */}
          <section
            className="bg-white text-[#18181b] rounded-md shadow-2xl p-8 border-l-8 border-[#003366] transform hover:translate-y-[-5px] transition-transform duration-300"
            id="despre"
          >
            <h3 className="text-3xl font-black text-[#003366] mb-4 uppercase border-b-4 border-[#c00] pb-2">
              Despre Victor Ponta
            </h3>
            <p className="text-[#18181b] text-lg mb-4">
              Victor Viorel Ponta este un lider cu experiență, dedicat
              progresului, unității naționale și valorilor românești. Cu o
              carieră solidă în administrație și politică, Victor Ponta
              candidează independent pentru a pune{" "}
              <span className="font-black text-[#c00]">
                ROMÂNIA PE PRIMUL LOC
              </span>
              !
            </p>
            <ul className="list-disc pl-6 text-base text-[#18181b] mb-4">
              <li>
                <span className="font-bold">
                  Fost Prim-Ministru al României (2012-2015):
                </span>{" "}
                A condus Guvernul României într-o perioadă de stabilitate
                economică și creștere a investițiilor.
              </li>
              <li>
                <span className="font-bold">Experiență parlamentară:</span>{" "}
                Deputat în Parlamentul României din 2004, cu multiple mandate și
                inițiative legislative importante.
              </li>
              <li>
                <span className="font-bold">
                  Ministru al Controlului și Ministru al Justiției:
                </span>{" "}
                Implicat activ în reforme pentru modernizarea administrației și
                a sistemului judiciar.
              </li>
              <li>
                <span className="font-bold">
                  Președinte al Partidului Social Democrat (PSD):
                </span>{" "}
                A condus cel mai mare partid din România, promovând politici de
                coeziune socială și dezvoltare.
              </li>
              <li>
                <span className="font-bold">Educație:</span> Absolvent al
                Facultății de Drept, Universitatea din București. Doctor în
                Drept Penal Internațional.
              </li>
              <li>
                <span className="font-bold">
                  Recunoscut pentru dialog și deschidere:
                </span>{" "}
                A promovat dialogul între instituții, mediul privat și
                societatea civilă.
              </li>
              <li>
                <span className="font-bold">
                  Susținător al digitalizării și inovației:
                </span>{" "}
                A inițiat proiecte pentru modernizarea administrației publice și
                digitalizarea serviciilor pentru cetățeni.
              </li>
              <li>
                <span className="font-bold">Implicare internațională:</span>{" "}
                Reprezentant al României la nivel european și internațional, cu
                relații excelente cu partenerii strategici ai țării.
              </li>
            </ul>
            <p className="text-base text-[#18181b]">
              Victor Ponta crede în{" "}
              <span className="font-bold text-[#003366]">
                unitatea națională
              </span>
              ,{" "}
              <span className="font-bold text-[#003366]">
                progresul economic
              </span>{" "}
              și{" "}
              <span className="font-bold text-[#003366]">
                dreptatea socială
              </span>
              . Candidatura sa independentă este o garanție a unei Românii
              moderne, respectate și orientate către viitor.
            </p>
          </section>

          {/* Token Section */}
          <section
            id="token"
            className="bg-white text-[#18181b] rounded-md shadow-2xl p-8 lg:col-span-2 border-r-8 border-[#c00] transform hover:translate-y-[-5px] transition-transform duration-300"
          >
            {/* Branding & clarificare sistem */}
            <h3 className="text-3xl font-black text-[#c00] mb-4 uppercase border-b-4 border-[#003366] pb-2 flex items-center">
              <span className="mr-2">⚡</span> PONTA BLOCKCHAIN SISTEMUL{" "}
              <span className="ml-2">⚡</span>
            </h3>
            {/* Blockchain Animated Network */}
            <div className="w-full flex justify-center mb-8">
              <svg
                width="420"
                height="180"
                viewBox="0 0 420 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Blockchain nodes */}
                <circle
                  cx="60"
                  cy="90"
                  r="28"
                  fill="#fff200"
                  stroke="#c00"
                  strokeWidth="4"
                  className="animate-node-throb"
                />
                <circle
                  cx="180"
                  cy="40"
                  r="22"
                  fill="#003366"
                  stroke="#fff200"
                  strokeWidth="3"
                  className="animate-node-pulse"
                />
                <circle
                  cx="180"
                  cy="140"
                  r="22"
                  fill="#003366"
                  stroke="#fff200"
                  strokeWidth="3"
                  className="animate-node-pulse"
                />
                <circle
                  cx="300"
                  cy="90"
                  r="28"
                  fill="#fff200"
                  stroke="#c00"
                  strokeWidth="4"
                  className="animate-node-throb"
                />
                <circle
                  cx="390"
                  cy="40"
                  r="18"
                  fill="#003366"
                  stroke="#fff200"
                  strokeWidth="3"
                  className="animate-node-pulse"
                />
                <circle
                  cx="390"
                  cy="140"
                  r="18"
                  fill="#003366"
                  stroke="#fff200"
                  strokeWidth="3"
                  className="animate-node-pulse"
                />
                {/* Connections */}
                <line
                  x1="88"
                  y1="90"
                  x2="158"
                  y2="40"
                  stroke="#c00"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                <line
                  x1="88"
                  y1="90"
                  x2="158"
                  y2="140"
                  stroke="#c00"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                <line
                  x1="208"
                  y1="40"
                  x2="272"
                  y2="90"
                  stroke="#003366"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                <line
                  x1="208"
                  y1="140"
                  x2="272"
                  y2="90"
                  stroke="#003366"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                <line
                  x1="328"
                  y1="90"
                  x2="372"
                  y2="40"
                  stroke="#c00"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                <line
                  x1="328"
                  y1="90"
                  x2="372"
                  y2="140"
                  stroke="#c00"
                  strokeWidth="3"
                  className="animate-network-pulse"
                />
                {/* Animated transaction (moving dot) */}
                <circle>
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    path="M60,90 C120,60 240,60 300,90"
                  />
                  <animate
                    attributeName="r"
                    values="6;10;6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="fill"
                    values="#c00;#fff200;#c00"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>

            {/* Blockchain Visualization - Enhanced Animated Network */}
            <div className="w-full flex flex-col items-center mb-8">
              <h4 className="text-xl font-bold text-[#003366] mb-4">
                PONTA Blockchain Network - Live Visualization
              </h4>
              <div className="relative w-full max-w-3xl h-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden p-4 border border-slate-700 shadow-xl">
                {/* Central Node */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fff200] to-[#c00] flex items-center justify-center animate-node-throb">
                    <span className="text-white font-bold text-sm">
                      MAINNET
                    </span>
                  </div>
                  <div className="absolute left-1/2 top-1/2 w-24 h-24 rounded-full border-2 border-[#c00] transform -translate-x-1/2 -translate-y-1/2 animate-ping-slow opacity-50"></div>
                </div>

                {/* Orbital Nodes */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      animation: `orbit${i % 8} ${10 + i * 2}s linear infinite`,
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${
                        i % 2 === 0 ? "bg-[#003366]" : "bg-[#c00]"
                      } flex items-center justify-center shadow-glow-sm`}
                    >
                      <span className="text-white text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Data Packets */}
                {[0, 1, 2].map((i) => (
                  <div
                    key={`packet-${i}`}
                    className="absolute"
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${30 + i * 20}%`,
                      animation: `dataPacket ${3 + i}s ease-out infinite ${
                        i * 0.5
                      }s`,
                    }}
                  >
                    <div className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs text-white font-mono shadow-glow-sm whitespace-nowrap">
                      {["Tx: 0x8a...3f", "Block: 65432", "Hash: 0xF8...9c"][i]}
                    </div>
                  </div>
                ))}

                {/* Connection Lines */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ zIndex: 0 }}
                >
                  {/* Grid Lines */}
                  <pattern
                    id="grid"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="1 3"
                    />
                  </pattern>
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="url(#grid)"
                  />

                  {/* Dynamic Connection Lines */}
                  {[
                    { x1: "30%", y1: "40%", x2: "50%", y2: "50%" },
                    { x1: "70%", y1: "40%", x2: "50%", y2: "50%" },
                    { x1: "20%", y1: "60%", x2: "50%", y2: "50%" },
                    { x1: "80%", y1: "60%", x2: "50%", y2: "50%" },
                    { x1: "40%", y1: "20%", x2: "50%", y2: "50%" },
                    { x1: "60%", y1: "20%", x2: "50%", y2: "50%" },
                    { x1: "40%", y1: "80%", x2: "50%", y2: "50%" },
                    { x1: "60%", y1: "80%", x2: "50%", y2: "50%" },
                  ].map((line, i) => (
                    <line
                      key={`line-${i}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={i % 2 === 0 ? "#c00" : "#003366"}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="animate-pulse-slow"
                    />
                  ))}

                  {/* Data Transfer Lines */}
                  {[
                    { x1: "30%", y1: "40%", x2: "50%", y2: "50%", delay: "0s" },
                    {
                      x1: "70%",
                      y1: "40%",
                      x2: "50%",
                      y2: "50%",
                      delay: "0.7s",
                    },
                    {
                      x1: "20%",
                      y1: "60%",
                      x2: "50%",
                      y2: "50%",
                      delay: "1.4s",
                    },
                    {
                      x1: "80%",
                      y1: "60%",
                      x2: "50%",
                      y2: "50%",
                      delay: "2.1s",
                    },
                  ].map((line, i) => (
                    <line
                      key={`data-line-${i}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={i % 2 === 0 ? "#fff200" : "#ffffff"}
                      strokeWidth="2"
                      strokeDasharray="3 17"
                      style={{
                        animation: `txnLine 3s ease infinite ${line.delay}`,
                        opacity: 0,
                      }}
                    />
                  ))}
                </svg>

                {/* Stats Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-white font-mono bg-black bg-opacity-40 backdrop-blur-sm p-2 rounded">
                  <div>
                    Blocks: <span className="text-[#fff200]">65,432</span>
                  </div>
                  <div>
                    Txns: <span className="text-[#fff200]">1,532,765</span>
                  </div>
                  <div>
                    Users:{" "}
                    <span className="text-[#fff200]">
                      {users.length || "0"}
                    </span>
                  </div>
                </div>

                {/* Tech Binary Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                  <div className="binary-rain">
                    {"10010110010101010001110101010110110"
                      .split("")
                      .map((char, i) => (
                        <span
                          key={i}
                          style={{
                            position: "absolute",
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            color: char === "1" ? "#c00" : "#fff200",
                            fontSize: `${Math.random() * 10 + 8}px`,
                            opacity: Math.random() * 0.8 + 0.2,
                            animation: `float ${
                              Math.random() * 10 + 5
                            }s infinite linear`,
                          }}
                        >
                          {char}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-600 mt-2">
                PONTA Blockchain • Vizualizare grafică în timp real • Blockchain
                tehnologie sigură
              </div>
            </div>

            {/* Lista adrese blockchain MUTATĂ ÎN ACEASTĂ SECȚIUNE */}
            <section className="mb-8 bg-yellow-50 rounded shadow p-4 border-2 border-[#c00]">
              <h3 className="text-xl font-bold text-[#c00] mb-2">
                Adrese Blockchain Utilizatori
              </h3>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #eee",
                  padding: 8,
                }}
              >
                <ul className="text-sm">
                  {users.length === 0 && (
                    <li>Niciun utilizator înregistrat.</li>
                  )}
                  {users.map((user) => (
                    <li key={user.username} className="mb-2">
                      <span className="font-bold text-[#003366]">
                        {user.username}
                      </span>
                      : <span className="font-mono">{user.address}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-[#003366] text-white rounded text-xs font-bold hover:bg-[#002244]"
                        onClick={() =>
                          navigator.clipboard.writeText(user.address)
                        }
                        title="Copiază adresa pentru transfer Bitcoin în portofel"
                      >
                        Copiază adresă
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Folosește adresa de mai sus pentru a transfera Bitcoin în
                portofelul fiecărui utilizator.
              </div>
            </section>
            <div className="mb-4 px-6 py-3 bg-yellow-200 text-[#c00] rounded-md font-bold shadow border-2 border-[#c00] text-center">
              <span>
                PONTA Blockchain Sistemul este infrastructura digitală publică
                și distribuită pentru gestionarea monedei <b>PONTA Token</b>.
                <br />
                <b>PONTA Token</b> este moneda digitală oficială a sistemului
                PONTA Blockchain.
              </span>
            </div>
            {/* UTILITATEA TOKENULUI */}
            <div className="mb-6 px-6 py-4 bg-[#fff200] text-[#003366] rounded-md font-black shadow-lg border-4 border-[#c00] text-lg text-center">
              <span className="block text-xl mb-2">
                UTILITATEA TOKENULUI PONTA
              </span>
              <span className="block text-base font-normal text-[#18181b]">
                Tokenul <b>PONTA</b> va fi folosit ca vot digital pentru
                viitoarele propuneri făcute de Președinte și pentru inițiativele
                propuse de cetățeni. Oricine deține tokenuri va putea vota sau
                propune noi proiecte pentru România.{" "}
                <b>Tokenul NU are valoare financiară</b>, ci doar rol de
                participare civică și democratică în platforma PONTA Blockchain.
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#f8f8f8] p-4 rounded-md border-2 border-[#003366]">
                <div className="font-bold text-[#003366] uppercase text-sm">
                  Nume:
                </div>
                <div className="text-[#c00] font-black text-xl">PONTA2025</div>
              </div>
              <div className="bg-[#f8f8f8] p-4 rounded-md border-2 border-[#003366]">
                <div className="font-bold text-[#003366] uppercase text-sm">
                  Simbol:
                </div>
                <div className="text-[#c00] font-black text-xl">PONTA</div>
              </div>
              <div className="bg-[#f8f8f8] p-4 rounded-md border-2 border-[#003366]">
                <div className="font-bold text-[#003366] uppercase text-sm">
                  Monedă:
                </div>
                <div className="text-[#c00] font-black text-xl">
                  PONTA Token
                </div>
              </div>
              <div className="bg-[#f8f8f8] p-4 rounded-md border-2 border-[#003366]">
                <div className="font-bold text-[#003366] uppercase text-sm">
                  Supply:
                </div>
                <div className="text-[#c00] font-black text-xl">
                  220.000.000
                </div>
              </div>
            </div>
            {/* WALLET UI: registration, mining, balance, transfer */}
            <main className="mt-8">
              {!registered ? (
                <>
                  <form
                    onSubmit={handleRegister}
                    className="flex flex-col items-center bg-[#f8f8f8] p-6 rounded-md border-2 border-[#003366] mb-6"
                  >
                    <h4 className="text-2xl font-black text-[#003366] mb-4 uppercase text-center">
                      Creează portofel PONTA Blockchain
                    </h4>
                    <input
                      type="text"
                      placeholder="Alege un username unic (portofel)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#003366] rounded-md text-lg focus:outline-none focus:border-[#c00] mb-4"
                      maxLength={32}
                      required
                    />
                    {error && (
                      <div className="text-[#c00] font-bold mb-3 bg-[#ffeeee] p-2 rounded-md w-full text-center">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-8 py-4 bg-[#003366] text-white rounded-md font-black shadow-lg hover:bg-[#002244] text-lg transition w-full uppercase tracking-wider transform hover:translate-y-[-2px]"
                    >
                      Creează portofel și primește 1.000 PONTA Blockchain
                    </button>
                  </form>
                  {/* Login with private key */}
                  <form
                    onSubmit={handleLogin}
                    className="flex flex-col items-center bg-[#f8f8f8] p-6 rounded-md border-2 border-[#003366]"
                  >
                    <h4 className="text-2xl font-black text-[#003366] mb-4 uppercase text-center">
                      Accesează portofel existent
                    </h4>
                    <input
                      type="text"
                      placeholder="Cheia privată (private key)"
                      value={loginKey}
                      onChange={(e) => setLoginKey(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#003366] rounded-md text-lg focus:outline-none focus:border-[#c00] mb-4"
                      required
                    />
                    {loginError && (
                      <div className="text-[#c00] font-bold mb-3 bg-[#ffeeee] p-2 rounded-md w-full text-center">
                        {loginError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-8 py-4 bg-[#003366] text-white rounded-md font-black shadow-lg hover:bg-[#002244] text-lg transition w-full uppercase tracking-wider transform hover:translate-y-[-2px]"
                    >
                      Accesează portofelul
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center bg-[#f8f8f8] p-6 rounded-md border-2 border-[#003366]">
                  {/* Wallet info after registration - AFIȘARE SUS */}
                  {walletInfo && walletInfo.privateKey ? (
                    <div className="mb-6 p-4 bg-yellow-100 border-2 border-[#c00] rounded text-center">
                      <div className="font-bold text-[#003366] mb-2">
                        Adresa ta de wallet:
                      </div>
                      <div className="font-mono break-all text-xs mb-2">
                        {walletInfo.address}
                      </div>
                      <div className="font-bold text-[#c00] mb-2">
                        Cheia ta privată (salveaz-o în siguranță!):
                      </div>
                      <div
                        className="font-mono break-all text-xs mb-2"
                        style={{ background: "#eee", padding: "8px" }}
                      >
                        {walletInfo.privateKey}
                      </div>
                      <div className="text-xs text-[#c00] font-bold">
                        ATENȚIE: Cheia privată NU se recuperează! Salveaz-o
                        pentru a accesa portofelul tău ulterior.
                      </div>
                    </div>
                  ) : (
                    walletInfo && (
                      <div className="mb-6 p-4 bg-yellow-100 border-2 border-[#c00] rounded text-center">
                        <div className="font-bold text-[#c00] mb-2">
                          Cheia privată este afișată doar la crearea contului.
                          Dacă nu ai salvat-o, creează un cont nou!
                        </div>
                      </div>
                    )
                  )}
                  <div className="mb-4 px-6 py-3 bg-[#fff200] text-[#003366] rounded-md font-black shadow-lg border-4 border-[#c00] text-lg text-center">
                    <span className="block text-xl uppercase mb-1">
                      Portofel creat!
                    </span>
                    Username-ul tău (portofel):{" "}
                    <span className="text-[#c00] font-black">{username}</span>
                    <br />
                    Ai primit{" "}
                    <span className="text-[#c00] font-black">1.000</span> PONTA
                    Blockchain.
                  </div>
                  <div className="mb-2 text-lg font-bold text-[#003366]">
                    Balanța ta:{" "}
                    <span className="text-[#c00]">{balance ?? "..."}</span>{" "}
                    PONTA Blockchain
                  </div>
                  <button
                    onClick={handleMine}
                    className="px-8 py-4 bg-[#c00] text-white rounded-md font-black shadow-lg hover:bg-[#a00] text-lg transition w-full uppercase tracking-wider mb-4"
                  >
                    Minează 400 PONTA Blockchain (o dată la 24h)
                  </button>
                  {txMessage && (
                    <div className="mt-2 text-[#003366] font-bold">
                      {txMessage}
                    </div>
                  )}
                  <form
                    onSubmit={handleTransfer}
                    className="w-full flex flex-col gap-2 mt-4"
                  >
                    <div className="font-bold text-[#003366]">
                      Transferă PONTA Blockchain:
                    </div>
                    <input
                      type="text"
                      placeholder="Username destinatar (portofel)"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Suma"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      min={1}
                      required
                    />
                    <button
                      type="submit"
                      className="bg-[#003366] text-white px-4 py-2 rounded font-bold mt-2"
                    >
                      Trimite
                    </button>
                  </form>
                  {txMessage && (
                    <div className="mt-2 text-[#003366] font-bold">
                      {txMessage}
                    </div>
                  )}
                </div>
              )}
            </main>
            {/* Devnet/Mainnet Notice */}
            <div className="mb-4 px-6 py-3 bg-yellow-200 text-[#c00] rounded-md font-bold shadow border-2 border-[#c00] text-center">
              <span>
                Acest sistem rulează pe PONTA Blockchain. MONEDA/TOKEN NU ARE
                NICI O VALOARE FINANCIARA ESTE DOAR PENTRU A DEMOSTRA UTILITATEA
                BLOCKCHAIN
              </span>
            </div>
          </section>

          {/* PONTA AI Section - Tech & Professional Redesign */}
          <section className="my-12 max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border-4 border-[#003366] p-10 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-10 select-none">
              <svg width="100%" height="100%" viewBox="0 0 600 300">
                <defs>
                  <linearGradient id="aiGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#003366" />
                    <stop offset="100%" stopColor="#c00" />
                  </linearGradient>
                </defs>
                <circle cx="500" cy="60" r="80" fill="url(#aiGradient)" />
                <rect
                  x="60"
                  y="200"
                  width="200"
                  height="40"
                  rx="20"
                  fill="#003366"
                />
                <rect
                  x="400"
                  y="120"
                  width="120"
                  height="20"
                  rx="10"
                  fill="#c00"
                />
                <rect
                  x="200"
                  y="40"
                  width="80"
                  height="20"
                  rx="10"
                  fill="#003366"
                />
              </svg>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block text-4xl">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#003366" />
                  <path
                    d="M24 36c6.627 0 12-5.373 12-12S30.627 12 24 12 12 17.373 12 24s5.373 12 12 12Z"
                    fill="#fff"
                  />
                  <circle cx="19" cy="23" r="2" fill="#003366" />
                  <circle cx="29" cy="23" r="2" fill="#003366" />
                  <rect
                    x="20"
                    y="28"
                    width="8"
                    height="2"
                    rx="1"
                    fill="#003366"
                  />
                </svg>
              </span>
              <h3 className="text-4xl font-black text-[#003366] tracking-tight uppercase">
                PONTA AI
              </h3>
            </div>
            <div className="w-16 h-1 bg-[#c00] rounded-full mb-6"></div>
            <p className="text-[#18181b] text-lg mb-6 text-center max-w-xl">
              <b>PONTA AI</b> este asistentul tău digital pentru blockchain,
              tehnologie, campanie și România. Răspunsurile sunt generate de AI
              Ponta, cu context profesional și actual.
            </p>
            <form
              className="w-full flex flex-col sm:flex-row gap-4 mb-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setAiError("");
                setAiResponse("");
                setAiLoading(true);
                try {
                  const contextPrompt = `You are PONTA AI, the official assistant of the Victor Ponta 2025 presidential campaign website. This website is a modern, interactive campaign platform for Victor Viorel Ponta, featuring blockchain technology (PONTA Blockchain), a digital wallet, polls, and information about the candidate. You help users with questions about the campaign, blockchain, technology, and Romania. Always answer as PONTA AI, in a professional, friendly, and clear manner. Website context: presidential campaign, blockchain, digital wallet, polls, Victor Ponta, Romania, technology, innovation.`;
                  const res = await fetch(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAkjNrWeKbi2vecN7EjTKzmm5LSkmTaZBk",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        contents: [
                          {
                            parts: [
                              {
                                text: `${contextPrompt}\nUser: ${aiInput}`,
                              },
                            ],
                          },
                        ],
                      }),
                    }
                  );
                  const data = await res.json();
                  if (
                    data.candidates &&
                    data.candidates[0]?.content?.parts[0]?.text
                  ) {
                    setAiResponse(data.candidates[0].content.parts[0].text);
                  } else {
                    setAiError("Nu am putut obține un răspuns de la AI.");
                  }
                } catch (err) {
                  setAiError(
                    "Eroare la conectarea cu AI-ul. Încearcă din nou."
                  );
                } finally {
                  setAiLoading(false);
                }
              }}
            >
              <input
                type="text"
                className="flex-1 px-4 py-4 border-2 border-[#003366] rounded-lg text-lg focus:outline-none focus:border-[#c00] bg-white placeholder-gray-400 shadow-sm transition-all duration-200"
                placeholder="Scrie întrebarea ta pentru PONTA AI..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                required
                maxLength={200}
                disabled={aiLoading}
                style={{ minHeight: 56 }}
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#003366] text-white rounded-lg font-black shadow-lg hover:bg-[#c00] text-lg transition uppercase tracking-wider flex items-center justify-center gap-2"
                disabled={aiLoading || !aiInput.trim()}
                style={{ minHeight: 56 }}
              >
                {aiLoading ? (
                  <span className="animate-spin-slow inline-block mr-2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#fff"
                        strokeWidth="4"
                        opacity="0.2"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                ) : null}
                {aiLoading ? "Așteaptă..." : "TRIMITE CĂTRE PONTA AI"}
              </button>
            </form>
            {aiError && (
              <div className="text-[#c00] font-bold mb-3 bg-[#f8d7da] p-3 rounded-md w-full text-center border-2 border-[#c00]">
                {aiError}
              </div>
            )}
            {aiResponse && (
              <div className="w-full bg-[#f4f8fb] border-2 border-[#003366] rounded-xl p-6 mt-2 text-[#003366] text-lg whitespace-pre-line shadow animate-pulse-slow font-mono">
                <b className="text-[#c00]">Răspuns PONTA AI:</b>
                <br />
                {aiResponse}
              </div>
            )}
          </section>

          {/* Poll Results Section */}
          <section
            id="sondaje"
            className="bg-white text-[#18181b] rounded-md shadow-2xl p-8 lg:col-span-3 border-t-8 border-[#003366] transform hover:translate-y-[-5px] transition-transform duration-300"
          >
            <h3 className="text-3xl font-black text-[#003366] mb-6 uppercase border-b-4 border-[#c00] pb-2 flex items-center">
              <span className="mr-2">
                <svg
                  className="w-8 h-8 text-[#003366]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              Cel mai recent sondaj Sociopol
              <span className="ml-2">
                <svg
                  className="w-8 h-8 text-[#003366]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
            </h3>

            <div className="mb-8">
              <div className="bg-gray-100 p-4 rounded-md border-l-4 border-[#003366] text-sm mb-6">
                <p className="font-bold text-[#003366]">Notă:</p>
                <p className="text-[#18181b]">
                  Datele prezentate sunt din sondajul realizat de institutul
                  Sociopol condus de Marius Pieleanu. Victor Ponta nu este
                  afiliat cu acest institut și nu a comandat acest sondaj.
                </p>
              </div>

              <div className="bg-white border-2 border-[#003366] rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-[#c00]">
                      {polls[0]?.title}
                    </h4>
                    <p className="text-lg text-[#003366] font-semibold mt-1">
                      {polls[0]?.question}
                    </p>
                    <div className="text-sm text-gray-500 mt-1">
                      Sursă: {polls[0]?.source} | Data: {polls[0]?.date}
                    </div>
                  </div>

                  <div className="bg-[#003366] text-white p-3 rounded-md">
                    <div className="font-bold">Sondaj oficial</div>
                    <div className="text-xs">Eșantion: 1050 respondenți</div>
                    <div className="text-xs">Marja de eroare: ±3%</div>
                  </div>
                </div>

                <div className="mt-6">
                  {polls[0]?.results?.map((result: Poll["results"][0]) => (
                    <div key={result.id} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span
                          className={`font-bold ${
                            result.highlighted ? "text-[#c00]" : ""
                          }`}
                        >
                          {result.candidate}
                        </span>
                        <span
                          className={`font-bold ${
                            result.highlighted ? "text-[#c00]" : ""
                          }`}
                        >
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className={`h-6 rounded-full ${
                            result.highlighted ? "bg-[#c00]" : "bg-[#003366]"
                          }`}
                          style={{
                            width:
                              typeof result.percentage === "number"
                                ? `${result.percentage}%`
                                : undefined,
                          }}
                        >
                          {typeof result.percentage === "number" &&
                            result.percentage > 10 && (
                              <span className="px-2 text-white font-bold">
                                {result.percentage}%
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-sm text-gray-500 italic">
                  * Sondaj prezentat în mass-media. Pentru detalii complete,
                  consultați site-ul oficial Sociopol.
                </div>
              </div>
            </div>

            <div className="text-center mt-6 p-4 bg-[#fff200] rounded-md border-2 border-[#c00]">
              <p className="text-lg font-bold text-[#003366]">
                Victor Ponta se află pe poziția a 2-a în intenția de vot! 📈
              </p>
              <p className="text-[#18181b] mt-2">
                Conform ultimelor date, candidatura independentă a lui Victor
                Ponta câștigă tot mai multă tracțiune în rândul alegătorilor.
              </p>
            </div>
          </section>
        </div>

        {/* Update navigation to include polls */}
        <div className="fixed bottom-4 right-4 z-50">
          <a
            href="#sondaje"
            className="flex items-center justify-center w-14 h-14 bg-[#c00] text-white rounded-full shadow-lg hover:bg-[#a00] transition-transform transform hover:scale-110"
            title="Sondaje de opinie"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </a>
        </div>

        {/* Legal/Publicity Info */}
        <footer className="bg-white text-black text-center py-6 mt-auto text-sm border-t-2 border-[#c00]">
          <div className="mb-2 font-extrabold">
            MATERIAL PUBLICITAR POLITIC VICTOR VIOREL PONTA Candidat independent
          </div>
          <div className="mb-1">
            victorponta25@gmail.com, strada Gina Patrichi nr. 10
          </div>
          <div className="mb-1">CMF 34250002</div>
          <div>CPP A1B1C1D1E1</div>
        </footer>
      </div>
      {/* Move the style block here, inside the return */}
      {/* Use a regular <style> tag for global CSS to avoid JSX/TS errors */}
      <style>{`
        /* Base animations */
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-spin-super-slow {
          animation: spin 8s linear infinite;
        }
        .animate-spin-medium {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }

        /* Advanced animations for blockchain visualization */
        .animate-float {
          animation: float 3s ease-in-out infinite alternate;
        }
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-15px);
          }
        }

        .animate-dash {
          animation: dash 1.5s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -18;
          }
        }

        .animate-txn-ping {
          animation: txnPing 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes txnPing {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          75%,
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .animate-txn-line {
          animation: txnLine 3s ease infinite;
        }
        @keyframes txnLine {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          90%,
          100% {
            stroke-dashoffset: -100;
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-pulse-text {
          animation: pulseText 2s infinite alternate;
        }
        @keyframes pulseText {
          0% {
            filter: drop-shadow(0 0 2px rgba(255, 242, 0, 0.8));
          }
          100% {
            filter: drop-shadow(0 0 8px rgba(204, 0, 0, 0.8));
          }
        }

        .animate-pulse-slow {
          animation: pulseSlow 4s infinite alternate;
        }
        @keyframes pulseSlow {
          0% {
            transform: scale(0.95);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .animate-pulse-fast {
          animation: pulseFast 1.5s infinite alternate;
        }
        @keyframes pulseFast {
          0% {
            opacity: 0.85;
          }
          100% {
            opacity: 1;
            filter: brightness(1.2);
          }
        }

        /* Network animations */
        .animate-network-pulse {
          animation: networkPulse 2s infinite alternate;
        }
        @keyframes networkPulse {
          0% {
            stroke-opacity: 0.5;
          }
          100% {
            stroke-opacity: 1;
          }
        }

        .animate-data-packet {
          animation: dataPacket 3s ease-out infinite;
        }
        @keyframes dataPacket {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            transform: scale(1);
            opacity: 1;
          }
          80%,
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        .animate-node-pulse {
          animation: nodePulse 2s infinite alternate;
        }
        @keyframes nodePulse {
          0% {
            r: 18;
            opacity: 0.5;
          }
          100% {
            r: 22;
            opacity: 1;
          }
        }

        .animate-node-throb {
          animation: nodeThrob 1.5s infinite alternate;
        }
        @keyframes nodeThrob {
          0% {
            transform: scale(0.95);
            filter: brightness(0.9);
          }
          100% {
            transform: scale(1.08);
            filter: brightness(1.2);
          }
        }

        .animate-center-node-pulse {
          animation: centerNodePulse 3s infinite alternate;
        }
        @keyframes centerNodePulse {
          0% {
            r: 25;
            filter: drop-shadow(0 0 5px rgba(255, 242, 0, 0.8));
          }
          100% {
            r: 30;
            filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.8));
          }
        }

        .animate-text-glow {
          animation: textGlow 2
      `}</style>
    </div>
  );
}
